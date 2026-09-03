import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us — FitSnap",
  description: "Request a demo or get in touch with the FitSnap team to see how we can transform your coaching business.",
  alternates: {
    canonical: "https://fitsnap.com/contact",
  },
  openGraph: {
    title: "Contact Us — FitSnap",
    description: "Request a demo or get in touch with the FitSnap team to see how we can transform your coaching business.",
    url: "https://fitsnap.com/contact",
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
    title: "Contact Us — FitSnap",
    description: "Request a demo or get in touch with the FitSnap team to see how we can transform your coaching business.",
    images: ["https://fitsnap.com/og-image.jpg"],
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
