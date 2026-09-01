"use server"

import prisma from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth/jwt"
import { cookies, headers } from "next/headers"
import { logAuditEvent } from "@/lib/auth/audit"

export async function signup(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = (formData.get("role") as string) || "INDIVIDUAL"

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  if (!["INDIVIDUAL", "COACH", "CLIENT"].includes(role)) {
    return { error: "Invalid account type" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { error: "Email already in use" }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        emailVerified: true // Auto verify for demo purposes
      }
    })

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
      eventType: "SIGNUP_SUCCESS",
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
    console.error("Signup error:", error)
    return { error: "Failed to create account" }
  }

  // Route based on role
  if (role === "COACH") {
    return { redirectTo: "/coach/onboarding" }
  } else if (role === "INDIVIDUAL") {
    return { redirectTo: "/individual/onboarding" }
  } else {
    return { redirectTo: "/client/onboarding" }
  }
}
