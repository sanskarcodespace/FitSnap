import { Metadata } from "next"
import { MarketingLayout } from "@/components/layout/marketing-layout"

export const metadata: Metadata = {
  title: "Terms of Service — FitSnap",
  description: "Read the FitSnap Terms of Service.",
  alternates: {
    canonical: "https://fitsnap.com/terms",
  },
  openGraph: {
    title: "Terms of Service — FitSnap",
    description: "Read the FitSnap Terms of Service.",
    url: "https://fitsnap.com/terms",
    siteName: "FitSnap",
    images: [
      {
        url: "https://fitsnap.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FitSnap Social Share Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service — FitSnap",
    description: "Read the FitSnap Terms of Service.",
    images: ["https://fitsnap.com/og-image.jpg"],
  },
}

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-20 max-w-3xl space-y-8">
        <h1 className="text-[var(--text-display-size)] font-bold">Terms of Service</h1>
        
        <div className="p-6 bg-[var(--color-warning-bg)] border border-[var(--color-warning-text)] text-[var(--color-warning-text)] rounded-[var(--radius-lg)]">
          <strong>Placeholder Notice:</strong> The final legal text for these Terms of Service is currently pending legal review and does not yet constitute the company's binding policy. 
        </div>

        <div className="prose prose-neutral max-w-none text-[var(--color-neutral-600)] space-y-4">
          <p>Last updated: [Date]</p>
          <h2>1. Agreement to Terms</h2>
          <p>[Placeholder for terms agreement text.]</p>
          
          <h2>2. User Accounts</h2>
          <p>[Placeholder for user account responsibilities.]</p>
          
          <h2>3. Acceptable Use</h2>
          <p>[Placeholder for acceptable use policies.]</p>
        </div>
      </div>
    </MarketingLayout>
  )
}
