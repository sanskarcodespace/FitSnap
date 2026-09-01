"use server"

import prisma from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth/jwt"
import { cookies, headers } from "next/headers"
import { logAuditEvent } from "@/lib/auth/audit"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  let user
  try {
    user = await prisma.user.findUnique({ 
      where: { email },
      include: { coachProfile: true, clientProfile: true }
    })
    
    if (!user) {
      await logAuditEvent({
        eventType: "LOGIN_FAILURE",
        metadata: { email, reason: "User not found" },
      })
      return { error: "Invalid credentials" }
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      await logAuditEvent({
        eventType: "LOGIN_FAILURE",
        targetUserId: user.id,
        metadata: { reason: "Invalid password" },
      })
      return { error: "Invalid credentials" }
    }

    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || undefined
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined
    // Mask IP address by zeroing last octet for IPv4
    let ipAddressPartial: string | undefined = ipAddress
    if (ipAddress) {
      const parts = ipAddress.split(".")
      if (parts.length === 4) {
        parts[3] = "0"
        ipAddressPartial = parts.join(".")
      }
    }

    const token = await signToken({ userId: user.id, role: user.role }, userAgent, ipAddressPartial)
    
    await logAuditEvent({
      eventType: "LOGIN_SUCCESS",
      actorUserId: user.id,
      actorRole: user.role,
      ipAddressPartial,
      metadata: { userAgent }
    })
    
    // Set cookie
    ;(await cookies()).set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours
    })

  } catch (error) {
    console.error("Login error:", error)
    return { error: "Failed to log in" }
  }

  // Determine routing based on role
  let redirectUrl = "/client"

  if (user.role === "COACH") {
    if (user.coachProfile?.onboardingCompleted) {
      redirectUrl = "/coach"
    } else {
      redirectUrl = "/coach/onboarding"
    }
  } else if (user.role === "INDIVIDUAL") {
    if (user.clientProfile?.onboardingCompleted) {
      redirectUrl = "/individual"
    } else {
      redirectUrl = "/individual/onboarding"
    }
  } else {
    // CLIENT role
    if (user.clientProfile?.onboardingCompleted) {
      redirectUrl = "/client"
    } else {
      redirectUrl = "/client/onboarding"
    }
  }
  
  return { redirectTo: redirectUrl }
}
