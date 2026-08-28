import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitSnap",
  description: "Platform Foundation",
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
