"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { revalidatePath } from "next/cache"

async function getSession() {
  const token = cookies().get("session_token")?.value
  if (!token) throw new Error("Not authenticated")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") throw new Error("Not authorized")
  
  return session
}

export async function upsertClientProfile(data: {
  goal?: string
  currentWeight?: number
  preferredWeightUnit?: string
  targetWeight?: number | null
  height?: number | null
  targetDate?: Date | null
  profilePhoto?: string | null
  onboardingCompleted?: boolean
}) {
  try {
    const session = await getSession()

    // Validate bounds
    if (data.currentWeight !== undefined && data.currentWeight <= 0) {
      return { success: false, error: "Current weight must be a positive number." }
    }
    if (data.targetWeight !== undefined && data.targetWeight !== null && data.targetWeight <= 0) {
      return { success: false, error: "Target weight must be a positive number." }
    }
    if (data.height !== undefined && data.height !== null && data.height <= 0) {
      return { success: false, error: "Height must be a positive number." }
    }

    const payload: any = { ...data }
    
    if (data.onboardingCompleted) {
      payload.onboardingCompletedAt = new Date()
    }

    await prisma.clientProfile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        goal: data.goal,
        currentWeight: data.currentWeight,
        preferredWeightUnit: data.preferredWeightUnit || "kg",
        targetWeight: data.targetWeight,
        height: data.height,
        targetDate: data.targetDate,
        profilePhoto: data.profilePhoto,
        onboardingCompleted: data.onboardingCompleted || false,
        onboardingCompletedAt: payload.onboardingCompletedAt
      },
      update: payload
    })

    revalidatePath("/client")
    return { success: true }
  } catch (error: any) {
    console.error("Profile upsert error:", error)
    return { success: false, error: "An unexpected error occurred while saving." }
  }
}
