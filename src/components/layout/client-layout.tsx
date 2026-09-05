"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Utensils, 
  Calendar, 
  TrendingUp, 
  CheckSquare, 
  MessageCircle,
  LogOut,
  User
} from "lucide-react"
import { UnreadMessagesBadge } from "@/components/ui/unread-messages-badge"
import { MessageAlerts } from "@/components/ui/message-alerts"
import { NotificationCenter } from "@/components/ui/notification-center"
import { Settings } from "lucide-react"

export interface ClientLayoutProps {
  user: {
    name: string
    avatarUrl?: string
  }
  children: React.ReactNode
  onLogout?: () => void
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/client", icon: Home },
  { name: "Food", href: "/client/food", icon: Utensils },
  { name: "Plan", href: "/client/plan", icon: Calendar },
  { name: "Progress", href: "/client/progress", icon: TrendingUp },
  { name: "Habits", href: "/client/habits", icon: CheckSquare },
]

export function ClientLayout({ user, children, onLogout }: ClientLayoutProps) {
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = React.useState(false)

  // Simple initials fallback
  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col min-h-screen w-full bg-[var(--background)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-[var(--background)] focus:text-[var(--foreground)] focus:font-medium">
        Skip to main content
      </a>
      {/* Desktop & Mobile Top Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--color-neutral-200)] bg-[var(--background)] px-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-6">
          <Link href="/client" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-[var(--color-primary-700)]">FitSnap</span>
          </Link>
          
          {/* Desktop Primary Nav */}
          <nav className="hidden md:flex gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]" 
                      : "text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--foreground)]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Actions (Messages + Profile) */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link 
            href="/client/messages" 
            className="relative p-2 text-[var(--color-neutral-600)] hover:text-black hover:bg-[var(--color-neutral-100)] rounded-full transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <UnreadMessagesBadge />
          </Link>

          <NotificationCenter />
          
          {/* Custom Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-bold text-xs border border-[var(--color-primary-200)] hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </button>
            
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[var(--background)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] py-1 z-50 border border-[var(--color-neutral-200)] animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-[var(--color-neutral-100)] truncate">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{user.name}</p>
                  </div>
                  <Link 
                    href="/client/profile/edit"
                    className="flex items-center px-4 py-2 text-sm text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                  <Link 
                    href="/client/settings"
                    className="flex items-center px-4 py-2 text-sm text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                  {onLogout && (
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onLogout()
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full pt-16 px-4 pb-24 md:pb-8" tabIndex={-1}>
        {children}
      </main>

      <MessageAlerts />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-neutral-200)] bg-[var(--background)] safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive 
                    ? "text-[var(--color-primary-600)]" 
                    : "text-[var(--color-neutral-500)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "fill-[var(--color-primary-50)]")} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
