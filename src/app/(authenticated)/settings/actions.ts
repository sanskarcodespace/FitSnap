"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import bcrypt from "bcryptjs"
import { createVerificationToken } from "@/lib/auth/tokens"
import { sendEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/auth/audit"

async function getSession() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return null
  return await verifyToken(token)
}

export async function requestEmailChange(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" }

  const newEmail = formData.get("newEmail")?.toString().trim()
  const password = formData.get("password")?.toString()

  if (!newEmail || !password) return { error: "Missing fields" }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return { error: "User not found" }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) return { error: "Invalid password" }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } })
  if (existing) return { error: "Email already in use" }

  const token = await createVerificationToken(user.id, newEmail)

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`

  await sendEmail({
    to: newEmail,
    subject: "Verify your new email address",
    type: "VERIFY_EMAIL",
    body: `Click here to verify your new email: ${verificationUrl}`
  })

  await logAuditEvent({
    eventType: "EMAIL_CHANGE_REQUESTED",
    actorUserId: user.id,
    actorRole: session.role,
    metadata: { newEmail }
  })

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" }

  const currentPassword = formData.get("currentPassword")?.toString()
  const newPassword = formData.get("newPassword")?.toString()
  const confirmPassword = formData.get("confirmPassword")?.toString()

  if (!currentPassword || !newPassword || !confirmPassword) return { error: "Missing fields" }
  if (newPassword !== confirmPassword) return { error: "New passwords do not match" }
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters" }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return { error: "User not found" }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) return { error: "Invalid current password" }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  })

  // Revoke all other active sessions for the user
  if (session.sessionId) {
    await prisma.session.updateMany({
      where: {
        userId: user.id,
        id: { not: session.sessionId },
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })
  }

  await logAuditEvent({
    eventType: "PASSWORD_CHANGED",
    actorUserId: user.id,
    actorRole: session.role,
    metadata: { allOtherSessionsRevoked: true }
  })

  return { success: true }
}

export async function getActiveSessions() {
  const session = await getSession()
  if (!session) return []

  const activeSessions = await prisma.session.findMany({
    where: {
      userId: session.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActiveAt: 'desc' }
  })
  
  return activeSessions.map(s => ({
    id: s.id,
    userAgent: s.userAgent,
    ipAddressPartial: s.ipAddressPartial,
    lastActiveAt: s.lastActiveAt,
    isCurrent: s.id === session.sessionId
  }))
}

export async function revokeSession(sessionId: string) {
  const session = await getSession()
  if (!session) return { error: "Unauthorized" }

  const targetSession = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!targetSession || targetSession.userId !== session.userId) {
    return { error: "Session not found" }
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() }
  })

  await logAuditEvent({
    eventType: "SESSION_REVOKED",
    actorUserId: session.userId,
    actorRole: session.role,
    metadata: { revokedSessionId: sessionId }
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function revokeAllOtherSessions() {
  const session = await getSession()
  if (!session || !session.sessionId) return { error: "Unauthorized" }

  await prisma.session.updateMany({
    where: {
      userId: session.userId,
      id: { not: session.sessionId },
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  })

  await logAuditEvent({
    eventType: "ALL_OTHER_SESSIONS_REVOKED",
    actorUserId: session.userId,
    actorRole: session.role,
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function updateClientNotificationPreferences(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "CLIENT") return { error: "Unauthorized" }

  const habitReminderEnabled = formData.get("habitReminderEnabled") === "true"
  const habitReminderHour = parseInt(formData.get("habitReminderHour")?.toString() || "9", 10)
  const monthlyReportNotificationEnabled = formData.get("monthlyReportNotificationEnabled") === "true"
  const emailOnNewMessage = formData.get("emailOnNewMessage") === "true"
  const timezone = formData.get("timezone")?.toString()

  await prisma.clientProfile.update({
    where: { userId: session.userId },
    data: {
      habitReminderEnabled,
      habitReminderHour: isNaN(habitReminderHour) ? 9 : habitReminderHour,
      monthlyReportNotificationEnabled,
      emailOnNewMessage,
      ...(timezone ? { timezone } : {})
    }
  })

  revalidatePath("/client/settings")
  return { success: true }
}

export async function updateCoachNotificationPreferences(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "COACH") return { error: "Unauthorized" }

  const emailOnNewMessage = formData.get("emailOnNewMessage") === "true"
  const timezone = formData.get("timezone")?.toString()

  await prisma.coachProfile.update({
    where: { userId: session.userId },
    data: {
      emailOnNewMessage,
      ...(timezone ? { timezone } : {})
    }
  })

  revalidatePath("/coach/settings")
  return { success: true }
}

export async function autoCaptureClientTimezone(timezone: string) {
  const session = await getSession()
  if (!session || session.role !== "CLIENT") return { error: "Unauthorized" }

  const profile = await prisma.clientProfile.findUnique({ where: { userId: session.userId } })
  if (profile && profile.timezone === "UTC") {
    await prisma.clientProfile.update({
      where: { userId: session.userId },
      data: { timezone }
    })
    revalidatePath("/client/settings")
  }
}
