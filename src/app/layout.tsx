import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fitsnap.com"),
  title: {
    template: "%s | FitSnap",
    default: "FitSnap — AI Food Photo Logging for Coaches & Clients",
  },
  description: "Snap a photo, get instant nutrition estimates. FitSnap helps coaches manage clients and helps clients track food, workouts, and progress in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--color-primary-500)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
