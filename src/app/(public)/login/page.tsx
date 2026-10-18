"use client"

import * as React from "react"
import { AuthFrame } from "@/components/layout/auth-frame"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AlertCircle, Lock } from "lucide-react"
import { login } from "./actions"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
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
      } else if (result?.redirectTo) {
        router.push(result.redirectTo)
      }
    } catch (err: any) {
      setError("An unexpected error occurred.")
      setIsPending(false)
    }
  }

  return (
    <MarketingLayout>
      <AuthFrame>
        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="auth-card space-y-7">
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
                <Input id="email" name="email" type="email" autoComplete="email" required className="bg-white/50 focus:bg-white transition-colors" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[var(--color-neutral-700)]">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required className="bg-white/50 focus:bg-white transition-colors" />
              </div>

              <Button type="submit" className="w-full h-12 text-base rounded-xl shadow-lg shadow-[var(--color-primary-500)]/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300" size="lg" isLoading={isPending}>
                Log In
              </Button>

              <p className="text-center text-[length:var(--text-body-sm-size)] text-[var(--color-neutral-600)] pt-2">
                Don&apos;t have an account? <Link href="/signup" className="text-[var(--color-primary-600)] font-semibold hover:underline">Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </AuthFrame>
    </MarketingLayout>
  )
}
