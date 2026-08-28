"use server"

import prisma from "@/lib/db/prisma"
import { processAndStoreImage } from "@/lib/upload"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { redirect } from "next/navigation"

async function getSession() {
  const token = cookies().get("session_token")?.value
  if (!token) return null
  return verifyToken(token)
}

export async function saveOnboarding(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "COACH") {
    return { error: "Unauthorized" }
  }

  const businessName = formData.get("businessName") as string
  const bio = formData.get("bio") as string
  const specialties = formData.getAll("specialties") as string[]
  const credentials = formData.get("credentials") as string
  const timezone = formData.get("timezone") as string
  const profilePhotoFile = formData.get("profilePhoto") as File | null
  const isFinalStep = formData.get("isFinalStep") === "true"

  // Validation
  if (isFinalStep) {
    if (!businessName?.trim()) {
      return { error: "Business name is required." }
    }
    if (!specialties || specialties.length === 0) {
      return { error: "At least one specialty is required." }
    }
  }

  try {
    let profilePhotoPath: string | undefined = undefined

    if (profilePhotoFile && profilePhotoFile.size > 0) {
      profilePhotoPath = await processAndStoreImage(profilePhotoFile, {
        folder: "profiles",
        maxWidth: 400,
        maxHeight: 400
      })
    }

    const data: any = {
      businessName: businessName || null,
      bio: bio || null,
      specialties: specialties,
      credentials: credentials || null,
      timezone: timezone || "UTC",
    }

    if (profilePhotoPath) {
      data.profilePhoto = profilePhotoPath
    }

    if (isFinalStep) {
      data.onboardingCompleted = true
      data.onboardingCompletedAt = new Date()
    }

    await prisma.coachProfile.upsert({
      where: { userId: session.userId },
      update: data,
      create: {
        userId: session.userId,
        ...data
      }
    })

    if (isFinalStep) {
      redirect("/coach")
    }

    return { success: true }
  } catch (error: any) {
    console.error("Save onboarding error:", error)
    return { error: error.message || "Failed to save progress." }
  }
}
