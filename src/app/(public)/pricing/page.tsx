import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function PricingPage() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-20 max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-[var(--text-display-size)] font-bold">Simple, transparent pricing</h1>
          <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-600)]">Plans that grow with your coaching business.</p>
          <p className="text-[var(--text-caption-size)] text-[var(--color-neutral-400)] italic mt-2">* Prices and tiers are illustrative and subject to change.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Solo Tier */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl mb-2">Solo Coach</CardTitle>
              <CardDescription>Perfect for trainers just starting out.</CardDescription>
              <div className="mt-4 text-4xl font-bold">$29<span className="text-lg text-[var(--color-neutral-500)] font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Up to 15 active clients</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> AI food-photo logging</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Basic templates</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button className="w-full" variant="secondary">Get Started</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Pro Tier */}
          <Card className="relative border-[var(--color-primary-500)] shadow-[var(--shadow-md)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-primary-500)] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Most Popular
            </div>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl mb-2">Growing Practice</CardTitle>
              <CardDescription>For full-time coaches scaling up.</CardDescription>
              <div className="mt-4 text-4xl font-bold">$79<span className="text-lg text-[var(--color-neutral-500)] font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Up to 50 active clients</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Everything in Solo</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Advanced plan builders</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> WhatsApp report exports</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Studio Tier */}
          <Card className="relative">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl mb-2">Studio / Team</CardTitle>
              <CardDescription>For gyms and multi-coach teams.</CardDescription>
              <div className="mt-4 text-4xl font-bold">Custom</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Unlimited active clients</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Multiple coach seats</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Custom branding</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-[var(--color-primary-500)]" /> Dedicated support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/contact" className="w-full">
                <Button className="w-full" variant="secondary">Talk to us</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MarketingLayout>
  )
}
