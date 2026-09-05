import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: "default" | "success" | "warning" | "error" | "info"
  title?: React.ReactNode
}

const alertVariants = {
  default: "bg-[var(--background)] text-[var(--foreground)] border-[var(--color-neutral-200)]",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-accent)]/20",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-text)]/20",
  error: "bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error-text)]/20",
  info: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-primary-300)]/20",
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-[var(--radius-lg)] border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
          alertVariants[variant],
          className
        )}
        {...props}
      >
        {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
        <div className="text-[var(--text-body-sm-size)] [&_p]:leading-relaxed">
          {children}
        </div>
      </div>
    )
  }
)
Alert.displayName = "Alert"
