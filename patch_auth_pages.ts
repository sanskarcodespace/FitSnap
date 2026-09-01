import fs from 'fs';

const loginContent = `"use client"

import * as React from "react"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, Lock } from "lucide-react"
import { login } from "./actions"
import Link from "next/link"

export default function LoginPage() {
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      setError("An unexpected error occurred.")
      setIsPending(false)
    }
  }

  return (
    <MarketingLayout>
      <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden px-4 py-20">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-secondary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '5s' }} />

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="bg-white/80 backdrop-blur-xl border border-[var(--color-neutral-200)] shadow-2xl rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-50)] mx-auto flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-[var(--color-primary-600)]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-neutral-900)]">Welcome Back</h1>
              <p className="text-[var(--color-neutral-600)]">Log in to your FitSnap account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="error" title="Login Failed" className="bg-[var(--color-error-bg)]/50 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[var(--color-neutral-700)]">Email Address</Label>
                <Input id="email" name="email" type="email" required className="bg-white/50 focus:bg-white transition-colors" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[var(--color-neutral-700)]">Password</Label>
                <Input id="password" name="password" type="password" required className="bg-white/50 focus:bg-white transition-colors" />
              </div>

              <Button type="submit" className="w-full h-12 text-base rounded-xl shadow-lg shadow-[var(--color-primary-500)]/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300" size="lg" isLoading={isPending}>
                Log In
              </Button>

              <p className="text-center text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)] pt-2">
                Don't have an account? <Link href="/signup" className="text-[var(--color-primary-600)] font-semibold hover:underline">Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
`;

const signupContent = `"use client"

import * as React from "react"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, UserPlus } from "lucide-react"
import { signup } from "./actions"
import Link from "next/link"

export default function SignupPage() {
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await signup(formData)
      if (result?.error) {
        setError(result.error)
        setIsPending(false)
      }
    } catch (err) {
      setError("An unexpected error occurred.")
      setIsPending(false)
    }
  }

  return (
    <MarketingLayout>
      <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden px-4 py-20">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-secondary-400)] opacity-20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '5s' }} />

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-75">
          <div className="bg-white/80 backdrop-blur-xl border border-[var(--color-neutral-200)] shadow-2xl rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-50)] mx-auto flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-[var(--color-primary-600)]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-neutral-900)]">Create your account</h1>
              <p className="text-[var(--color-neutral-600)]">Start managing your clients the modern way.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="error" title="Signup Failed" className="bg-[var(--color-error-bg)]/50 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[var(--color-neutral-700)]">Email Address</Label>
                <Input id="email" name="email" type="email" required className="bg-white/50 focus:bg-white transition-colors" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[var(--color-neutral-700)]">Password</Label>
                <Input id="password" name="password" type="password" required minLength={8} className="bg-white/50 focus:bg-white transition-colors" />
              </div>

              <input type="hidden" name="role" value="COACH" />

              <Button type="submit" className="w-full h-12 text-base rounded-xl shadow-lg shadow-[var(--color-primary-500)]/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300" size="lg" isLoading={isPending}>
                Sign Up as Coach
              </Button>

              <p className="text-center text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)] pt-2">
                Already have an account? <Link href="/login" className="text-[var(--color-primary-600)] font-semibold hover:underline">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </MarketingLayout>
  )
}
`;

fs.writeFileSync('src/app/(public)/login/page.tsx', loginContent);
fs.writeFileSync('src/app/(public)/signup/page.tsx', signupContent);
