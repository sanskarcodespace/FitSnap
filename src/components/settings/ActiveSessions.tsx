"use client"

import { useState } from "react"
import { revokeSession, revokeAllOtherSessions } from "@/app/(authenticated)/settings/actions"

interface ActiveSession {
  id: string
  userAgent: string | null
  ipAddressPartial: string | null
  lastActiveAt: Date
  isCurrent: boolean
}

export default function ActiveSessions({ sessions }: { sessions: ActiveSession[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRevoke = async (id: string) => {
    setLoading(id)
    setError(null)
    const res = await revokeSession(id)
    if (res.error) {
      setError(res.error)
    }
    setLoading(null)
  }

  const handleRevokeAllOther = async () => {
    setLoading("all")
    setError(null)
    const res = await revokeAllOtherSessions()
    if (res.error) {
      setError(res.error)
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your active sessions and signed-in devices.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <li key={session.id}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    {session.userAgent || "Unknown Device"}
                  </div>
                  <div className="mt-2 flex">
                    <div className="flex items-center text-sm text-gray-500">
                      <span>IP: {session.ipAddressPartial || "Unknown"}</span>
                      <span className="mx-2">&bull;</span>
                      <span>Last active: {new Date(session.lastActiveAt).toLocaleString()}</span>
                      {session.isCurrent && (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Current Session
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={loading === session.id}
                    className="ml-4 flex-shrink-0 text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                  >
                    {loading === session.id ? "Logging out..." : "Log out"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {sessions.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={handleRevokeAllOther}
            disabled={loading === "all"}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
          >
            {loading === "all" ? "Logging out all others..." : "Log out all other sessions"}
          </button>
        </div>
      )}
    </div>
  )
}
