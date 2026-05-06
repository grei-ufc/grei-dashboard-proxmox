"use client"

import { Server } from "lucide-react"
import type { NodeData } from "@/lib/proxmox-types"
import { cn } from "@/lib/utils"

interface NodeStatusCardProps {
  node: NodeData
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
  return `${days}d`
}

export function NodeStatusCard({ node }: NodeStatusCardProps) {
  const isOnline = node.status === "online"
  const cpuPercent = node.maxcpu > 0 ? (node.cpu / node.maxcpu) * 100 : 0
  const memPercent = node.maxmem > 0 ? (node.mem / node.maxmem) * 100 : 0

  return (
    <div
      className={cn(
        "flex flex-col p-4 rounded-xl bg-card border transition-all duration-300",
        isOnline ? "border-border/50" : "border-status-critical/50 opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className={cn("h-4 w-4", isOnline ? "text-primary" : "text-status-critical")} />
          <span className="font-medium text-foreground">{node.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`relative flex h-2 w-2`}>
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-online opacity-75"></span>
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isOnline ? "bg-status-online" : "bg-status-critical"
            )}></span>
          </span>
          <span className={cn(
            "text-xs font-medium",
            isOnline ? "text-status-online" : "text-status-critical"
          )}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {isOnline ? (
        <div className="space-y-2">
          {/* CPU Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">CPU</span>
              <span className="font-mono text-foreground">{cpuPercent.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  cpuPercent > 90 ? "bg-status-critical" : cpuPercent > 70 ? "bg-status-warning" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, cpuPercent)}%` }}
              />
            </div>
          </div>

          {/* Memory Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">RAM</span>
              <span className="font-mono text-foreground">{formatBytes(node.mem)}</span>
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

          {/* Uptime */}
          <div className="flex justify-between text-xs pt-1">
            <span className="text-muted-foreground">Uptime</span>
            <span className="text-foreground">{formatUptime(node.uptime)}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-2">
          <span className="text-sm text-muted-foreground">Node indisponivel</span>
        </div>
      )}
    </div>
  )
}
