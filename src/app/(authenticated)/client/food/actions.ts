"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { processAndStoreImage } from "@/lib/upload"
import fs from "fs/promises"
import path from "path"

async function getClientSession() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return null
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") return null
  return session
}

// Simple in-memory rate limiter for photo uploads (max 10 per minute per user)
const uploadRateLimits = new Map<string, { count: number, timestamp: number }>()

export async function uploadTempFoodPhoto(formData: FormData) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  // Rate Limiting Check
  const now = Date.now()
  const userRate = uploadRateLimits.get(session.userId)
  if (userRate) {
    if (now - userRate.timestamp < 60000) {
      if (userRate.count >= 10) {
        return { error: "Too many uploads. Please try again later." }
      }
      userRate.count += 1
    } else {
      uploadRateLimits.set(session.userId, { count: 1, timestamp: now })
    }
  } else {
    uploadRateLimits.set(session.userId, { count: 1, timestamp: now })
  }

  const file = formData.get("photo") as File
  if (!file) return { error: "No photo provided" }

  try {
    // Process and store the image securely in the temp folder
    // The path will be /api/private-images/temp/[clientId]/filename.jpg
    const tempUrl = await processAndStoreImage(file, {
      folder: `temp/${session.userId}`,
      private: true,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85
    })

    return { success: true, tempUrl }
  } catch (error: any) {
    console.error("Error uploading temp food photo:", error)
    return { error: error.message || "Failed to upload photo" }
  }
}

import { analyzeFoodImage } from "@/lib/ai/foodRecognition"

// Simple in-memory rate limiter for AI calls (max 5 per minute per user)
const aiRateLimits = new Map<string, { count: number, timestamp: number }>()

export async function analyzeFoodPhoto(photoReference: string) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  // Rate Limiting Check
  const now = Date.now()
  const userRate = aiRateLimits.get(session.userId)
  if (userRate) {
    if (now - userRate.timestamp < 60000) {
      if (userRate.count >= 5) {
        return { error: "Too many analysis requests. Please try again later." }
      }
      userRate.count += 1
    } else {
      aiRateLimits.set(session.userId, { count: 1, timestamp: now })
    }
  } else {
    aiRateLimits.set(session.userId, { count: 1, timestamp: now })
  }

  if (!photoReference || !photoReference.includes(`/api/private-images/temp/${session.userId}/`)) {
    return { error: "Invalid photo reference or unauthorized" }
  }

  const filename = photoReference.split("/").pop()
  if (!filename || !filename.match(/^[a-zA-Z0-9_.-]+$/)) {
    return { error: "Invalid filename" }
  }

  const filePath = path.join(process.cwd(), "private", "uploads", "temp", session.userId, filename)
  
  try {
    const detectedItems = await analyzeFoodImage(filePath)
    return { success: true, items: detectedItems }
  } catch (error: any) {
    console.error("AI Analysis error:", error)
    return { error: "Analysis failed" }
  }
}

export type SaveMealInput = {
  id?: string;
  date: string;
  mealType: string;
  source?: string; // "manual" or "ai_assisted"
  photoReference?: string | null;
  foodItems: {
    name: string;
    portionDescription?: string;
    originType?: string; // "manual" or "ai_detected"
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    fiberGrams: number;
  }[];
}

