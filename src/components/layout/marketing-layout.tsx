import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col marketing-dark">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-[var(--background)] focus:text-[var(--foreground)] focus:font-medium">
        Skip to main content
      </a>
      
      {/* Floating Glass Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-6 px-4">
        <header className="w-full max-w-5xl rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <div className="flex h-16 items-center justify-between px-6 md:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-primary-600)] to-[var(--color-accent)] flex items-center justify-center shadow-lg group-hover:shadow-[var(--shadow-glow)] transition-all duration-300">
                  <span className="font-bold text-white text-lg">F</span>
                </div>
                <span className="font-bold text-xl text-white tracking-tight">FitSnap</span>
              </Link>
              <nav className="hidden md:flex gap-8">
                <Link href="/how-it-works" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                  How It Works
                </Link>
                <Link href="/for-coaches" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                  For Coaches
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                  Pricing
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hidden md:inline-block text-sm font-medium text-white/60 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup">
                <Button size="sm" className="h-10 px-6 rounded-full bg-white text-black hover:bg-white/90 font-medium shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </header>
      </div>

      <main id="main-content" className="flex-1 pt-24" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-white/10 bg-black/50 py-12 md:py-16 mt-auto backdrop-blur-md">
        <div className="container mx-auto px-6 max-w-5xl grid md:grid-cols-4 gap-12">
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-primary-600)] to-[var(--color-accent)] flex items-center justify-center">
                <span className="font-bold text-white text-lg">F</span>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">FitSnap</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              The AI-assisted platform for modern fitness and wellness coaches. Stop guessing, start coaching.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-6 text-sm text-white">Product</h3>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/for-coaches" className="hover:text-white transition-colors">For Coaches</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-6 text-sm text-white">Company</h3>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-5xl mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} FitSnap. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
