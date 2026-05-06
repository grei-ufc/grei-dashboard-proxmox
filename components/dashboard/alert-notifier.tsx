"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function AlertNotifier({ cpuPercent, memPercent, diskPercent }: { cpuPercent: number, memPercent: number, diskPercent: number }) {
   useEffect(() => {
      if (cpuPercent > 90) {
         toast.error("Alerta: CPU do cluster acima de 90%!")
      } else if (memPercent > 90) {
         toast.error("Alerta: Memória do cluster acima de 90%!")
      } else if (diskPercent > 90) {
         toast.error("Alerta: Disco do cluster acima de 90%!")
      }
   }, [cpuPercent, memPercent, diskPercent])
   return null
}
