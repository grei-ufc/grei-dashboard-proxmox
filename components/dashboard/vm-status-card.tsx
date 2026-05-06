"use client"

import { Monitor, Container, AlertTriangle, Wind, Terminal, HelpCircle } from "lucide-react"
import type { VMData } from "@/lib/proxmox-types"
import { Sparkline } from "./sparkline"
import { cn } from "@/lib/utils"

interface VMStatusCardProps {
   vm: VMData
}

function formatBytes(bytes: number): string {
   if (bytes === 0) return "0 B"
   const k = 1024
   const sizes = ["B", "KB", "MB", "GB", "TB"]
   const i = Math.floor(Math.log(bytes) / Math.log(k))
   return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
   if (seconds === 0) return "-"
   const days = Math.floor(seconds / 86400)
   const hours = Math.floor((seconds % 86400) / 3600)
   if (days > 0) return `${days}d ${hours}h`
   const minutes = Math.floor((seconds % 3600) / 60)
   return `${hours}h ${minutes}m`
}

export function VMStatusCard({ vm }: VMStatusCardProps) {
   const isRunning = vm.status === "running"
   const isCritical = isRunning && vm.cpu > 90
   const isWarning = isRunning && vm.cpu > 70 && vm.cpu <= 90

   const statusConfig = {
      running: {
         color: "text-status-online",
         bgColor: "bg-status-online",
         label: "Ativo",
      },
      stopped: {
         color: "text-status-offline",
         bgColor: "bg-status-offline",
         label: "Parado",
      },
      paused: {
         color: "text-status-warning",
         bgColor: "bg-status-warning",
         label: "Pausado",
      },
      suspended: {
         color: "text-status-warning",
         bgColor: "bg-status-warning",
         label: "Suspenso",
      },
   }

   const status = statusConfig[vm.status] || {
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      label: vm.status ? vm.status.charAt(0).toUpperCase() + vm.status.slice(1) : "Desconhecido",
   }
   const memPercent = vm.maxmem > 0 ? (vm.mem / vm.maxmem) * 100 : 0

   const sparklineColor = isCritical
      ? "var(--status-critical)"
      : isWarning
         ? "var(--status-warning)"
         : "var(--primary)"

   return (
      <div
         className={cn(
            "relative flex flex-col p-4 rounded-xl bg-card border border-border/50 transition-all duration-300",
            isCritical && "border-status-critical/50 shadow-[0_0_20px_-5px_oklch(0.65_0.25_25_/_0.4)] animate-pulse",
            isWarning && "border-status-warning/30"
         )}
      >
         {/* Header */}
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
               {vm.type === "qemu" ? (
                  <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
               ) : (
                  <Container className="h-4 w-4 text-muted-foreground shrink-0" />
               )}
               {/* Ícone do SO */}
               {vm.osType === "windows" ? (
                  <Wind className="h-4 w-4 text-blue-600 shrink-0" title="Windows" />
               ) : vm.osType === "linux" ? (
                  <Terminal className="h-4 w-4 text-green-600 shrink-0" title="Linux" />
               ) : (
                  <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" title="SO desconhecido" />
               )}
               <span className="font-medium text-foreground truncate" title={vm.name}>
                  {vm.name}
               </span>
               {/* CPU alocada */}
               <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {vm.maxcpu || 1} CPU
               </span>
            </div>
            <div className="flex items-center gap-2">
               {isCritical && (
                  <AlertTriangle className="h-4 w-4 text-status-critical animate-pulse" />
               )}
               <div className="flex items-center gap-1.5">
                  <span className={`relative flex h-2 w-2`}>
                     {isRunning && (
                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", status.bgColor)}></span>
                     )}
                     <span className={cn("relative inline-flex rounded-full h-2 w-2", status.bgColor)}></span>
                  </span>
                  <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
               </div>
            </div>
         </div>

         {/* Stats */}
         {/* Sempre mostrar informações, mesmo se parada */}
         <div className="space-y-2">
            {/* CPU */}
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">CPU</span>
                  <span className={cn(
                     "font-mono text-sm font-semibold tabular-nums",
                     isCritical ? "text-status-critical" : isWarning ? "text-status-warning" : "text-foreground"
                  )}>
                     {vm.cpu.toFixed(1)}%
                  </span>
               </div>
               <Sparkline
                  data={vm.cpuHistory}
                  width={80}
                  height={24}
                  strokeColor={sparklineColor}
                  fillColor={sparklineColor}
               />
            </div>

            {/* RAM */}
            <div className="space-y-1">
               <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">RAM</span>
                  <span className="font-mono text-foreground">
                     {formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}
                  </span>
               </div>
               <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                     className={cn(
                        "h-full rounded-full transition-all duration-500",
                        memPercent > 90 ? "bg-status-critical" : memPercent > 70 ? "bg-status-warning" : "bg-primary"
                     )}
                     style={{ width: `${Math.min(100, memPercent)}%` }}
                  />
               </div>
            </div>

            {/* Disco */}
            <div className="flex items-center justify-between text-xs">
               <span className="text-muted-foreground">Disco</span>
               <span className="font-mono text-foreground">
                  {vm.maxdisk > 0 ? `${formatBytes(vm.disk)} usados / ${formatBytes(vm.maxdisk)} alocado` : "-"}
               </span>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
               <span className="font-mono">{vm.ip ?? vm.node}</span>
               <span>{formatUptime(vm.uptime)}</span>
            </div>
         </div>
      </div>
   )
}
