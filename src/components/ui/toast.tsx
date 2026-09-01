import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "success" | "error"
  onClose?: () => void
  isVisible?: boolean
}

const toastVariants = {
  default: "bg-[var(--background)] border border-[var(--color-neutral-200)] text-[var(--foreground)]",
  success: "bg-[var(--color-success-bg)] border border-[#bbf7d0] text-[var(--color-success-text)]",
  error: "bg-[var(--color-error-bg)] border border-[#fecaca] text-[var(--color-error-text)]",
}

export function Toast({ title, description, variant = "default", onClose, isVisible = true }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-[var(--radius-md)] p-4 pr-8 shadow-[var(--shadow-md)] motion-safe:transition-all motion-reduce:transition-none",
        toastVariants[variant]
      )}
      role="status" aria-live="polite" aria-atomic="true"
    >
      <div className="grid gap-1">
        {title && <div className="text-[var(--text-body-sm-size)] font-semibold">{title}</div>}
        {description && <div className="text-[var(--text-caption-size)] opacity-90">{description}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
