import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative inline-flex h-6 w-11 items-center rounded-full">
        <input
          type="checkbox"
          className="peer sr-only"
          ref={ref}
          {...props}
        />
        <div className={cn(
          "h-6 w-11 rounded-full bg-[var(--color-neutral-300)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-primary-500)] peer-focus:ring-offset-2 peer-focus:ring-offset-[var(--background)] transition-colors peer-checked:bg-[var(--color-primary-600)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className
        )}></div>
        <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 pointer-events-none shadow-sm" />
      </div>
    )
  }
)
Switch.displayName = "Switch"
