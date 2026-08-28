"use client"

import * as React from "react"
import { MarketingLayout } from "@/components/layout/marketing-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { submitContactForm } from "./actions"

export default function ContactPage() {
  const [isPending, setIsPending] = React.useState(false)
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [validationErrors, setValidationErrors] = React.useState<{ [key: string]: string }>({})

  const validateForm = (formData: FormData) => {
    const errors: { [key: string]: string } = {}
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const message = formData.get("message") as string

    if (!name.trim()) errors.name = "Name is required."
    if (!email.trim()) {
      errors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format."
    }
    if (!message.trim()) errors.message = "Message is required."
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setStatus("idle")
    setValidationErrors({})
    setErrorMessage("")

    const formData = new FormData(e.currentTarget)
    
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setIsPending(false)
      return
    }

    try {
      const result = await submitContactForm(formData)
      if (result.success) {
        setStatus("success")
      } else {
        setStatus("error")
        setErrorMessage(result.error || "An unexpected error occurred.")
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage("Network error. Please check your connection and try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-20 max-w-xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-[var(--text-display-size)] font-bold">Request a Demo</h1>
          <p className="text-[var(--text-body-lg-size)] text-[var(--color-neutral-600)]">
            We'd love to show you how FitSnap can transform your coaching business.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-[var(--color-success-bg)] border border-[var(--color-success-text)] rounded-[var(--radius-lg)] p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#bbf7d0] text-[var(--color-success-text)] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-[var(--text-h3-size)] font-semibold text-[var(--color-success-text)]">Message Sent!</h2>
            <p className="text-[var(--text-body-sm-size)] text-[var(--color-success-text)]">
              Thank you for reaching out. We've received your inquiry and will get back to you shortly to schedule a demo.
            </p>
            <div className="pt-4">
              <Button onClick={() => setStatus("idle")} variant="secondary">Send another message</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {status === "error" && (
              <Alert variant="error" title="Submission Failed">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </Alert>
            )}

            {/* Honeypot field - visually hidden to catch bots */}
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="website_url">Website URL (leave blank)</Label>
              <Input id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Jane Doe" 
                error={validationErrors.name}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="jane@example.com" 
                error={validationErrors.email}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="context">Coaching Context (Optional)</Label>
              <Input 
                id="context" 
                name="context" 
                placeholder="e.g. Independent PT, 20 clients" 
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message *</Label>
              <Textarea 
                id="message" 
                name="message" 
                placeholder="Tell us what you're looking for..." 
                rows={5}
                error={validationErrors.message}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isPending}>
              Submit Request
            </Button>
          </form>
        )}
      </div>
    </MarketingLayout>
  )
}
