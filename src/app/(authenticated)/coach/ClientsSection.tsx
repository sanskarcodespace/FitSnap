"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { InviteClientModal } from "./InviteClientModal"
import { resendInvitation, cancelInvitation, disconnectClient } from "./actions"

type Connection = {
  id: string
  invitedEmail: string
  invitedName: string | null
  status: string
  invitedAt: Date
  client?: { name: string | null, email: string } | null
}

export function ClientsSection({ 
  pending, 
  active 
}: { 
  pending: Connection[], 
  active: Connection[] 
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [devUrl, setDevUrl] = useState("")

  async function handleResend(id: string) {
    if (!confirm("Are you sure you want to resend this invitation? The old link will expire.")) return
    setLoadingAction(`resend-${id}`)
    const result = await resendInvitation(id)
    if (result.success && result.inviteUrl) {
      setDevUrl(result.inviteUrl)
      alert("Invitation resent!")
    } else {
      alert(result.error || "Failed to resend")
    }
    setLoadingAction(null)
  }

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this invitation?")) return
    setLoadingAction(`cancel-${id}`)
    const result = await cancelInvitation(id)
    if (!result.success) {
      alert(result.error || "Failed to cancel")
    }
    setLoadingAction(null)
  }

  async function handleDisconnect(id: string, name: string) {
    if (!confirm(`Are you sure you want to disconnect ${name}? You will lose access to their data.`)) return
    setLoadingAction(`disconnect-${id}`)
    const result = await disconnectClient(id)
    if (!result.success) {
      alert(result.error || "Failed to disconnect")
    }
    setLoadingAction(null)
  }

  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-[var(--color-neutral-200)]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-primary-950)]">Clients & Invitations</h2>
        <Button onClick={() => setIsInviteOpen(true)}>Invite a Client</Button>
      </div>

      {devUrl && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm break-all">
          <strong>Resent Dev URL:</strong> <br/>
          <a href={devUrl} className="text-blue-600 underline" target="_blank" rel="noreferrer">{devUrl}</a>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {active.length === 0 ? (
              <div className="text-center p-6 bg-[var(--color-neutral-50)] rounded border border-dashed border-[var(--color-neutral-300)]">
                <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mb-3">No active clients yet.</p>
                <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(true)}>Invite your first client</Button>
              </div>
            ) : (
              <ul className="space-y-4">
                {active.map(conn => (
                  <li key={conn.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-semibold">{conn.client?.name || conn.invitedName || conn.invitedEmail}</p>
                      <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">{conn.client?.email || conn.invitedEmail}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={loadingAction === `disconnect-${conn.id}`}
                      onClick={() => handleDisconnect(conn.id, conn.client?.name || conn.invitedEmail)}
                    >
                      {loadingAction === `disconnect-${conn.id}` ? "..." : "Disconnect"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-center p-6 bg-[var(--color-neutral-50)] rounded border border-dashed border-[var(--color-neutral-300)]">
                <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">No pending invitations.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {pending.map(conn => (
                  <li key={conn.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-semibold">{conn.invitedName || conn.invitedEmail}</p>
                      <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">{conn.invitedEmail}</p>
                      <p className="text-xs text-[var(--color-neutral-400)] mt-1">
                        Sent {new Date(conn.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={loadingAction === `resend-${conn.id}`}
                        onClick={() => handleResend(conn.id)}
                      >
                        Resend
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={loadingAction === `cancel-${conn.id}`}
                        onClick={() => handleCancel(conn.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteClientModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  )
}
