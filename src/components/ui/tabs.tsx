"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value: string;
  id: string;
  onValueChange: (value: string) => void;
}>({ value: "", id: "tabs", onValueChange: () => {} })

export const Tabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (value: string) => void }>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const id = React.useId()
    const [tab, setTab] = React.useState(defaultValue || "")
    const currentValue = value !== undefined ? value : tab
    const handleValueChange = React.useCallback((v: string) => {
      setTab(v)
      onValueChange?.(v)
    }, [onValueChange])

    return (
      <TabsContext.Provider value={{ value: currentValue, id, onValueChange: handleValueChange }}>
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
      role="tablist"
      onKeyDown={event => {
        const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'))
        const index = tabs.indexOf(document.activeElement as HTMLButtonElement)
        if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
        event.preventDefault()
        const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length
        tabs[next]?.focus(); tabs[next]?.click()
      }}
      className={cn(
        "inline-flex min-h-11 items-center justify-start overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-neutral-100)] p-1 text-[var(--color-neutral-500)]",
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
        type="button"
        role="tab"
        aria-selected={isActive}
        id={context.id + "-" + value}
        aria-controls={context.id + "-panel-" + value}
        tabIndex={isActive ? 0 : -1}
        onClick={() => context.onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-[length:var(--text-body-sm-size)] font-medium ring-offset-[var(--background)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
            : "hover:bg-[var(--color-neutral-200)] hover:text-[var(--color-neutral-800)]",
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
        role="tabpanel"
        id={context.id + "-panel-" + value}
        aria-labelledby={context.id + "-" + value}
        tabIndex={0}
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
