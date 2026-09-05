"use client";

import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Smartphone, LineChart, BrainCircuit, Sparkles, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative px-4 py-32 md:py-48 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        {/* Abstract Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--color-primary-500)] opacity-20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--color-accent)] opacity-10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none" />

        <div className="container relative z-10 mx-auto max-w-5xl text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-[var(--color-primary-400)]" />
              <span className="text-sm font-medium text-white/80">Transform Your Coaching Business</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.1]"
          >
            Stop guessing. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-400)] via-[var(--color-primary-200)] to-[var(--color-accent)]">
              Start coaching.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-lg md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed font-light"
          >
            The world's first AI-assisted food tracking platform built specifically for premium online fitness coaches.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
          >
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all duration-300">
                Start for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md transition-all duration-300">
                Book a Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="relative px-4 py-32 border-t border-white/5 bg-black">
        <div className="container mx-auto max-w-6xl space-y-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">The old way is broken</h2>
            <p className="text-xl text-white/50 font-light">
              You are spending hours jumping between WhatsApp, spreadsheets, and disconnected apps just to figure out if your clients are sticking to their plan.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            {[
              { title: "WhatsApp Chaos", desc: "Endless scrolling to find last week's check-in photos or meal updates." },
              { title: "Manual Nutrition Math", desc: "Clients struggling to enter precise grams, leading to poor adherence." },
              { title: "Spreadsheet Fatigue", desc: "Constantly updating brittle formulas and manually tracking progress." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                <Card className="h-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors duration-500 group rounded-3xl overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold text-2xl">{feature.title}</h3>
                      <p className="text-white/50 leading-relaxed font-light">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Workflow Preview */}
      <section className="relative px-4 py-32 overflow-hidden bg-gradient-to-b from-black to-[var(--color-primary-950)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        
        <div className="container relative z-10 mx-auto max-w-6xl space-y-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6 max-w-3xl mx-auto"
          >
            <h2 className="text-5xl font-bold tracking-tight text-white">The FitSnap Way</h2>
            <p className="text-xl text-white/60 font-light">
              Our unique AI-assisted workflow makes nutrition logging effortless for your clients and gives you instant visibility.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-24 right-24 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary-500)] to-transparent opacity-30" />
            
            {[
              { icon: Smartphone, title: "1. Snap", desc: "Client takes a photo of their meal." },
              { icon: BrainCircuit, title: "2. Analyze", desc: "AI estimates macros instantly." },
              { icon: CheckCircle2, title: "3. Confirm", desc: "Client reviews and saves." },
              { icon: LineChart, title: "4. Dashboard", desc: "You see totals in real-time." }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="space-y-6 text-center group relative"
              >
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-[var(--color-primary-500)] blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                  <div className="relative w-full h-full rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-2xl group-hover:border-[var(--color-primary-500)] transition-colors duration-500">
                    <step.icon className="w-10 h-10 text-white/50 group-hover:text-[var(--color-primary-400)] transition-colors duration-500" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-2xl text-white">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed font-light">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Summary */}
      <section className="px-4 py-32 bg-black border-t border-white/5">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6 mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Everything you need to scale</h2>
            <p className="text-xl text-white/50 font-light max-w-2xl mx-auto">
              A complete, high-performance toolkit built specifically for elite online fitness coaches.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Workout & Meal Planning", desc: "Assign templates and dynamic plans with absolute ease." },
              { title: "Smart Coach Alerts", desc: "Get instantly notified when clients fall off plan." },
              { title: "Client Progress Tracking", desc: "All metrics, photos, and compliance in one beautiful dashboard." },
              { title: "Shareable Reports", desc: "Export stunning summaries to share directly on WhatsApp." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-500 flex gap-6 items-start"
              >
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[var(--color-primary-900)] transition-all duration-500">
                  <CheckCircle2 className="w-7 h-7 text-[var(--color-primary-400)]" />
                </div>
                <div className="space-y-2 pt-1">
                  <h3 className="font-semibold text-xl text-white">{feature.title}</h3>
                  <p className="text-white/50 leading-relaxed font-light">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-4 py-40 text-center overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary-950)] to-black -z-10" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl space-y-10 relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-tight">
            Ready to modernize?
          </h2>
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
            Join FitSnap today and deliver a premium, unforgettable experience to your clients.
          </p>
          <div className="pt-8">
            <Link href="/signup">
              <Button size="lg" className="h-16 px-12 text-xl rounded-full bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all duration-300">
                Get Started Now
                <ChevronRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  )
}
