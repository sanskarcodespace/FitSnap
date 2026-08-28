import * as React from "react"
import { cn } from "@/lib/utils"

const avatarSizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  initials?: string
  size?: keyof typeof avatarSizes
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, initials, size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-[var(--color-secondary-200)] text-[var(--color-secondary-700)] font-medium items-center justify-center",
          avatarSizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="aspect-square h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <span
          className={cn("flex h-full w-full items-center justify-center", src ? "hidden" : "")}
        >
          {initials?.toUpperCase() || "?"}
        </span>
      </div>
    )
  }
)
Avatar.displayName = "Avatar"
