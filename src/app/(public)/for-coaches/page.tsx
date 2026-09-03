import { Metadata } from "next"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "For Coaches — FitSnap",
  description: "Scale your fitness coaching business without scaling your busywork. See how FitSnap's tools help you manage clients more efficiently.",
  alternates: {
    canonical: "https://fitsnap.com/for-coaches",
  },
  openGraph: {
    title: "For Coaches — FitSnap",
    description: "Scale your fitness coaching business without scaling your busywork. See how FitSnap's tools help you manage clients more efficiently.",
    url: "https://fitsnap.com/for-coaches",
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
    title: "For Coaches — FitSnap",
    description: "Scale your fitness coaching business without scaling your busywork. See how FitSnap's tools help you manage clients more efficiently.",
    images: ["https://fitsnap.com/og-image.jpg"],
  },
}

export default function ForCoachesPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-20 max-w-4xl space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-[var(--text-display-size)] font-bold">Built for Modern Coaches</h1>
          <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-600)]">Scale your business without scaling your busywork.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-[var(--text-h2-size)] font-semibold">Adherence at a Glance</h2>
            <p className="text-[var(--color-neutral-600)]">Stop digging through chat histories to see if your client stuck to their plan. Our dashboard shows you exactly who hit their macros, who missed a workout, and who needs your attention today.</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" /> Visual meal logs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" /> Automated compliance tracking</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" /> Smart attention alerts</li>
            </ul>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-[var(--text-h2-size)] font-semibold">Powerful Plan Building</h2>
            <p className="text-[var(--color-neutral-600)]">Create and assign workout programs and meal templates in minutes, not hours. Reuse your best templates across multiple clients and tweak them on the fly.</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" /> Reusable templates</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" /> Custom exercise libraries</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" /> Macro target assignments</li>
            </ul>
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
