"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { getNotifications, markNotificationsAsRead } from "@/app/(authenticated)/client/notifications/actions"
import Link from "next/link"

export function NotificationCenter() {
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await getNotifications()
        if (!mounted) return
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.readAt).length)
      } catch (e) {
        // ignore
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const handleOpen = async () => {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id)
      await markNotificationsAsRead(unreadIds)
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })))
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 text-[var(--color-neutral-600)] hover:text-black hover:bg-[var(--color-neutral-100)] rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-error-bg)] px-1 text-[10px] font-bold text-[var(--color-error-text)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-2 z-50 border border-[var(--color-neutral-200)] max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            <h3 className="px-4 py-2 font-semibold text-gray-900 border-b">Notifications</h3>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(n => {
                  const link = n.type === "HABIT_REMINDER" ? "/client/habits" : "/client/report"
                  return (
                    <Link 
                      key={n.id}
                      href={link}
                      onClick={() => setOpen(false)}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex flex-col ${!n.readAt ? "bg-blue-50/50" : ""}`}
                    >
                      <span className={`text-sm ${!n.readAt ? "font-medium text-gray-900" : "text-gray-600"}`}>
                        {n.message}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
