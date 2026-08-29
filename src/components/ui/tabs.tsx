"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: "", onValueChange: () => {} })

export const Tabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (value: string) => void }>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [tab, setTab] = React.useState(defaultValue || "")
    const currentValue = value !== undefined ? value : tab
    const handleValueChange = React.useCallback((v: string) => {
      setTab(v)
      onValueChange?.(v)
    }, [onValueChange])

    return (
      <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn("flex flex-col w-full", className)} {...props} />
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-secondary-100)] p-1 text-[var(--color-secondary-500)]",
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = "TabsList"

export const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const isActive = context.value === value
    return (
      <button
        ref={ref}
        onClick={() => context.onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-[var(--text-body-sm-size)] font-medium ring-offset-[var(--background)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
            : "hover:bg-[var(--color-secondary-200)] hover:text-[var(--color-secondary-900)]",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

export const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (context.value !== value) return null;
    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"
