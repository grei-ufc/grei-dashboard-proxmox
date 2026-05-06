import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';


// ==========================================
// CONFIGURAÇÕES DO PROXMOX (via variáveis de ambiente)
// ==========================================
const PROXMOX_HOST = process.env.PROXMOX_HOST;
const TOKEN_ID = process.env.PROXMOX_TOKEN_ID;
const TOKEN_SECRET = process.env.PROXMOX_TOKEN_SECRET;

// Configuração do Axios para ignorar certificados auto-assinados e usar o Token
const api = axios.create({
   baseURL: `${PROXMOX_HOST}/api2/json`,
   headers: { 'Authorization': `PVEAPIToken=${TOKEN_ID}=${TOKEN_SECRET}` },
   httpsAgent: new https.Agent({ rejectUnauthorized: false }),
   timeout: 5000,
});

function formatUptime(seconds) {
   if (!seconds) return '0s';
   const days = Math.floor(seconds / 86400);
   const hours = Math.floor((seconds % 86400) / 3600);
   const minutes = Math.floor((seconds % 3600) / 60);
   if (days > 0) return `${days}d ${hours}h`;
   return `${hours}h ${minutes}m`;
}

function getVmStatusIcon(status, qmpstatus) {
   if (status === 'stopped') return '🔴 DESLIGADA';
   if (qmpstatus === 'paused') return '🟡 PAUSADA';
   if (status === 'running') return '🟢 RODANDO';
   return `⚪ ${status ? status.toUpperCase() : 'UNKNOWN'}`;
}

async function fetchAllData() {
   const allVMs = [];
   let storageSummary = [];
   try {
      // 1. Coleta resumida de todas as VMs do Cluster
      const resourcesResp = await api.get('/cluster/resources?type=vm');
      const vmsSummary = resourcesResp.data.data || [];

      // 1b. Coleta storage do datacenter
      const storageResp = await api.get('/cluster/resources?type=storage');
      storageSummary = storageResp.data.data || [];

      for (const vm of vmsSummary) {
         const { node, vmid, name = 'N/A' } = vm;
         let s = {};
         let diskSize = 0;
         try {
            // 2. Coleta detalhada (Status atual, CPU, RAM, QMP)
            const statusResp = await api.get(`/nodes/${node}/qemu/${vmid}/status/current`);
            s = statusResp.data.data || {};
         } catch (err) {
            // Caso falhe o detalhe de uma VM específica, continua para a próxima
         }
         // 2b. Coleta tamanho do disco alocado (storage)
         try {
            const configResp = await api.get(`/nodes/${node}/qemu/${vmid}/config`);
            const config = configResp.data.data || {};
            // Procura discos (ex: scsi0, sata0, ide0, virtio0, etc)
            Object.keys(config).forEach((key) => {
               if (/^(scsi|sata|ide|virtio)\d+$/.test(key) && typeof config[key] === 'string') {
                  const match = config[key].match(/size=(\d+)([A-Za-z]+)/);
                  if (match) {
                     const size = parseInt(match[1], 10);
                     const unit = match[2].toUpperCase();
                     // Converte para bytes
                     let bytes = size;
                     if (unit === 'G' || unit === 'GB') bytes = size * 1024 ** 3;
                     else if (unit === 'M' || unit === 'MB') bytes = size * 1024 ** 2;
                     else if (unit === 'T' || unit === 'TB') bytes = size * 1024 ** 4;
                     diskSize += bytes;
                  }
               }
            });
         } catch (err) {
            // Se falhar, ignora
         }
         const statusDisplay = getVmStatusIcon(s.status, s.qmpstatus);
         // Métricas de Hardware
         const memUsed = (s.mem || 0) / (1024 ** 2);
         const memMax = (s.maxmem || 0) / (1024 ** 2);
         const cpuPct = (s.cpu || 0) * 100;
         // Métricas de I/O
         const diskR = (s.diskread || 0) / (1024 ** 2);
         const diskW = (s.diskwrite || 0) / (1024 ** 2);
         const netIn = (s.netin || 0) / (1024 ** 2);
         const netOut = (s.netout || 0) / (1024 ** 2);
         // 3. Busca IPs via Guest Agent
         let ips = 'N/A';
         if (s.status === 'running' && s.qmpstatus !== 'paused') {
            try {
               const agentResp = await api.get(`/nodes/${node}/qemu/${vmid}/agent/network-get-interfaces`, { timeout: 2000 });
               const ifaces = agentResp.data.data?.result || [];
               const foundIps = [];
               ifaces.forEach((iface) => {
                  (iface['ip-addresses'] || []).forEach((addr) => {
                     if (addr['ip-address-type'] === 'ipv4' && addr['ip-address'] !== '127.0.0.1') {
                        foundIps.push(addr['ip-address']);
                     }
                  });
               });
               ips = foundIps.length > 0 ? foundIps.join(', ') : 'Sem IP';
            } catch (err) {
               ips = 'Agent Offline/Erro';
            }
         } else if (s.status !== 'running') {
            ips = 'Desligada';
         }
         // Detecta SO pelo nome do disco, args, ou guest os (quando disponível)
         let osType = 'unknown';
         // 1. guest osinfo (quando disponível)
         if (s?.osinfo?.type) {
            if (typeof s.osinfo.type === 'string') {
               if (s.osinfo.type.toLowerCase().includes('windows')) osType = 'windows';
               else if (s.osinfo.type.toLowerCase().includes('linux')) osType = 'linux';
            }
         }
         // 2. nome do disco/config
         if (osType === 'unknown' && typeof config === 'object') {
            const configStr = JSON.stringify(config).toLowerCase();
            if (configStr.includes('windows')) osType = 'windows';
            else if (configStr.includes('linux')) osType = 'linux';
         }
         // 3. nome da VM
         if (osType === 'unknown' && typeof name === 'string') {
            if (name.toLowerCase().includes('win')) osType = 'windows';
            else if (name.toLowerCase().includes('lin')) osType = 'linux';
         }
         allVMs.push({
            node,
            vmid,
            name,
            status: s.status || 'unknown',
            type: s.type || 'qemu',
            cpu: typeof s.cpu === 'number' ? s.cpu * 100 : 0,
            maxcpu: s.cpus || 1,
            mem: s.mem || 0,
            maxmem: s.maxmem || 0,
            disk: s.disk || 0,
            maxdisk: diskSize,
            uptime: s.uptime || 0,
            netin: s.netin || 0,
            netout: s.netout || 0,
            ip: ips,
            status_str: statusDisplay,
            // Para compatibilidade visual
            cores: s.cpus || 1,
            ram: `${memUsed.toFixed(0)}/${memMax.toFixed(0)} MB`,
            disk_str: `R:${diskR.toFixed(1)}MB | W:${diskW.toFixed(1)}MB`,
            net_str: `In:${netIn.toFixed(1)}MB | Out:${netOut.toFixed(1)}MB`,
            cpuHistory: Array.isArray(s.cpuHistory) ? s.cpuHistory : [],
            osType,
         });
      }
   } catch (err) {
      console.error(`❌ Erro ao conectar no Proxmox: ${err.message}`);
      return { vms: [], storage: [] };
   }
   return { vms: allVMs, storage: storageSummary };
}

export async function GET(request) {
   try {
      const { vms, storage } = await fetchAllData();
      return NextResponse.json({ vms, storage });
   } catch (err) {
      return NextResponse.json({ error: err.message || 'Erro desconhecido' }, { status: 500 });
   }
}
