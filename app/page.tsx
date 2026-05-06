"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { VMStatusCard } from "@/components/dashboard/vm-status-card"
import { Spinner } from "@/components/ui/spinner"
import { AlertNotifier } from "@/components/dashboard/alert-notifier"

export default function ProxmoxDashboard() {
   const [data, setData] = useState(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState(null)

   useEffect(() => {
      let isMounted = true;
      let firstLoad = true;
      const fetchData = () => {
         if (firstLoad) setLoading(true);
         setError(null);
         fetch("/api/proxmox/status")
            .then(async (res) => {
               const json = await res.json();
               // Se erro do backend (Proxmox), ou timeout, ou qualquer erro na resposta
               if (!res.ok || (json && typeof json.error === "string" && json.error.toLowerCase().includes("timeout"))) {
                  if (isMounted) setData({ vms: [], storage: [], apiError: json.error || "Erro ao conectar ao Proxmox" });
                  return;
               }
               if (isMounted) setData({ vms: json.vms || [], storage: json.storage || [] });
            })
            .catch((err) => isMounted && setError(err.message))
            .finally(() => {
               if (firstLoad) setLoading(false);
               firstLoad = false;
            });
      };
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => {
         isMounted = false;
         clearInterval(interval);
      };
   }, [])

   if (loading) {
      return (
         <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <Spinner className="h-8 w-8 text-primary" />
               <span className="text-muted-foreground">Carregando dados do cluster...</span>
            </div>
         </div>
      )
   }

   // Se erro de API (Proxmox), manter último dado exibido, mas sinalizar desconexão
   const isApiError = !!(data && data.apiError);
   const isConnected = !isApiError;

   // Adaptar dados agregados para StatsGrid
   const vms = data?.vms || [];
   const storage = data?.storage || [];
   const totalCpu = vms.reduce((acc, vm) => acc + (vm.maxcpu || 1), 0);
   const usedCpu = vms.reduce((acc, vm) => acc + ((vm.cpu || 0) / 100) * (vm.maxcpu || 1), 0);
   const totalMem = vms.reduce((acc, vm) => acc + (vm.maxmem || 0), 0);
   const usedMem = vms.reduce((acc, vm) => acc + (vm.mem || 0), 0);

   // Agregação de storage global do datacenter
   const totalDisk = storage.reduce((acc, s) => acc + (typeof s.total === 'number' ? s.total : 0), 0);
   const usedDisk = storage.reduce((acc, s) => acc + (typeof s.used === 'number' ? s.used : 0), 0);

   const totalVMs = vms.length;
   const runningVMs = vms.filter(vm => vm.status === "running").length;
   // Se erro, força status crítico e desconectado
   const clusterData = {
      name: "Proxmox Cluster",
      status: isApiError ? "critical" : "healthy",
      nodes: [],
      vms,
      totalCpu,
      usedCpu,
      totalMem,
      usedMem,
      totalDisk,
      usedDisk,
      totalVMs,
      runningVMs,
      lastUpdate: new Date().toLocaleString(),
   };

   const sortedVMs = [...vms].sort((a, b) => {
      // Ordena pelo ID numérico
      const idA = Number(a.vmid || a.id)
      const idB = Number(b.vmid || b.id)
      return idA - idB
   })

   const cpuPercent = clusterData.totalCpu > 0 ? (clusterData.usedCpu / clusterData.totalCpu) * 100 : 0;
   const memPercent = clusterData.totalMem > 0 ? (clusterData.usedMem / clusterData.totalMem) * 100 : 0;
   const diskPercent = clusterData.totalDisk > 0 ? (clusterData.usedDisk / clusterData.totalDisk) * 100 : 0;

   return (
      <div className="min-h-screen bg-background flex flex-col">
         <DashboardHeader
            clusterName={clusterData.name}
            clusterStatus={clusterData.status}
            isConnected={isConnected}
            lastUpdate={clusterData.lastUpdate}
         />
         <AlertNotifier cpuPercent={cpuPercent} memPercent={memPercent} diskPercent={diskPercent} />
         <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Stats Overview */}
            <StatsGrid data={clusterData} />

            {/* VMs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {sortedVMs.map((vm) => (
                  <div key={vm.vmid || vm.id} className={isConnected ? "" : "opacity-50 pointer-events-none"}>
                     <VMStatusCard vm={vm} />
                  </div>
               ))}
            </div>
            {/* Mensagem de erro de conexão */}
            {isApiError && (
               <div className="mt-6 flex justify-center">
                  <div className="px-4 py-2 rounded bg-status-critical/10 text-status-critical border border-status-critical/30 text-center">
                     Erro de conexão com o Proxmox. Exibindo dados em cache.<br />
                     {data.apiError}
                  </div>
               </div>
            )}
         </main>
      </div>
   )
}
