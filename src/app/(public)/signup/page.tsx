"use client"

import * as React from "react"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
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
      <div className="container mx-auto px-4 py-20 max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-[var(--text-h2-size)] font-bold">Create your account</h1>
          <p className="text-[var(--color-neutral-600)]">Start managing your clients the modern way.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error" title="Signup Failed">
              <AlertCircle className="w-4 h-4" />
              {error}
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>

          <input type="hidden" name="role" value="COACH" />

          <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
            Sign Up as Coach
          </Button>

          <p className="text-center text-[var(--text-body-sm-size)] text-[var(--color-neutral-600)]">
            Already have an account? <Link href="/login" className="text-[var(--color-primary-600)] hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </MarketingLayout>
  )
}
