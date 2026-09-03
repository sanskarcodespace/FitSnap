import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Style Guide — FitSnap",
  robots: {
    index: false,
    follow: false,
  },
}

export default function StyleGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
