import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-300)] bg-transparent px-3 py-2 text-[var(--text-body-size)] text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-error-text)] focus-visible:ring-[var(--color-error-text)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[var(--text-caption-size)] text-[var(--color-error-text)]">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"
