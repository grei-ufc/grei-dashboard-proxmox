"use client"

import { useEffect, useState } from "react"
import { Activity, Server, Wifi, WifiOff } from "lucide-react"

interface DashboardHeaderProps {
  clusterName: string
  clusterStatus: "healthy" | "degraded" | "critical"
  isConnected: boolean
  lastUpdate: string
}

export function DashboardHeader({ clusterName, clusterStatus, isConnected, lastUpdate }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const statusColor = {
    healthy: "text-status-online",
    degraded: "text-status-warning",
    critical: "text-status-critical",
  }[clusterStatus]

  const statusBg = {
    healthy: "bg-status-online/20",
    degraded: "bg-status-warning/20",
    critical: "bg-status-critical/20",
  }[clusterStatus]

  const statusText = {
    healthy: "Saudavel",
    degraded: "Degradado",
    critical: "Critico",
  }[clusterStatus]

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/logo-grei.svg" alt="GREI Logo" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Monitor</h1>
            <p className="text-xs text-muted-foreground">Proxmox Dashboard</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border/30"></div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusBg}`}> 
          <span className={`relative flex h-2 w-2`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColor} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColor.replace('text-', 'bg-')}`}></span>
          </span>
          <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span className="text-sm">
            Atualizado: {new Date(lastUpdate).toLocaleTimeString("pt-BR")}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-status-online" />
          ) : (
            <WifiOff className="h-4 w-4 text-status-critical" />
          )}
          <span className={`text-sm ${isConnected ? "text-status-online" : "text-status-critical"}`}>
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>

        <div className="font-mono text-2xl font-bold text-foreground tabular-nums tracking-tight">
          {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
    </header>
  )
}
