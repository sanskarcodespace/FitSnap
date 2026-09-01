import fs from 'fs';
const path = 'src/app/(public)/page.tsx';

const newContent = `import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Smartphone, LineChart, BrainCircuit, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative px-4 py-24 md:py-36 text-center overflow-hidden flex flex-col items-center justify-center">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-secondary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
        
        <div className="container relative z-10 mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-semibold rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-200)] shadow-sm gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary-500)]" />
            Transform Your Coaching Business
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[var(--color-neutral-900)] leading-tight">
            Stop guessing. <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-secondary-600)]">
              Start coaching.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-neutral-600)] max-w-2xl mx-auto leading-relaxed">
            The only coaching platform featuring an AI-assisted food-photo workflow. 
            Replace messy spreadsheets and WhatsApp threads with a streamlined experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full shadow-lg shadow-[var(--color-primary-500)]/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white/50 backdrop-blur-md hover:-translate-y-1 transition-all duration-300">
                Request a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="relative px-4 py-24 bg-[var(--color-neutral-50)] border-t border-[var(--color-neutral-200)]/50">
        <div className="container mx-auto max-w-6xl text-center space-y-16">
          <div className="space-y-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <h2 className="text-4xl font-bold tracking-tight text-[var(--color-neutral-900)]">The Old Way is Broken</h2>
            <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-600)]">
              You are spending hours jumping between WhatsApp, spreadsheets, and disconnected apps just to figure out if your clients are sticking to their plan.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-left relative z-10">
            {[
              { title: "WhatsApp Chaos", desc: "Endless scrolling to find last week's check-in photos or meal updates." },
              { title: "Manual Nutrition Math", desc: "Clients struggling to enter precise grams, leading to poor adherence." },
              { title: "Spreadsheet Fatigue", desc: "Constantly updating brittle formulas and manually tracking progress." }
            ].map((feature, i) => (
              <Card key={i} className="bg-white/70 backdrop-blur-xl border border-[var(--color-neutral-200)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                <CardContent className="p-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-error-bg)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-error-text)]" />
                  </div>
                  <h3 className="text-[var(--color-neutral-900)] font-bold text-xl">{feature.title}</h3>
                  <p className="text-[var(--color-neutral-600)] leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Workflow Preview */}
      <section className="relative px-4 py-24 bg-[var(--color-primary-950)] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        
        <div className="container relative z-10 mx-auto max-w-6xl space-y-20">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight text-white">The FitSnap Way</h2>
            <p className="text-[var(--text-body-lg-size)] text-[var(--color-primary-100)]/80">
              Our unique AI-assisted workflow makes nutrition logging effortless for your clients and gives you instant visibility.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative">
            <div className="hidden md:block absolute top-10 left-12 right-12 h-[2px] bg-gradient-to-r from-[var(--color-primary-800)] via-[var(--color-primary-500)] to-[var(--color-primary-800)] -z-10 opacity-30" />
            
            {[
              { icon: Smartphone, title: "1. Snap", desc: "Client takes a photo of their meal." },
              { icon: BrainCircuit, title: "2. AI Analysis", desc: "We estimate macros and calories instantly." },
              { icon: CheckCircle2, title: "3. Confirm", desc: "Client reviews, corrects if needed, and saves." },
              { icon: LineChart, title: "4. Dashboard", desc: "You see their updated totals in real-time." }
            ].map((step, i) => (
              <div key={i} className="space-y-6 text-center group cursor-default">
                <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary-900)]/80 backdrop-blur-md border border-[var(--color-primary-800)] flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 group-hover:bg-[var(--color-primary-800)] transition-all duration-300">
                  <step.icon className="w-8 h-8 text-[var(--color-primary-300)] group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl text-white tracking-tight">{step.title}</h3>
                  <p className="text-[var(--color-primary-100)]/80 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Summary */}
      <section className="px-4 py-24 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-[var(--color-neutral-900)]">Everything You Need to Scale</h2>
            <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-600)] max-w-2xl mx-auto">
              A complete toolkit built specifically for online fitness coaches.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
            {[
              { title: "Workout & Meal Planning Tools", desc: "Assign templates and plans with ease." },
              { title: "Smart Coach Alerts", desc: "Get notified when clients miss check-ins or fall off plan." },
              { title: "Client Progress Tracking", desc: "All metrics, photos, and compliance in one dashboard." },
              { title: "WhatsApp-Shareable Reports", desc: "Export beautiful summaries to share with clients where they already are." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 group p-6 rounded-3xl hover:bg-[var(--color-neutral-50)] transition-colors duration-300">
                <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--color-primary-50)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-6 h-6 text-[var(--color-primary-600)]" />
                </div>
                <div className="space-y-1 pt-2">
                  <h3 className="font-bold text-lg text-[var(--color-neutral-900)]">{feature.title}</h3>
                  <p className="text-[var(--color-neutral-600)] leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-4 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-50)] via-white to-[var(--color-secondary-50)] -z-10" />
        <div className="container mx-auto max-w-3xl space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-neutral-900)] leading-tight">
            Ready to modernize your coaching?
          </h2>
          <p className="text-lg md:text-xl text-[var(--color-neutral-600)] max-w-2xl mx-auto leading-relaxed">
            Join FitSnap today and start delivering a premium experience to your clients while saving hours of admin work.
          </p>
          <div className="pt-6">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-[var(--color-primary-500)]/20 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
`;

fs.writeFileSync(path, newContent);
console.log("Patched page.tsx");
