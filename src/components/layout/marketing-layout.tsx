import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Logo } from "@/components/brand/Logo"

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketing-dark min-h-screen flex flex-col">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="site-header">
      <Logo light />
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/how-it-works">How it works</Link><Link href="/for-coaches">For coaches</Link><Link href="/pricing">Pricing</Link>
      </nav>
      <div className="site-header-actions"><Link href="/login">Log in</Link><Link href="/signup" className="site-cta">Get started <ArrowUpRight size={16}/></Link></div>
      <details className="site-mobile-menu"><summary aria-label="Navigation menu">Menu</summary><nav aria-label="Mobile navigation"><Link href="/how-it-works">How it works</Link><Link href="/for-coaches">For coaches</Link><Link href="/pricing">Pricing</Link><Link href="/login">Log in</Link></nav></details>
    </header>
    <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
    <footer className="site-footer">
      <div><Logo light /><p>Make room for a healthier everyday.</p><span>Crafted by Sanskar.</span></div>
      <nav aria-label="Footer navigation"><Link href="/how-it-works">How it works</Link><Link href="/for-coaches">For coaches</Link><Link href="/pricing">Pricing</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
      <small>© {new Date().getFullYear()} FitSnap</small>
    </footer>
  </div>
}
