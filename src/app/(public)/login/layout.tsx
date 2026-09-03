import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log In — FitSnap",
  description: "Log in to your FitSnap account.",
  alternates: {
    canonical: "https://fitsnap.com/login",
  },
  openGraph: {
    title: "Log In — FitSnap",
    description: "Log in to your FitSnap account.",
    url: "https://fitsnap.com/login",
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
    title: "Log In — FitSnap",
    description: "Log in to your FitSnap account.",
    images: ["https://fitsnap.com/og-image.jpg"],
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
