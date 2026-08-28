"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { acceptInvitationSignup, acceptInvitationLogin, logoutAction } from "./actions"

export function InviteSignupForm({ token, name, email }: { token: string, name: string, email: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    formData.append("token", token)
    
    const result = await acceptInvitationSignup(formData)
    // If successful, it redirects automatically via next/navigation redirect in action
    if (result && !result.success) {
      setError(result.error || "Failed to create account")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]" />
        <p className="text-xs text-[var(--color-neutral-500)]">This is the email your coach invited.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input id="name" name="name" type="text" defaultValue={name} required placeholder="Jane Doe" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Create a Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
      </div>

      <Button type="submit" className="w-full mt-4" disabled={loading}>
        {loading ? "Creating Account..." : "Create Account & Accept Invitation"}
      </Button>
    </form>
  )
}

export function InviteLoginForm({ token, email }: { token: string, email: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)
    formData.append("token", token)
    
    const result = await acceptInvitationLogin(formData)
    if (result && !result.success) {
      setError(result.error || "Failed to login")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} disabled className="bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>

      <Button type="submit" className="w-full mt-4" disabled={loading}>
        {loading ? "Logging in..." : "Login & Accept Invitation"}
      </Button>
    </form>
  )
}

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  
  return (
    <Button 
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        // Simple form post or server action to logout
        await logoutAction()
      }}
    >
      {loading ? "Logging out..." : "Log out to continue"}
    </Button>
  )
}
