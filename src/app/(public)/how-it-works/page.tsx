import { Metadata } from "next"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Alert } from "@/components/ui/alert"
import { Info } from "lucide-react"

export const metadata: Metadata = {
  title: "How It Works — FitSnap",
  description: "Learn how FitSnap simplifies nutrition logging and progress tracking for online fitness coaches and their clients.",
  alternates: {
    canonical: "https://fitsnap.com/how-it-works",
  },
  openGraph: {
    title: "How It Works — FitSnap",
    description: "Learn how FitSnap simplifies nutrition logging and progress tracking for online fitness coaches and their clients.",
    url: "https://fitsnap.com/how-it-works",
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
    title: "How It Works — FitSnap",
    description: "Learn how FitSnap simplifies nutrition logging and progress tracking for online fitness coaches and their clients.",
    images: ["https://fitsnap.com/og-image.jpg"],
  },
}

export default function HowItWorksPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-20 max-w-4xl space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-[var(--text-display-size)] font-bold">How It Works</h1>
          <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-600)]">The simplest way to log nutrition and track progress.</p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-[var(--text-h2-size)] font-semibold">1. Snap a Photo</h2>
            <p className="text-[var(--color-neutral-600)]">Clients take a picture of their meal using their phone. No need to search databases for ingredients or weigh every single grain of rice.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[var(--text-h2-size)] font-semibold">2. AI Estimates Nutrition</h2>
            <p className="text-[var(--color-neutral-600)]">Our vision AI identifies the food and estimates the macronutrients (Protein, Carbs, Fats) and total calories instantly.</p>
            <Alert title="Important Note" variant="info" className="mt-4">
              <Info className="w-4 h-4" />
              AI-generated nutrition values are estimates to reduce friction. Clients can always review, edit, and correct these numbers before saving to ensure maximum accuracy.
            </Alert>
          </section>

          <section className="space-y-4">
            <h2 className="text-[var(--text-h2-size)] font-semibold">3. Coach Visibility</h2>
            <p className="text-[var(--color-neutral-600)]">Once saved, the meal and its macros appear instantly on the coach's dashboard. Coaches can review the photo alongside the logged macros to monitor adherence and provide accurate feedback.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[var(--text-h2-size)] font-semibold">4. Track & Share</h2>
            <p className="text-[var(--color-neutral-600)]">FitSnap tracks progress over time. Generate beautiful summary reports and easily share them directly to WhatsApp for your weekly client check-ins.</p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  )
}
