import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
