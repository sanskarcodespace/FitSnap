"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { canInviteMoreClients } from "@/lib/billing"

async function getSession() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) throw new Error("Not authenticated")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "COACH") throw new Error("Not authorized")
  
  return session
}

export async function inviteClient(formData: FormData) {
  try {
    const session = await getSession()
    
    const email = formData.get("email")?.toString().trim().toLowerCase()
    const name = formData.get("name")?.toString().trim()
    const personalMessage = formData.get("message")?.toString().trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Valid email is required" }
    }

    const coachUser = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!coachUser) return { success: false, error: "Coach not found" }

    if (email === coachUser.email.toLowerCase()) {
      return { success: false, error: "You cannot invite your own email address." }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 7) // 7 days

    // Check for existing pending invitation from this coach to this email
    const existingPending = await prisma.coachClientConnection.findFirst({
      where: {
        coachId: session.userId,
        invitedEmail: email,
        status: "PENDING"
      }
    })

    let inviteUrl = ""

    if (existingPending) {
      await prisma.coachClientConnection.update({
        where: { id: existingPending.id },
        data: {
          invitationToken: token,
          invitationTokenExpiry: expiry,
          invitedName: name || existingPending.invitedName,
          personalMessage: personalMessage !== undefined ? personalMessage : existingPending.personalMessage
        }
      })
      inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`
    } else {
      const canInvite = await canInviteMoreClients(session.userId);
      if (!canInvite) {
        return { success: false, error: "Client limit reached for your current plan." }
      }

      await prisma.coachClientConnection.create({
        data: {
          coachId: session.userId,
          invitedEmail: email,
          invitedName: name,
          personalMessage: personalMessage,
          invitationToken: token,
          invitationTokenExpiry: expiry,
          status: "PENDING"
        }
      })
      inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`
    }

    revalidatePath("/coach")
    
    // In production, an email would be sent here.
    // For dev, we return the URL to display in the UI.
    return { success: true, inviteUrl }
  } catch (error: any) {
    console.error("Invite client error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function resendInvitation(connectionId: string) {
  try {
    const session = await getSession()

    const connection = await prisma.coachClientConnection.findFirst({
      where: {
        id: connectionId,
        coachId: session.userId,
        status: "PENDING"
      }
    })

    if (!connection) {
      return { success: false, error: "Invitation not found" }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 7)

    await prisma.coachClientConnection.update({
      where: { id: connectionId },
      data: {
        invitationToken: token,
        invitationTokenExpiry: expiry
      }
    })

    revalidatePath("/coach")
    
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`
    return { success: true, inviteUrl }
  } catch (error: any) {
    return { success: false, error: "Failed to resend" }
  }
}

export async function cancelInvitation(connectionId: string) {
  try {
    const session = await getSession()

    await prisma.coachClientConnection.updateMany({
      where: {
        id: connectionId,
        coachId: session.userId,
        status: "PENDING"
      },
      data: {
        status: "CANCELLED"
      }
    })

    revalidatePath("/coach")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Failed to cancel" }
  }
}

export async function disconnectClient(connectionId: string) {
  try {
    const session = await getSession()

    await prisma.coachClientConnection.updateMany({
      where: {
        id: connectionId,
        coachId: session.userId,
        status: "ACTIVE"
      },
      data: {
        status: "ENDED",
        endedAt: new Date(),
        endedByUserId: session.userId
      }
    })

    const { invalidateRosterCache } = await import("@/lib/cache/roster-cache")
    invalidateRosterCache(session.userId)

    revalidatePath("/coach")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Failed to disconnect" }
  }
}
