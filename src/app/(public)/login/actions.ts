"use server"

import prisma from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

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
      include: { coachProfile: true }
    })
    
    if (!user) {
      return { error: "Invalid credentials" }
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return { error: "Invalid credentials" }
    }

    const token = await signToken({ userId: user.id, role: user.role })
    
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

  // Determine routing
  if (user.role === "COACH") {
    if (user.coachProfile?.onboardingCompleted) {
      redirect("/coach")
    } else {
      redirect("/coach/onboarding")
    }
  } else {
    redirect("/client")
  }
}
