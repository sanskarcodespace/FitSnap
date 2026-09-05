"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  User, 
  MessageCircle,
  LogOut,
  Menu,
  X,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UnreadMessagesBadge } from "@/components/ui/unread-messages-badge"
import { MessageAlerts } from "@/components/ui/message-alerts"

export interface CoachLayoutProps {
  user: {
    name: string
    email: string
    avatarUrl?: string
  }
  children: React.ReactNode
  onLogout?: () => void
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/coach", icon: LayoutDashboard },
  { name: "Profile", href: "/coach/profile", icon: User },
  { name: "Messages", href: "/coach/messages", icon: MessageCircle, badge: true },
  { name: "Settings", href: "/coach/settings", icon: Settings },
]

export function CoachLayout({ user, children, onLogout }: CoachLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen w-full bg-[var(--color-neutral-50)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-[var(--background)] focus:text-[var(--foreground)] focus:font-medium">
        Skip to main content
      </a>
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-[var(--background)] border-r border-[var(--color-neutral-200)] shadow-sm">
        <div className="flex h-16 items-center px-6 border-b border-[var(--color-neutral-200)]">
          <Link href="/coach" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-[var(--color-primary-700)]">FitSnap Coach</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isDashboard = item.href === "/coach"
            const reallyActive = isDashboard 
              ? (pathname === "/coach" || pathname.startsWith("/coach/clients"))
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  reallyActive 
                    ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]" 
                    : "text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)]"
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge && <UnreadMessagesBadge />}
                </div>
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[var(--color-neutral-200)]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center font-bold overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--color-neutral-900)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--color-neutral-500)] truncate">{user.email}</p>
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-2 rounded-md text-sm font-medium text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--background)] border-b border-[var(--color-neutral-200)] z-40 flex items-center justify-between px-4">
        <Link href="/coach" className="font-bold text-lg text-[var(--color-primary-700)]">
          FitSnap Coach
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[var(--color-neutral-600)]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-30 bg-[var(--background)] flex flex-col border-b border-[var(--color-neutral-200)]">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isDashboard = item.href === "/coach"
              const reallyActive = isDashboard 
                ? (pathname === "/coach" || pathname.startsWith("/coach/clients"))
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-md text-base font-medium transition-colors",
                    reallyActive 
                      ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]" 
                      : "text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]"
                  )}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                    {item.badge && <UnreadMessagesBadge />}
                  </div>
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="p-4 border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center font-bold overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-neutral-900)]">{user.name}</p>
                <p className="text-xs text-[var(--color-neutral-500)]">{user.email}</p>
              </div>
            </div>
            {onLogout && (
              <Button 
                variant="destructive" 
                className="w-full justify-start bg-[var(--color-error-bg)] text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)] hover:opacity-90 border-none"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLogout()
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pt-16 md:pt-0">
        <main id="main-content" className="flex-1 p-4 md:p-8" tabIndex={-1}>
          {children}
        </main>
      </div>

      <MessageAlerts />
    </div>
  )
}
