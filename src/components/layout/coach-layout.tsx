import * as React from "react"
import { cn } from "@/lib/utils"

export interface CoachLayoutProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
}

export function CoachLayout({ sidebar, header, children }: CoachLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-[var(--background)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[var(--color-neutral-200)] bg-[var(--background)]">
        {sidebar}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - Desktop & Mobile */}
        <header className="flex h-16 items-center border-b border-[var(--color-neutral-200)] bg-[var(--background)] px-4 md:px-6">
          {/* Mobile sidebar trigger could go here */}
          <div className="md:hidden mr-4">☰</div>
          {header}
        </header>

        {/* Main Body */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
