import { Leaf, ArrowUpRight } from "lucide-react"
import Link from "next/link"
export function AuthFrame({ children }: { children: React.ReactNode }) {
  return <div className="auth-frame"><aside className="auth-story"><span className="eyebrow">YOUR SPACE TO GROW</span><h2>A little intention.<br /><em>A lot of possibility.</em></h2><p>Build a routine around real life. Your food, your progress, and the people in your corner.</p><div className="auth-orbit" aria-hidden="true"><Leaf size={64} strokeWidth={1}/><span>ONE DAY AT A TIME</span></div><Link href="/how-it-works">Get to know FitSnap <ArrowUpRight size={16}/></Link></aside><div className="auth-form-wrap">{children}</div></div>
}
