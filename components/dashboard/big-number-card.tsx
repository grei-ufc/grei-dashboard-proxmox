"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BigNumberCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  variant?: "default" | "primary" | "warning" | "critical"
  className?: string
}

export function BigNumberCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
}: BigNumberCardProps) {
  const variantStyles = {
    default: {
      border: "border-border/20",
      iconBg: "bg-secondary/30",
      iconColor: "text-muted-foreground",
    },
    primary: {
      border: "border-border/20",
      iconBg: "bg-secondary/30",
      iconColor: "text-muted-foreground",
    },
    warning: {
      border: "border-border/20",
      iconBg: "bg-secondary/30",
      iconColor: "text-muted-foreground",
    },
    critical: {
      border: "border-border/20",
      iconBg: "bg-secondary/30",
      iconColor: "text-muted-foreground",
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 px-4 py-3 rounded-lg bg-card border transition-all duration-300",
        styles.border,
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md shrink-0", styles.iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-foreground">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