export async function saveMealLog(input: SaveMealInput) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  if (!input.date || !input.mealType || !input.foodItems || input.foodItems.length === 0) {
    return { error: "Missing required fields" }
  }

  try {
    let finalPhotoReference = input.photoReference

    // If the photoReference points to the temp directory, we must move it to the permanent directory
    if (finalPhotoReference && finalPhotoReference.includes("/api/private-images/temp/")) {
      const filename = finalPhotoReference.split("/").pop()
      if (filename && filename.match(/^[a-zA-Z0-9_.-]+$/)) {
        const tempPath = path.join(process.cwd(), "private", "uploads", "temp", session.userId, filename)
        const finalDir = path.join(process.cwd(), "private", "uploads", "food", session.userId)
        const finalPath = path.join(finalDir, filename)
        
        // Ensure final directory exists
        await fs.mkdir(finalDir, { recursive: true })
        
        // Move the file
        try {
          await fs.rename(tempPath, finalPath)
          finalPhotoReference = `/api/private-images/food/${session.userId}/${filename}`
        } catch (moveErr) {
          console.error("Failed to move temp photo to permanent storage:", moveErr)
          // Fallback: clear it if we couldn't move it
          finalPhotoReference = null
        }
      } else {
        finalPhotoReference = null
      }
    }

    let mealId = input.id

    if (mealId) {
      // Update existing meal
      const existing = await prisma.mealLog.findUnique({ where: { id: mealId } })
      if (!existing || existing.clientId !== session.userId) return { error: "Not found or unauthorized" }
      
      // If photo changed/removed, clean up the old one
      if (existing.photoReference && existing.photoReference !== finalPhotoReference) {
        const oldFilename = existing.photoReference.split("/").pop()
        if (oldFilename && oldFilename.match(/^[a-zA-Z0-9_.-]+$/)) {
          const oldPath = path.join(process.cwd(), "private", "uploads", "food", session.userId, oldFilename)
          try {
             await fs.unlink(oldPath)
          } catch (e) {} // ignore if already deleted
        }
      }

      await prisma.mealLog.update({
        where: { id: mealId },
        data: {
          date: input.date,
          mealType: input.mealType,
          photoReference: finalPhotoReference,
          // Only update source if explicitly provided, otherwise keep existing
          ...(input.source ? { source: input.source } : {}),
          foodItems: {
            deleteMany: {}, // replace all items
            create: input.foodItems.map(item => ({
              name: item.name,
              portionDescription: item.portionDescription || null,
              originType: item.originType || "manual",
              calories: item.calories,
              proteinGrams: item.proteinGrams,
              carbGrams: item.carbGrams,
              fatGrams: item.fatGrams,
              fiberGrams: item.fiberGrams,
            }))
          }
        }
      })
    } else {
      // Create new meal
      const meal = await prisma.mealLog.create({
        data: {
          clientId: session.userId,
          date: input.date,
          mealType: input.mealType,
          source: input.source || "manual",
          photoReference: finalPhotoReference,
          foodItems: {
            create: input.foodItems.map(item => ({
              name: item.name,
              portionDescription: item.portionDescription || null,
              originType: item.originType || "manual",
              calories: item.calories,
              proteinGrams: item.proteinGrams,
              carbGrams: item.carbGrams,
              fatGrams: item.fatGrams,
              fiberGrams: item.fiberGrams,
            }))
          }
        }
      })
      mealId = meal.id
    }

    revalidatePath("/client/food")
    revalidatePath("/client")
    
    return { success: true, id: mealId }
  } catch (error) {
    console.error("Error saving meal log:", error)
    return { error: "Failed to save meal log" }
  }
}

export async function deleteMealLog(mealId: string) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  try {
    // Ensure the meal belongs to the client before deleting
    const meal = await prisma.mealLog.findUnique({
      where: { id: mealId }
    })

    if (!meal || meal.clientId !== session.userId) {
      return { error: "Not found or unauthorized" }
    }

    // Clean up associated photo file
    if (meal.photoReference) {
      const filename = meal.photoReference.split("/").pop()
      if (filename && filename.match(/^[a-zA-Z0-9_.-]+$/)) {
        const filePath = path.join(process.cwd(), "private", "uploads", "food", session.userId, filename)
        try {
          await fs.unlink(filePath)
        } catch (e) {} // ignore unlink errors if file doesn't exist
      }
    }

    await prisma.mealLog.delete({
      where: { id: mealId }
    })

    revalidatePath("/client/food")
    revalidatePath("/client")

    return { success: true }
  } catch (error) {
    console.error("Error deleting meal log:", error)
    return { error: "Failed to delete meal log" }
  }
}

export async function addWater(date: string, amountMl: number) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  try {
    await prisma.waterLogEntry.create({
      data: {
        clientId: session.userId,
        date,
        amountMl
      }
    })

    revalidatePath("/client/food")
    revalidatePath("/client")

    return { success: true }
  } catch (error) {
    console.error("Error adding water:", error)
    return { error: "Failed to add water" }
  }
}

export async function removeLastWater(date: string) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  try {
    // Find the most recent water entry for this client and date
    const lastEntry = await prisma.waterLogEntry.findFirst({
      where: {
        clientId: session.userId,
        date
      },
      orderBy: {
        loggedAt: 'desc'
      }
    })

    if (!lastEntry) {
      return { error: "No water entries found to delete" }
    }

    await prisma.waterLogEntry.delete({
      where: { id: lastEntry.id }
    })

    revalidatePath("/client/food")
    revalidatePath("/client")

    return { success: true }
  } catch (error) {
    console.error("Error removing water:", error)
    return { error: "Failed to remove water entry" }
  }
}
