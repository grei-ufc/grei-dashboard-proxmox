"use client"

import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

interface MetricsChartProps {
  cpuPercent: number
  memPercent: number
  diskPercent: number
}

interface DataPoint {
  time: string
  cpu: number
  mem: number
  disk: number
}

export function MetricsChart({ cpuPercent, memPercent, diskPercent }: MetricsChartProps) {
  const [history, setHistory] = useState<DataPoint[]>([])

  useEffect(() => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })

    setHistory((prev) => {
      const newPoint: DataPoint = {
        time: timeStr,
        cpu: cpuPercent,
        mem: memPercent,
        disk: diskPercent,
      }
      const updated = [...prev, newPoint]
      // Keep last 30 data points
      return updated.slice(-30)
    })
  }, [cpuPercent, memPercent, diskPercent])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">CPU</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-2" />
          <span className="text-xs text-muted-foreground">Memoria</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-3" />
          <span className="text-xs text-muted-foreground">Disco</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={history}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.65 0.2 280)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.65 0.2 280)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.75 0.2 80)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.75 0.2 80)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.12 0.01 260)",
                border: "1px solid oklch(0.25 0.02 260)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "oklch(0.6 0 0)" }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`,
                name === "cpu" ? "CPU" : name === "mem" ? "Memoria" : "Disco",
              ]}
            />
            <Area
              type="monotone"
              dataKey="cpu"
              stroke="oklch(0.7 0.15 160)"
              strokeWidth={2}
              fill="url(#cpuGradient)"
            />
            <Area
              type="monotone"
              dataKey="mem"
              stroke="oklch(0.65 0.2 280)"
              strokeWidth={2}
              fill="url(#memGradient)"
            />
            <Area
              type="monotone"
              dataKey="disk"
              stroke="oklch(0.75 0.2 80)"
              strokeWidth={2}
              fill="url(#diskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
