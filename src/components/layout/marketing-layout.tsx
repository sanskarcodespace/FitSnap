import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-[var(--background)] focus:text-[var(--foreground)] focus:font-medium">
        Skip to main content
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "FitSnap",
            "url": "https://fitsnap.com",
            "logo": "https://fitsnap.com/og-image.jpg",
            "description": "The AI-assisted platform for modern fitness and wellness coaches."
          })
        }}
      />
      <header className="sticky top-0 z-50 w-full border-b border-[var(--color-neutral-200)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl text-[var(--color-primary-700)]">FitSnap</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/how-it-works" className="text-[var(--text-body-sm-size)] font-medium text-[var(--color-neutral-600)] hover:text-[var(--foreground)] transition-colors">
                How It Works
              </Link>
              <Link href="/for-coaches" className="text-[var(--text-body-sm-size)] font-medium text-[var(--color-neutral-600)] hover:text-[var(--foreground)] transition-colors">
                For Coaches
              </Link>
              <Link href="/pricing" className="text-[var(--text-body-sm-size)] font-medium text-[var(--color-neutral-600)] hover:text-[var(--foreground)] transition-colors">
                Pricing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:inline-block text-[var(--text-body-sm-size)] font-medium text-[var(--color-neutral-600)] hover:text-[var(--foreground)] transition-colors">
              Log In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="h-9">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-[var(--color-neutral-200)] bg-[var(--color-secondary-50)] py-8 md:py-12 mt-auto">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="font-bold text-xl text-[var(--color-primary-700)]">FitSnap</span>
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">
              The AI-assisted platform for modern fitness and wellness coaches.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-[var(--text-body-sm-size)]">Product</h3>
            <ul className="space-y-2 text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)]">
              <li><Link href="/how-it-works" className="hover:text-[var(--foreground)]">How It Works</Link></li>
              <li><Link href="/for-coaches" className="hover:text-[var(--foreground)]">For Coaches</Link></li>
              <li><Link href="/pricing" className="hover:text-[var(--foreground)]">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-[var(--text-body-sm-size)]">Company</h3>
            <ul className="space-y-2 text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)]">
              <li><Link href="/contact" className="hover:text-[var(--foreground)]">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[var(--foreground)]">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-[var(--color-neutral-200)] text-center text-[var(--text-caption-size)] text-[var(--color-neutral-500)]">
          &copy; {new Date().getFullYear()} FitSnap. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
