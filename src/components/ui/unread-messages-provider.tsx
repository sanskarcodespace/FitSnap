"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { getUnreadCount } from "@/app/(authenticated)/messages/actions"

const UnreadContext = createContext<number | null>(null);
export const useUnreadCount = () => useContext(UnreadContext);
export function UnreadMessagesProvider({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false, inFlight = false;
    async function refresh() {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try { const value = await getUnreadCount(); if (!stopped) setCount(value); }
      catch { /* Keep the last known count; retry on the next visible poll. */ }
      finally { inFlight = false; }
    }
    void refresh();
    const interval = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => { stopped = true; clearInterval(interval); document.removeEventListener("visibilitychange", refresh); };
  }, [enabled]);
  return <UnreadContext.Provider value={count}>{children}</UnreadContext.Provider>;
}
