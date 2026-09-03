import { Metadata } from "next"
import { MarketingLayout } from "@/components/layout/marketing-layout"

export const metadata: Metadata = {
  title: "Privacy Policy — FitSnap",
  description: "Read the FitSnap privacy policy to understand how we collect, use, and protect your data.",
  alternates: {
    canonical: "https://fitsnap.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy — FitSnap",
    description: "Read the FitSnap privacy policy to understand how we collect, use, and protect your data.",
    url: "https://fitsnap.com/privacy",
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
    title: "Privacy Policy — FitSnap",
    description: "Read the FitSnap privacy policy to understand how we collect, use, and protect your data.",
    images: ["https://fitsnap.com/og-image.jpg"],
  },
}

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-20 max-w-3xl space-y-8">
        <h1 className="text-[var(--text-display-size)] font-bold">Privacy Policy</h1>
        
        <div className="p-6 bg-[var(--color-warning-bg)] border border-[var(--color-warning-text)] text-[var(--color-warning-text)] rounded-[var(--radius-lg)]">
          <strong>Placeholder Notice:</strong> The final legal text for this Privacy Policy is currently pending legal review and does not yet constitute the company's binding policy. 
        </div>

        <div className="prose prose-neutral max-w-none text-[var(--color-neutral-600)] space-y-4">
          <p>Last updated: [Date]</p>
          <h2>1. Introduction</h2>
          <p>[Placeholder for introduction text detailing data collection practices.]</p>
          
          <h2>2. Data We Collect</h2>
          <p>[Placeholder for data collection specifics.]</p>
          
          <h2>3. How We Use Your Data</h2>
          <p>[Placeholder for data usage policies.]</p>
        </div>
      </div>
    </MarketingLayout>
  )
}
