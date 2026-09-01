"use client"

import * as React from "react"
import { getUnreadCount } from "@/app/(authenticated)/messages/actions"
import { Toast } from "@/components/ui/toast"

export function MessageAlerts() {
  const [lastCount, setLastCount] = React.useState<number | null>(null)
  const [showToast, setShowToast] = React.useState(false)

  React.useEffect(() => {
    let mounted = true

    async function checkCount() {
      try {
        const unreadCount = await getUnreadCount()
        
        if (mounted) {
          if (lastCount !== null && unreadCount > lastCount) {
            // New message arrived
            setShowToast(true)
            setTimeout(() => {
              if (mounted) setShowToast(false)
            }, 5000)
          }
          setLastCount(unreadCount)
        }
      } catch (e) {
        // Ignore
      }
    }

    // Initial check doesn't trigger toast because lastCount is null
    checkCount()
    
    // Poll every 15s, same as badge
    const interval = setInterval(checkCount, 15000) 

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [lastCount])

  if (!showToast) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Toast 
        title="New Message" 
        description="You have received a new message."
        variant="default"
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
