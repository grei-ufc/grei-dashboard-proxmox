export type VMStatus = "running" | "stopped" | "paused" | "suspended"

export interface VMData {
   id: string
   name: string
   status: VMStatus
   cpu: number
   maxcpu: number
   mem: number
   maxmem: number
   disk: number
   maxdisk: number
   uptime: number
   netin: number
   netout: number
   cpuHistory: number[]
   node: string
   ip?: string
   type: "qemu" | "lxc"
   osType?: "windows" | "linux" | "unknown"
}

export interface NodeData {
   id: string
   name: string
   status: "online" | "offline"
   cpu: number
   maxcpu: number
   mem: number
   maxmem: number
   disk: number
   maxdisk: number
   uptime: number
}

export interface ClusterData {
   name: string
   status: "healthy" | "degraded" | "critical"
   nodes: NodeData[]
   vms: VMData[]
   totalCpu: number
   usedCpu: number
   totalMem: number
   usedMem: number
   totalDisk: number
   usedDisk: number
   totalVMs: number
   runningVMs: number
   lastUpdate: string
}

export interface WebSocketMessage {
   type: "cluster_update" | "vm_update" | "node_update" | "error"
   data: ClusterData | VMData | NodeData | { message: string }
   timestamp: string
}
