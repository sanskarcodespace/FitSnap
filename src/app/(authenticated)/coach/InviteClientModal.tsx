"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert } from "@/components/ui/alert"
import { inviteClient } from "./actions"

export function InviteClientModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successUrl, setSuccessUrl] = useState("")

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccessUrl("")

    const formData = new FormData(e.currentTarget)
    const result = await inviteClient(formData)

    if (result.success && result.inviteUrl) {
      setSuccessUrl(result.inviteUrl)
    } else {
      setError(result.error || "Failed to invite client")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader>
          <CardTitle>Invite a Client</CardTitle>
        </CardHeader>
        <CardContent>
          {successUrl ? (
            <div className="space-y-4">
              <Alert variant="success" className="bg-[var(--color-success-50)] text-[var(--color-success-900)] border-[var(--color-success-200)]">
                Invitation created successfully!
              </Alert>
              <div className="p-3 bg-gray-50 border rounded break-all text-[var(--text-body-sm-size)]">
                <strong>Dev URL:</strong> <br/>
                <a href={successUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                  {successUrl}
                </a>
              </div>
              <Button className="w-full" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}
              
              <div className="space-y-2">
                <Label htmlFor="email">Client Email (Required)</Label>
                <Input id="email" name="email" type="email" required placeholder="client@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Client Name (Optional)</Label>
                <Input id="name" name="name" type="text" placeholder="Jane Doe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea id="message" name="message" placeholder="Excited to start working together!" rows={3} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
