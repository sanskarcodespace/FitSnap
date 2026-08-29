"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { signToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

export async function acceptInvitationSignup(formData: FormData) {
  const token = formData.get("token")?.toString()
  const name = formData.get("name")?.toString().trim()
  const password = formData.get("password")?.toString()
  const confirmPassword = formData.get("confirmPassword")?.toString()

  if (!token) return { success: false, error: "Missing token" }
  if (!password || password.length < 8) return { success: false, error: "Password must be at least 8 characters" }
  if (password !== confirmPassword) return { success: false, error: "Passwords do not match" }

  try {
    // Re-validate token and status
    const connection = await prisma.coachClientConnection.findUnique({
      where: { invitationToken: token },
      include: { coach: { include: { coachProfile: true } } }
    })

    if (!connection || connection.status !== "PENDING") {
      return { success: false, error: "Invitation is no longer valid or has already been used." }
    }
    if (connection.invitationTokenExpiry < new Date()) {
      return { success: false, error: "Invitation has expired." }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: connection.invitedEmail } })
    if (existingUser) {
      return { success: false, error: "Account already exists for this email." }
    }

    // Create User & Accept Connection in a transaction
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: connection.invitedEmail,
          passwordHash,
          role: "CLIENT",
          emailVerified: true // Auto-verify email
        }
      })

      await tx.coachClientConnection.update({
        where: { id: connection.id },
        data: {
          clientId: user.id,
          status: "ACTIVE",
          acceptedAt: new Date()
        }
      })

      return user
    })

    // Log the user in
    const sessionToken = await signToken({ userId: newUser.id, role: newUser.role })
    ;(await cookies()).set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    })

  } catch (error: any) {
    console.error("Signup error:", error)
    return { success: false, error: "An unexpected error occurred during signup." }
  }
  
  redirect("/client")
}

export async function acceptInvitationLogin(formData: FormData) {
  const token = formData.get("token")?.toString()
  const password = formData.get("password")?.toString()

  if (!token) return { success: false, error: "Missing token" }
  if (!password) return { success: false, error: "Password is required" }

  try {
    const connection = await prisma.coachClientConnection.findUnique({
      where: { invitationToken: token }
    })

    if (!connection || connection.status !== "PENDING") {
      return { success: false, error: "Invitation is no longer valid or has already been used." }
    }
    if (connection.invitationTokenExpiry < new Date()) {
      return { success: false, error: "Invitation has expired." }
    }

    const user = await prisma.user.findUnique({ where: { email: connection.invitedEmail } })
    if (!user) {
      return { success: false, error: "Account not found." }
    }
    if (user.role !== "CLIENT") {
      return { success: false, error: "This email belongs to a coach account and cannot accept a client invitation." }
    }

    // Verify Password
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return { success: false, error: "Invalid password." }

    // Check existing active connection
    const existingActive = await prisma.coachClientConnection.findFirst({
      where: {
        clientId: user.id,
        status: "ACTIVE"
      }
    })

    if (existingActive) {
      return { success: false, error: "You are already connected to another coach. You must disconnect before accepting a new invitation." }
    }

    // Update connection
    await prisma.coachClientConnection.update({
      where: { id: connection.id },
      data: {
        clientId: user.id,
        status: "ACTIVE",
        acceptedAt: new Date()
      }
    })

    // Log the user in
    const sessionToken = await signToken({ userId: user.id, role: user.role })
    ;(await cookies()).set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/"
    })

  } catch (error: any) {
    console.error("Login accept error:", error)
    return { success: false, error: "An unexpected error occurred." }
  }

  redirect("/client")
}

export async function logoutAction() {
  (await cookies()).delete("session_token")
  // Keep the user on the current page to refresh and see the logged-out state
  redirect(process.env.NEXT_PUBLIC_APP_URL || "/")
}
