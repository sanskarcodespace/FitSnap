import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  default: "bg-[var(--color-primary-700)] text-white hover:bg-[var(--color-primary-800)] active:bg-[var(--color-primary-900)]",
  primary: "bg-[var(--color-primary-700)] text-white hover:bg-[var(--color-primary-800)] active:bg-[var(--color-primary-900)]",
  secondary: "bg-[var(--color-secondary-200)] text-[var(--color-secondary-900)] hover:bg-[var(--color-secondary-300)] active:bg-[var(--color-secondary-400)]",
  ghost: "hover:bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] active:bg-[var(--color-secondary-200)]",
  destructive: "bg-[var(--color-error-bg)] text-[var(--color-error-text)] hover:bg-[#fecaca] active:bg-[#f87171]",
  outline: "border border-[var(--color-neutral-300)] bg-transparent hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
}

const buttonSizes = {
  sm: "h-8 px-3 text-[var(--text-body-sm-size)]",
  md: "h-10 px-4 py-2",
  lg: "h-12 px-8 text-[var(--text-body-lg-size)]",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
  isLoading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, leadingIcon, trailingIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-[var(--background)]",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leadingIcon && <span className="mr-2">{leadingIcon}</span>}
        {children}
        {!isLoading && trailingIcon && <span className="ml-2">{trailingIcon}</span>}
      </button>
    )
  }
)
Button.displayName = "Button"
