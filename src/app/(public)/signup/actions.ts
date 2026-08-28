"use server"

import prisma from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth/jwt"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signup(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = (formData.get("role") as string) || "COACH"

  if (!email || !password) {
    return { error: "Email and password are required" }
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

    const token = await signToken({ userId: user.id, role: user.role })
    
    // Set cookie
    cookies().set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours
    })

  } catch (error) {
    console.error("Signup error:", error)
    return { error: "Failed to create account" }
  }

  // Next.js redirect must be outside the try/catch block
  redirect("/coach/onboarding")
}
