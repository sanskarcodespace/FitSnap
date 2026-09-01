"use client"

import * as React from "react"
import { getUnreadCount } from "@/app/(authenticated)/messages/actions"

export function UnreadMessagesBadge() {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    let mounted = true

    async function checkCount() {
      try {
        const unreadCount = await getUnreadCount()
        if (mounted) setCount(unreadCount)
      } catch (e) {
        // Ignore
      }
    }

    checkCount()
    const interval = setInterval(checkCount, 15000) // Poll every 15s for the badge

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (count === 0) return null

  return (
    <div className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-error-bg)] px-1 text-[10px] font-bold text-[var(--color-error-text)]">
      {count > 99 ? '99+' : count}
    </div>
  )
}
