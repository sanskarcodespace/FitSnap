"use client"
import { useUnreadCount } from "./unread-messages-provider"
export function UnreadMessagesBadge() {
  const count = useUnreadCount();
  if (!count) return null;
  return <span aria-label={`${count} unread messages`} className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e8bd8b] px-1 text-[10px] font-bold text-[#543317]">{count > 99 ? "99+" : count}</span>;
}
