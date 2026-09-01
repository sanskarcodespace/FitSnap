"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { InviteClientModal } from "./InviteClientModal"
import { resendInvitation, cancelInvitation, disconnectClient } from "./actions"
import Link from "next/link"
import type { ClientActivitySignals } from "@/lib/data/activity-signals"
import type { AttentionFlag } from "@/lib/data/attention-flags"

type Connection = {
  id: string
  invitedEmail: string
  invitedName: string | null
  status: string
  invitedAt: Date
  client?: { 
    name: string | null, 
    email: string,
    clientProfile?: {
      onboardingCompleted: boolean
      goal: string | null
    } | null 
  } | null
  signals?: ClientActivitySignals | null
  attentionFlags?: AttentionFlag[] | null
}

const GOALS = [
  { id: "WEIGHT_LOSS", label: "Weight Loss" },
  { id: "WEIGHT_GAIN", label: "Weight Gain" },
  { id: "MAINTENANCE", label: "Maintenance" },
  { id: "STRENGTH", label: "Strength & Muscle" },
  { id: "YOGA", label: "Yoga Improvement" },
  { id: "GENERAL_HEALTH", label: "General Health" }
]

export function ClientsSection({ 
  pending, 
  active,
  searchParams
}: { 
  pending: Connection[], 
  active: Connection[],
  searchParams: {q: string, goal: string, status: string, sort: string, attention: string}
}) {
  const router = useRouter()
  const pathname = usePathname()
  const currentSearchParams = useSearchParams()

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(currentSearchParams.toString())
    if (val) {
      params.set('q', val)
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(currentSearchParams.toString())
    if (val) {
      params.set(key, val)
    } else {
      params.delete(key)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleClearFilters = () => {
    router.replace(pathname)
  }

  async function handleResend(id: string) {
    if (!confirm("Are you sure you want to resend this invitation? The old link will expire.")) return
    setLoadingAction(`resend-${id}`)
    const result = await resendInvitation(id)
    if (result.success && result.inviteUrl) {
      alert(`Invitation resent! (Dev Mode URL: ${result.inviteUrl})`)
    } else {
      alert(result.error || "Failed to resend")
    }
    setLoadingAction(null)
  }

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this invitation?")) return
    setLoadingAction(`cancel-${id}`)
    const result = await cancelInvitation(id)
    if (!result.success) alert(result.error || "Failed to cancel")
    setLoadingAction(null)
  }

  async function handleDisconnect(id: string, name: string) {
    if (!confirm(`Are you sure you want to disconnect ${name}? You will lose access to their data.`)) return
    setLoadingAction(`disconnect-${id}`)
    const result = await disconnectClient(id)
    if (!result.success) alert(result.error || "Failed to disconnect")
    setLoadingAction(null)
  }

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-[var(--color-neutral-200)]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-primary-950)]">Client Roster</h2>
        <Button onClick={() => setIsInviteOpen(true)}>Invite a Client</Button>
      </div>

      {/* Roster Controls */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Search by name or email..." 
            className="md:w-64"
            defaultValue={searchParams.q}
            onChange={(e) => {
              // Debounce search in a real app, keeping simple here
              handleSearch(e)
            }}
          />
          <div className="flex flex-wrap gap-2 flex-1">
            <select 
              className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={searchParams.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_SETUP">Profile Setup Pending</option>
              <option value="INACTIVE_7">Inactive 7+ Days</option>
              <option value="INACTIVE_14">Inactive 14+ Days</option>
            </select>

            <select 
              className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={searchParams.attention || ""}
              onChange={e => handleFilterChange('attention', e.target.value)}
            >
              <option value="">All Clients</option>
              <option value="NEEDS_ATTENTION">Needs Attention Only</option>
            </select>

            <select 
              className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
              value={searchParams.goal}
              onChange={e => handleFilterChange('goal', e.target.value)}
            >
              <option value="">All Goals</option>
              {GOALS.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
            
            <select 
              className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ml-auto"
              value={searchParams.sort || "recent"}
              onChange={e => handleFilterChange('sort', e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="attention_first">Needs Attention First</option>
              <option value="name">Name (A-Z)</option>
              <option value="goal">Goal</option>
              <option value="activity_desc">Last Active (Most Recent)</option>
              <option value="activity_asc">Last Active (Least Recent)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {active.length === 0 ? (
                <div className="text-center p-8 bg-[var(--color-neutral-50)] rounded border border-dashed border-[var(--color-neutral-300)]">
                  {searchParams.q || searchParams.goal || searchParams.status ? (
                    <>
                      <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mb-3">No matching clients found.</p>
                      <Button variant="secondary" size="sm" onClick={handleClearFilters}>Clear Filters</Button>
                    </>
                  ) : (
                    <>
                      <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] mb-3">No active clients yet.</p>
                      <Button variant="secondary" size="sm" onClick={() => setIsInviteOpen(true)}>Invite your first client</Button>
                    </>
                  )}
                </div>
              ) : (
                <ul className="space-y-4">
                  {active.map(conn => {
                    const clientName = conn.client?.email?.split('@')[0] || conn.invitedName || conn.invitedEmail
                    const isSetupPending = !conn.client?.clientProfile?.onboardingCompleted
                    const goal = conn.client?.clientProfile?.goal
                    const goalLabel = GOALS.find(g => g.id === goal)?.label
                    
                    let lastActiveDisplay = "No activity yet";
                    if (conn.signals?.lastActivityAt) {
                      const diffMs = new Date().getTime() - new Date(conn.signals.lastActivityAt).getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      if (diffDays === 0) lastActiveDisplay = "Today";
                      else if (diffDays === 1) lastActiveDisplay = "Yesterday";
                      else lastActiveDisplay = `${diffDays} days ago`;
                    }

                    return (
                      <li key={conn.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center font-bold text-lg shrink-0">
                            {clientName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--color-neutral-900)]">{clientName}</p>
                            <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)]">{conn.client?.email || conn.invitedEmail}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {isSetupPending ? (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">
                                  Profile Setup Pending
                                </Badge>
                              ) : (
                                <>
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                                    Active
                                  </Badge>
                                  {goalLabel && (
                                    <Badge variant="secondary" className="font-normal text-xs text-[var(--color-neutral-600)]">
                                      {goalLabel}
                                    </Badge>
                                  )}
                                </>
                              )}
                              <Badge variant="secondary" className="font-normal text-xs text-[var(--color-neutral-600)] border-dashed border-[var(--color-neutral-300)]">
                                Last Active: {lastActiveDisplay}
                              </Badge>
                              {!isSetupPending && conn.attentionFlags && conn.attentionFlags.length > 0 && (
                                <Badge className="bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)] border-none">
                                  Needs Attention · {conn.attentionFlags.length}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] text-[var(--color-neutral-400)] ml-1">
                                Connected {new Date(conn.invitedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/coach/clients/${conn.id}`}>View Client</Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-[var(--color-error-text)] border-[var(--color-error-bg)] hover:bg-[var(--color-error-bg)]"
                            disabled={loadingAction === `disconnect-${conn.id}`}
                            onClick={() => handleDisconnect(conn.id, clientName)}
                          >
                            Disconnect
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
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
                    <li key={conn.id} className="flex flex-col p-3 border rounded-lg gap-3">
                      <div>
                        <p className="font-semibold">{conn.invitedName || conn.invitedEmail}</p>
                        <p className="text-[var(--text-body-sm-size)] text-[var(--color-neutral-500)] truncate">{conn.invitedEmail}</p>
                        <p className="text-xs text-[var(--color-neutral-400)] mt-1">
                          Sent {new Date(conn.invitedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1"
                          disabled={loadingAction === `resend-${conn.id}`}
                          onClick={() => handleResend(conn.id)}
                        >
                          Resend
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 text-[var(--color-error-text)] border-[var(--color-error-bg)] hover:bg-[var(--color-error-bg)]"
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
      </div>

      <InviteClientModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  )
}
