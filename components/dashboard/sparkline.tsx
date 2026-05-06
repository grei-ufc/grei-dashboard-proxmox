"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
  strokeColor?: string
  fillColor?: string
  showGradient?: boolean
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  className,
  strokeColor = "var(--primary)",
  fillColor = "var(--primary)",
  showGradient = true,
}: SparklineProps) {
  const { path, fillPath, points } = useMemo(() => {
    if (!data.length) return { path: "", fillPath: "", points: [] }

    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1
    
    const padding = 2
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    
    const pts = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((value - min) / range) * chartHeight,
    }))

    // Create smooth curve using bezier
    let pathD = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const cpx = (prev.x + curr.x) / 2
      pathD += ` Q ${prev.x + (cpx - prev.x) * 0.5} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`
      pathD += ` Q ${cpx + (curr.x - cpx) * 0.5} ${curr.y} ${curr.x} ${curr.y}`
    }

    // Fill path for gradient area
    const fillD = `${pathD} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`

    return { path: pathD, fillPath: fillD, points: pts }
  }, [data, width, height])

  if (!data.length) return null

  const gradientId = useMemo(() => `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`, [])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      
      {showGradient && (
        <path
          d={fillPath}
          fill={`url(#${gradientId})`}
        />
      )}
      
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Current value dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={strokeColor}
          className="animate-pulse"
        />
      )}
    </svg>
  )
}
