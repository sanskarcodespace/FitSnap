import * as React from "react"
import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[var(--radius-md)] animate-shimmer", className)}
      {...props}
    />
  )
}

export function Spinner({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin text-[var(--color-primary-500)]", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ className, icon, title, description, action, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-neutral-300)] p-8 text-center",
        className
      )}
      {...props}
    >
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]">{icon}</div>}
      <h3 className="mb-1 text-[var(--text-h4-size)] font-medium text-[var(--foreground)]">{title}</h3>
      {description && <p className="mb-4 text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
