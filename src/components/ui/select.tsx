import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-neutral-300)] bg-transparent px-3 py-2 pr-8 text-[var(--text-body-size)] text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-error-text)] focus-visible:ring-[var(--color-error-text)]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--color-neutral-500)]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
        {error && (
          <p className="mt-1 text-[var(--text-caption-size)] text-[var(--color-error-text)]">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"
