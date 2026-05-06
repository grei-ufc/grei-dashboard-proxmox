"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ClusterData, WebSocketMessage } from "@/lib/proxmox-types"

interface UseProxmoxWebSocketOptions {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

interface UseProxmoxWebSocketReturn {
  data: ClusterData | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnectAttempts: number
  connect: () => void
  disconnect: () => void
}

// Mock data for development/demo
function generateMockData(): ClusterData {
  const nodes = [
    { id: "node1", name: "pve-node-01", status: "online" as const },
    { id: "node2", name: "pve-node-02", status: "online" as const },
    { id: "node3", name: "pve-node-03", status: Math.random() > 0.1 ? "online" as const : "offline" as const },
  ]

  const vmNames = [
    "web-server-01", "db-master", "redis-cache", "nginx-proxy",
    "api-gateway", "worker-01", "worker-02", "monitoring",
    "backup-server", "dev-env", "staging-api", "k8s-master"
  ]

  const vms = vmNames.map((name, i) => {
    const isRunning = Math.random() > 0.15
    const cpuBase = Math.random() * 60 + (isRunning ? 10 : 0)
    return {
      id: `vm-${100 + i}`,
      name,
      status: isRunning ? "running" as const : (Math.random() > 0.5 ? "stopped" as const : "paused" as const),
      cpu: isRunning ? cpuBase : 0,
      maxcpu: 4 + Math.floor(Math.random() * 4),
      mem: isRunning ? (2 + Math.random() * 6) * 1024 * 1024 * 1024 : 0,
      maxmem: (4 + Math.floor(Math.random() * 12)) * 1024 * 1024 * 1024,
      disk: (10 + Math.random() * 40) * 1024 * 1024 * 1024,
      maxdisk: (50 + Math.floor(Math.random() * 150)) * 1024 * 1024 * 1024,
      uptime: isRunning ? Math.floor(Math.random() * 86400 * 30) : 0,
      netin: Math.random() * 100 * 1024 * 1024,
      netout: Math.random() * 50 * 1024 * 1024,
      cpuHistory: Array.from({ length: 20 }, () => isRunning ? Math.random() * 80 + 10 : 0),
      node: nodes[Math.floor(Math.random() * nodes.length)].name,
      ip: `192.168.1.${100 + i}`,
      type: Math.random() > 0.3 ? "qemu" as const : "lxc" as const,
    }
  })

  const runningVMs = vms.filter(vm => vm.status === "running")
  const totalCpu = nodes.reduce((acc, n) => acc + (n.status === "online" ? 32 : 0), 0)
  const usedCpu = runningVMs.reduce((acc, vm) => acc + vm.cpu, 0)
  const totalMem = nodes.length * 128 * 1024 * 1024 * 1024
  const usedMem = runningVMs.reduce((acc, vm) => acc + vm.mem, 0)
  const totalDisk = nodes.length * 2 * 1024 * 1024 * 1024 * 1024
  const usedDisk = vms.reduce((acc, vm) => acc + vm.disk, 0)

  return {
    name: "Proxmox Cluster",
    status: nodes.every(n => n.status === "online") ? "healthy" : nodes.some(n => n.status === "online") ? "degraded" : "critical",
    nodes: nodes.map(n => ({
      ...n,
      cpu: n.status === "online" ? Math.random() * 60 + 10 : 0,
      maxcpu: 32,
      mem: n.status === "online" ? (64 + Math.random() * 32) * 1024 * 1024 * 1024 : 0,
      maxmem: 128 * 1024 * 1024 * 1024,
      disk: (500 + Math.random() * 500) * 1024 * 1024 * 1024,
      maxdisk: 2 * 1024 * 1024 * 1024 * 1024,
      uptime: n.status === "online" ? Math.floor(Math.random() * 86400 * 90) : 0,
    })),
    vms,
    totalCpu,
    usedCpu,
    totalMem,
    usedMem,
    totalDisk,
    usedDisk,
    totalVMs: vms.length,
    runningVMs: runningVMs.length,
    lastUpdate: new Date().toISOString(),
  }
}

export function useProxmoxWebSocket(options: UseProxmoxWebSocketOptions = {}): UseProxmoxWebSocketReturn {
  const {
    url,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options

  const [data, setData] = useState<ClusterData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current)
      mockIntervalRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    cleanup()
    setIsConnecting(true)
    setError(null)

    // If no URL provided, use mock data
    if (!url) {
      setData(generateMockData())
      setIsConnected(true)
      setIsConnecting(false)
      
      // Update mock data periodically
      mockIntervalRef.current = setInterval(() => {
        setData(prev => {
          if (!prev) return generateMockData()
          
          // Update existing data with small variations
          return {
            ...prev,
            usedCpu: prev.usedCpu + (Math.random() - 0.5) * 5,
            usedMem: prev.usedMem + (Math.random() - 0.5) * 1024 * 1024 * 1024,
            vms: prev.vms.map(vm => ({
              ...vm,
              cpu: vm.status === "running" ? Math.max(0, Math.min(100, vm.cpu + (Math.random() - 0.5) * 10)) : 0,
              mem: vm.status === "running" ? Math.max(0, vm.mem + (Math.random() - 0.5) * 512 * 1024 * 1024) : 0,
              cpuHistory: vm.status === "running" 
                ? [...vm.cpuHistory.slice(1), Math.max(0, Math.min(100, vm.cpu + (Math.random() - 0.5) * 10))]
                : vm.cpuHistory,
            })),
            lastUpdate: new Date().toISOString(),
          }
        })
      }, 3000)
      
      return
    }

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setReconnectAttempts(0)
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          if (message.type === "cluster_update") {
            setData(message.data as ClusterData)
          } else if (message.type === "error") {
            setError((message.data as { message: string }).message)
          }
        } catch {
          console.error("Failed to parse WebSocket message")
        }
      }

      ws.onerror = () => {
        setError("WebSocket connection error")
        setIsConnecting(false)
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsConnecting(false)
        
        // Attempt reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, reconnectInterval)
        } else {
          setError("Maximum reconnection attempts reached")
        }
      }
    } catch {
      setError("Failed to create WebSocket connection")
      setIsConnecting(false)
    }
  }, [url, reconnectInterval, maxReconnectAttempts, reconnectAttempts, cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    setIsConnected(false)
    setIsConnecting(false)
    setReconnectAttempts(0)
  }, [cleanup])

  useEffect(() => {
    connect()
    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,
    connect,
    disconnect,
  }
}
