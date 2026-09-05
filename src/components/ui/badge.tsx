import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-[var(--color-primary-50)] text-[var(--color-primary-800)] border-[var(--color-primary-200)]",
  secondary: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] border-[var(--color-neutral-200)]",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-accent)]/20",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-text)]/20",
  error: "bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error-text)]/20",
  info: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-primary-300)]/20",
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
