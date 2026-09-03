import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up — FitSnap",
  description: "Create your FitSnap account and start coaching better today.",
  alternates: {
    canonical: "https://fitsnap.com/signup",
  },
  openGraph: {
    title: "Sign Up — FitSnap",
    description: "Create your FitSnap account and start coaching better today.",
    url: "https://fitsnap.com/signup",
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
    title: "Sign Up — FitSnap",
    description: "Create your FitSnap account and start coaching better today.",
    images: ["https://fitsnap.com/og-image.jpg"],
  },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
