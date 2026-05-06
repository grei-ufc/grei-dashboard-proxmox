"use client"

import { Cpu, MemoryStick, HardDrive, Monitor } from "lucide-react"
import type { ClusterData } from "@/lib/proxmox-types"
import { BigNumberCard } from "./big-number-card"
import { MetricsChart } from "./metrics-chart"

interface StatsGridProps {
   data: ClusterData
}

function formatBytes(bytes: number, decimals = 1): string {
   if (bytes === 0) return "0 GB"
   const k = 1024
   const sizes = ["B", "KB", "MB", "GB", "TB", "PB"]
   const i = Math.floor(Math.log(bytes) / Math.log(k))
   return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

export function StatsGrid({ data }: StatsGridProps) {
   const cpuPercent = data.totalCpu > 0 ? (data.usedCpu / data.totalCpu) * 100 : 0
   const memPercent = data.totalMem > 0 ? (data.usedMem / data.totalMem) * 100 : 0
   const diskPercent = data.totalDisk > 0 ? (data.usedDisk / data.totalDisk) * 100 : 0

   const getCpuVariant = () => {
      if (cpuPercent > 90) return "critical"
      if (cpuPercent > 70) return "warning"
      return "primary"
   }

   const getMemVariant = () => {
      if (memPercent > 90) return "critical"
      if (memPercent > 70) return "warning"
      return "primary"
   }

   return (
      <div className="flex gap-6 items-stretch w-full">
         {/* Stats Cards - 50% */}
         <div className="flex-1 min-w-0 max-w-[50%] flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-3 h-full">
               <BigNumberCard
                  title="CPU"
                  value={`${cpuPercent.toFixed(1)}%`}
                  subtitle={`${data.usedCpu.toFixed(0)}/${data.totalCpu} cores`}
                  icon={Cpu}
                  variant={getCpuVariant()}
               />
               <BigNumberCard
                  title="RAM"
                  value={`${memPercent.toFixed(0)}%`}
                  subtitle={formatBytes(data.usedMem, 0)}
                  icon={MemoryStick}
                  variant={getMemVariant()}
               />
               <BigNumberCard
                  title="Disco"
                  value={`${diskPercent.toFixed(0)}%`}
                  subtitle={`Usado: ${formatBytes(data.usedDisk, 0)} / Total: ${formatBytes(data.totalDisk, 0)}`}
                  icon={HardDrive}
                  variant="default"
               />
               <BigNumberCard
                  title="VMs"
                  value={`${data.runningVMs}/${data.totalVMs}`}
                  subtitle="ativas"
                  icon={Monitor}
                  variant="primary"
               />
            </div>
         </div>

         {/* Metrics Chart - 50% */}
         <div className="flex-1 min-w-0 max-w-[50%] flex items-stretch">
            <div className="bg-card border border-border/20 rounded-lg p-4 min-h-[170px] w-full flex-1">
               <MetricsChart
                  cpuPercent={cpuPercent}
                  memPercent={memPercent}
                  diskPercent={diskPercent}
               />
            </div>
         </div>
      </div>
   )
}
