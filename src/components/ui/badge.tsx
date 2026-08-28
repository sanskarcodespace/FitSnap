import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-[var(--color-primary-100)] text-[var(--color-primary-800)] border-[var(--color-primary-200)]",
  secondary: "bg-[var(--color-secondary-100)] text-[var(--color-secondary-800)] border-[var(--color-secondary-200)]",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[#bbf7d0]",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[#fde68a]",
  error: "bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[#fecaca]",
  info: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[#bfdbfe]",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}
