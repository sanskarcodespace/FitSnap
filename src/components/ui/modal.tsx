import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          "z-50 w-full max-w-lg scale-100 gap-4 border border-[var(--color-neutral-200)] bg-[var(--background)] p-6 shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-lg)]",
          "md:w-full sm:max-w-[425px]"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <div className="flex items-center justify-between">
            {title && <h2 className="text-[var(--text-h3-size)] font-semibold leading-none tracking-tight">{title}</h2>}
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-[var(--background)] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {description && <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">{description}</p>}
        </div>
        <div className="py-4">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
