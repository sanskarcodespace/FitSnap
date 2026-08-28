import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-[var(--color-neutral-300)] ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-[var(--color-primary-600)] checked:border-[var(--color-primary-600)] accent-[var(--color-primary-600)]",
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"
