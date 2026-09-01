"use client"

import { useState, useEffect } from "react"
import { 
  requestEmailChange, 
  updatePassword, 
  updateClientNotificationPreferences,
import { autoCaptureClientTimezone } from "../../settings/actions"
import ActiveSessions from "@/components/settings/ActiveSessions"

export default function ClientSettings({ user, profile, activeSessions }: { user: any, profile: any, activeSessions: any[] }) {
  const [emailMsg, setEmailMsg] = useState("")
  const [passMsg, setPassMsg] = useState("")
  const [prefMsg, setPrefMsg] = useState("")

  useEffect(() => {
    if (profile.timezone === "UTC") {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz && tz !== "UTC") {
        autoCaptureClientTimezone(tz)
      }
    }
  }, [profile.timezone])

  const handleEmailChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEmailMsg("Sending...")
    const res = await requestEmailChange(new FormData(e.currentTarget))
    if (res.error) setEmailMsg(`Error: ${res.error}`)
    else setEmailMsg("Verification email sent! Check your inbox.")
  }

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPassMsg("Updating...")
    const res = await updatePassword(new FormData(e.currentTarget))
    if (res.error) setPassMsg(`Error: ${res.error}`)
    else {
      setPassMsg("Password updated successfully.")
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const handlePreferencesChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPrefMsg("Saving...")
    const formData = new FormData(e.currentTarget)
    // checkboxes only send if checked
    if (!formData.has("habitReminderEnabled")) formData.append("habitReminderEnabled", "false")
    if (!formData.has("monthlyReportNotificationEnabled")) formData.append("monthlyReportNotificationEnabled", "false")
    if (!formData.has("emailOnNewMessage")) formData.append("emailOnNewMessage", "false")
    
    // Auto populate timezone
    formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone)

    const res = await updateClientNotificationPreferences(formData)
    if (res.error) setPrefMsg(`Error: ${res.error}`)
    else setPrefMsg("Preferences saved.")
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Account Settings</h1>

      {/* Notifications */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Notification Preferences</h2>
        <form onSubmit={handlePreferencesChange} className="space-y-4">
          <label className="flex items-center space-x-3">
            <input type="checkbox" name="habitReminderEnabled" defaultChecked={profile.habitReminderEnabled} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
            <span className="text-gray-700">Enable Daily Habit Reminders</span>
          </label>
          <div className="ml-7 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Time (Hour 0-23 in {Intl.DateTimeFormat().resolvedOptions().timeZone}):</span>
            <input type="number" name="habitReminderHour" min="0" max="23" defaultValue={profile.habitReminderHour ?? 9} className="border border-gray-300 rounded px-2 py-1 w-20 text-sm" />
          </div>

          <label className="flex items-center space-x-3">
            <input type="checkbox" name="monthlyReportNotificationEnabled" defaultChecked={profile.monthlyReportNotificationEnabled} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
            <span className="text-gray-700">Monthly Progress Report Ready (Email & Alert)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input type="checkbox" name="emailOnNewMessage" defaultChecked={profile.emailOnNewMessage} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
            <span className="text-gray-700">Email me when I receive a new message</span>
          </label>
          
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-2">Save Preferences</button>
          {prefMsg && <p className="text-sm text-gray-600 mt-2">{prefMsg}</p>}
        </form>
      </section>

      {/* Email */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Change Email</h2>
        <p className="text-sm text-gray-500 mb-4">Current Email: {user.email}</p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Email Address</label>
            <input type="email" name="newEmail" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" name="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Request Email Change</button>
          {emailMsg && <p className="text-sm text-gray-600 mt-2">{emailMsg}</p>}
        </form>
      </section>

      {/* Password */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" name="currentPassword" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" name="newPassword" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input type="password" name="confirmPassword" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Update Password</button>
          {passMsg && <p className="text-sm text-gray-600 mt-2">{passMsg}</p>}
        </form>
      </section>

      {/* Active Sessions */}
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <ActiveSessions sessions={activeSessions} />
      </section>
    </div>
  )
}
