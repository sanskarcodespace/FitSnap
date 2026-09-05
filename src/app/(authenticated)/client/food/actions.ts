"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { processAndStoreImage } from "@/lib/upload"
import fs from "fs/promises"
import path from "path"
import { checkRateLimit } from "@/lib/rate-limit"

async function getClientSession() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return null
  const session = await verifyToken(token)
  if (!session || (session.role !== "CLIENT" && session.role !== "INDIVIDUAL")) return null
  return session
}

export async function uploadTempFoodPhoto(formData: FormData) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  // Rate Limiting Check
  const rateLimit = checkRateLimit(`upload_photo_${session.userId}`, { windowMs: 60000, max: 10 })
  if (!rateLimit.success) {
    return { error: "Too many uploads. Please try again later." }
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

export async function analyzeFoodPhoto(photoReference: string) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  // Rate Limiting Check
  const rateLimit = checkRateLimit(`analyze_food_${session.userId}`, { windowMs: 60000, max: 5 })
  if (!rateLimit.success) {
    return { error: "Too many analysis requests. Please try again later." }
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

export async function analyzeFoodTextAction(name: string, portion: string) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  // Rate Limiting Check (share limit with image analysis or separate, let's keep separate but similar)
  const rateLimit = checkRateLimit(`analyze_food_text_${session.userId}`, { windowMs: 60000, max: 10 })
  if (!rateLimit.success) {
    return { error: "Too many analysis requests. Please try again later." }
  }

  if (!name || name.trim().length === 0) {
    return { error: "Food name is required" }
  }

  try {
    const { analyzeFoodText } = await import("@/lib/ai/foodRecognition")
    const item = await analyzeFoodText(name, portion || "1 serving")
    if (!item) {
      return { error: "Could not calculate macros for this food." }
    }
    return { success: true, item }
  } catch (error: any) {
    console.error("AI Text Analysis error:", error)
    return { error: "Analysis failed" }
  }
}

export async function calculateNutritionAction(
  items: { name: string; quantity: number; unit: string }[]
) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  const rateLimit = checkRateLimit(`calc_nutrition_${session.userId}`, { windowMs: 60000, max: 10 })
  if (!rateLimit.success) {
    return { error: "Too many requests. Please try again later." }
  }

  if (!items || items.length === 0) {
    return { error: "No food items provided." }
  }

  // Validate each item
  for (const item of items) {
    if (!item.name || item.name.trim().length === 0) {
      return { error: "All food items must have a name." }
    }
    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      return { error: `Invalid quantity for "${item.name}". Must be a positive number.` }
    }
    if (!item.unit || item.unit.trim().length === 0) {
      return { error: `Missing unit for "${item.name}".` }
    }
  }

  try {
    const { calculateNutritionForItems } = await import("@/lib/ai/foodRecognition")
    const results = await calculateNutritionForItems(items)
    return { success: true, items: results }
  } catch (error: any) {
    console.error("Nutrition calculation error:", error)
    return { error: "Failed to calculate nutrition. Please try again." }
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
      const { moveImage } = await import("@/lib/upload")
      const newRef = await moveImage(finalPhotoReference, "food", session.userId)
      if (newRef) {
        finalPhotoReference = newRef
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
        const { deleteImage } = await import("@/lib/upload")
        await deleteImage(existing.photoReference, session.userId)
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
    revalidatePath("/", "layout")
    
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
      const { deleteImage } = await import("@/lib/upload")
      await deleteImage(meal.photoReference, session.userId)
    }

    await prisma.mealLog.delete({
      where: { id: mealId }
    })

    revalidatePath("/client/food")
    revalidatePath("/", "layout")

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
    revalidatePath("/", "layout")

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
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    console.error("Error removing water:", error)
    return { error: "Failed to remove water entry" }
  }
}

import { getNutritionHistorySummary } from "@/lib/data/nutrition";

export async function fetchClientNutritionHistory(startDate: string, endDate: string) {
  const session = await getClientSession();
  if (!session) throw new Error("Unauthorized");

  return getNutritionHistorySummary(session.userId, startDate, endDate);
}
