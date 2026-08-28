import * as React from "react"
import { cn } from "@/lib/utils"

export interface ClientLayoutProps {
  header: React.ReactNode
  bottomNav: React.ReactNode
  children: React.ReactNode
}

export function ClientLayout({ header, bottomNav, children }: ClientLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--background)] md:max-w-md md:mx-auto md:border-x md:border-[var(--color-neutral-200)] md:shadow-sm relative">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-[var(--color-neutral-200)] bg-[var(--background)]/80 backdrop-blur-md px-4">
        {header}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-[var(--color-neutral-200)] bg-[var(--background)] px-4 py-2 md:max-w-md md:mx-auto md:left-auto md:right-auto md:w-full">
        {bottomNav}
      </nav>
    </div>
  )
}
