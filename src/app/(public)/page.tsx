import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Smartphone, LineChart, BrainCircuit } from "lucide-react"

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 text-center bg-gradient-to-b from-[var(--color-primary-50)] to-[var(--background)]">
        <div className="container mx-auto max-w-4xl space-y-6">
          <Badge variant="default" className="mb-4">Transform Your Coaching Business</Badge>
          <h1 className="text-[var(--text-display-size)] leading-[var(--text-display-line-height)] font-bold tracking-tight text-[var(--color-primary-950)]">
            Stop guessing. Start coaching.
          </h1>
          <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-600)] max-w-2xl mx-auto">
            The only coaching platform featuring an AI-assisted food-photo workflow. 
            Replace messy spreadsheets and WhatsApp threads with a streamlined experience for you and your clients.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">Request a Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="px-4 py-20 border-t border-[var(--color-neutral-200)]">
        <div className="container mx-auto max-w-5xl text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-[var(--text-h2-size)] font-bold">The Old Way is Broken</h2>
            <p className="text-[var(--color-neutral-600)]">
              You are spending hours jumping between WhatsApp, spreadsheets, and disconnected fitness apps just to figure out if your clients are sticking to their plan.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <Card className="bg-[var(--color-error-bg)] border-none">
              <CardContent className="p-6 space-y-2">
                <div className="text-[var(--color-error-text)] font-semibold text-lg">WhatsApp Chaos</div>
                <p className="text-[var(--text-body-sm-size)] opacity-90">Endless scrolling to find last week's check-in photos or meal updates.</p>
              </CardContent>
            </Card>
            <Card className="bg-[var(--color-error-bg)] border-none">
              <CardContent className="p-6 space-y-2">
                <div className="text-[var(--color-error-text)] font-semibold text-lg">Manual Nutrition Math</div>
                <p className="text-[var(--text-body-sm-size)] opacity-90">Clients struggling to enter precise grams, leading to poor adherence.</p>
              </CardContent>
            </Card>
            <Card className="bg-[var(--color-error-bg)] border-none">
              <CardContent className="p-6 space-y-2">
                <div className="text-[var(--color-error-text)] font-semibold text-lg">Spreadsheet Fatigue</div>
                <p className="text-[var(--text-body-sm-size)] opacity-90">Constantly updating brittle formulas and manually tracking progress.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Workflow Preview */}
      <section className="px-4 py-20 bg-[var(--color-primary-950)] text-white">
        <div className="container mx-auto max-w-5xl space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-[var(--text-h2-size)] font-bold text-white">The FitSnap Way</h2>
            <p className="text-[var(--color-primary-100)] opacity-90">
              Our unique AI-assisted workflow makes nutrition logging effortless for your clients and gives you instant visibility.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-[var(--color-primary-300)]" />
              </div>
              <h3 className="font-semibold text-lg">1. Snap</h3>
              <p className="text-[var(--text-body-sm-size)] text-[var(--color-primary-100)]">Client takes a photo of their meal.</p>
            </div>
            <div className="space-y-4 text-center relative">
              <div className="hidden md:block absolute top-8 left-0 w-full h-[2px] bg-[var(--color-primary-800)] -z-10" />
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center mx-auto">
                <BrainCircuit className="w-8 h-8 text-[var(--color-primary-300)]" />
              </div>
              <h3 className="font-semibold text-lg">2. AI Analysis</h3>
              <p className="text-[var(--text-body-sm-size)] text-[var(--color-primary-100)]">We estimate macros and calories instantly.</p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[var(--color-primary-300)]" />
              </div>
              <h3 className="font-semibold text-lg">3. Confirm</h3>
              <p className="text-[var(--text-body-sm-size)] text-[var(--color-primary-100)]">Client reviews, corrects if needed, and saves.</p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center mx-auto">
                <LineChart className="w-8 h-8 text-[var(--color-primary-300)]" />
              </div>
              <h3 className="font-semibold text-lg">4. Dashboard</h3>
              <p className="text-[var(--text-body-sm-size)] text-[var(--color-primary-100)]">You see their updated totals in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Summary */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-[var(--text-h2-size)] font-bold">Everything You Need to Scale</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" />
                <span className="font-medium">Workout & Meal Planning Tools</span>
              </div>
              <p className="text-[var(--color-neutral-600)] text-[var(--text-body-sm-size)] pl-8">Assign templates and plans with ease.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" />
                <span className="font-medium">Smart Coach Alerts</span>
              </div>
              <p className="text-[var(--color-neutral-600)] text-[var(--text-body-sm-size)] pl-8">Get notified when clients miss check-ins or fall off plan.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" />
                <span className="font-medium">Client Progress Tracking</span>
              </div>
              <p className="text-[var(--color-neutral-600)] text-[var(--text-body-sm-size)] pl-8">All metrics, photos, and compliance in one dashboard.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" />
                <span className="font-medium">WhatsApp-Shareable Reports</span>
              </div>
              <p className="text-[var(--color-neutral-600)] text-[var(--text-body-sm-size)] pl-8">Export beautiful summaries to share with clients where they already are.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 bg-[var(--color-secondary-50)] text-center border-t border-[var(--color-neutral-200)]">
        <div className="container mx-auto max-w-3xl space-y-6">
          <h2 className="text-[var(--text-h2-size)] font-bold">Ready to modernize your coaching?</h2>
          <p className="text-[var(--color-neutral-600)]">Join FitSnap today and start delivering a premium experience to your clients.</p>
          <div className="pt-4">
            <Link href="/signup">
              <Button size="lg">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
