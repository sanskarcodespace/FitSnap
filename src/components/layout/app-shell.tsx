"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Utensils, TrendingUp, CheckSquare, CalendarDays, MessageCircle, Settings, UserRound, Share2, LogOut, ArrowUpRight, Menu, X, Sparkles } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { UnreadMessagesBadge } from "@/components/ui/unread-messages-badge"
import { MessageAlerts } from "@/components/ui/message-alerts"
import { UnreadMessagesProvider } from "@/components/ui/unread-messages-provider"
import { NotificationCenter } from "@/components/ui/notification-center"

export type AppShellProps = {
  role: "client" | "individual" | "coach";
  user: { name: string; email?: string; avatarUrl?: string };
  children: React.ReactNode;
  onLogout?: () => void;
}
export function AppShell({ role, user, children, onLogout }: AppShellProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const base = "/" + role
  const items = role === "coach" ? [
    { name: "Overview", href: base, icon: Home },
    { name: "Messages", href: base + "/messages", icon: MessageCircle },
    { name: "Coach profile", href: base + "/profile", icon: UserRound },
    { name: "Settings", href: base + "/settings", icon: Settings },
  ] : [
    { name: "Overview", href: base, icon: Home },
    { name: "Food journal", href: base + "/food", icon: Utensils },
    ...(role === "client" ? [{ name: "My plan", href: base + "/plan", icon: CalendarDays }] : []),
    { name: "Progress", href: base + "/progress", icon: TrendingUp },
    { name: "Habits", href: base + "/habits", icon: CheckSquare },
    ...(role === "client" ? [{ name: "Messages", href: base + "/messages", icon: MessageCircle }] :
      [{ name: "Share progress", href: base + "/share", icon: Share2 }]),
    { name: "Settings", href: base + "/settings", icon: Settings },
  ]
  const active = (href: string) => href === base ? pathname === base || (role === "coach" && pathname.startsWith(base + "/clients")) : pathname.startsWith(href)
  const current = items.find(item => active(item.href))?.name || "Your workspace"
  const initials = user.name.slice(0, 2).toUpperCase()
  return <UnreadMessagesProvider enabled={role !== "individual"}><div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    {menuOpen && <button className="shell-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`app-sidebar ${menuOpen ? "is-open" : ""}`}>
      <div className="sidebar-brand"><Logo href={base} light /><button className="mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
      <div className="workspace-label">{role === "coach" ? "COACH STUDIO" : "YOUR DAILY SPACE"}</div>
      <nav aria-label="Main navigation" className="sidebar-nav">
        {items.map(item => <Link key={item.href} href={item.href} prefetch={false} aria-current={active(item.href) ? "page" : undefined} onClick={() => setMenuOpen(false)}>
          <span className="relative"><item.icon size={19} strokeWidth={1.7} />{item.icon === MessageCircle && <UnreadMessagesBadge />}</span>{item.name}
          {active(item.href) && <span className="nav-dot" />}
        </Link>)}
      </nav>
      <div className="sidebar-note"><Sparkles size={20} /><p>Small steps.<br /><strong>Lasting change.</strong></p><span>Make a little space for your wellbeing today.</span></div>
      <div className="sidebar-account">
        <div className="shell-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" width={40} height={40} /> : initials}</div>
        <div><strong>{user.name}</strong><span>{role === "coach" ? "Coach workspace" : "Your personal space"}</span></div>
        {onLogout && <button onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>}
      </div>
    </aside>
    <div className="app-workspace">
      <header className="workspace-header">
        <div className="flex items-center gap-3"><button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation" aria-expanded={menuOpen}><Menu size={22} /></button><span className="header-breadcrumb">My workspace <span>/</span> <strong>{current}</strong></span></div>
        <div className="flex items-center gap-3">
          {role !== "coach" && <NotificationCenter />}
          <Link className="shell-profile-link" href={role === "individual" ? "/individual/settings" : role === "coach" ? "/coach/profile" : "/client/profile/edit"} aria-label="Edit your profile"><span className="shell-avatar small">{initials}</span></Link>
          {role !== "coach" && <Link href={base + "/food"} className="header-log-button">Log food <ArrowUpRight size={16}/></Link>}
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="workspace-content">{children}</main>
      <footer className="workspace-footer"><span>FitSnap · A little better, every day.</span><Link href="/privacy">Privacy</Link></footer>
    </div>
    {role !== "individual" && <MessageAlerts />}
    <nav className="mobile-dock" aria-label="Quick navigation">{items.slice(0, role === "coach" ? 4 : 5).map(item =>
      <Link key={item.href} href={item.href} prefetch={false} aria-current={active(item.href) ? "page" : undefined}><item.icon size={20}/><span>{item.name === "Food journal" ? "Food" : item.name}</span></Link>
    )}</nav>
  </div></UnreadMessagesProvider>
}
