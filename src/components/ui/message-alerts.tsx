"use client"
import { useEffect, useRef, useState } from "react"
import { useUnreadCount } from "./unread-messages-provider"
import { Toast } from "./toast"
export function MessageAlerts() {
  const count = useUnreadCount();
  const previous = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (count === null) return;
    const increased = previous.current !== null && count > previous.current;
    previous.current = count;
    if (!increased) return;
    const show = setTimeout(() => setVisible(true), 0);
    const hide = setTimeout(() => setVisible(false), 5000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [count]);
  if (!visible) return null;
  return <div className="fixed bottom-24 md:bottom-5 right-4 z-50 w-80 max-w-[calc(100vw-32px)]"><Toast title="New message" description="You have received a new message." variant="default" onClose={() => setVisible(false)}/></div>;
}
