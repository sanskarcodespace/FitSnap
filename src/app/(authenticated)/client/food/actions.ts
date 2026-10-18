"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import prisma from "@/lib/db/prisma"
import { processAndStoreImage } from "@/lib/upload"
import { getCatalogFood, searchCatalog } from "@/lib/food/catalog"
import { scaleNutrients, type CatalogReference, type FoodProvider } from "@/lib/food/catalog-types"
import { isCalendarDate, isNutritionAmount } from "@/lib/food-validation"
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

  if (!photoReference || !photoReference.startsWith(`/api/private-images/temp/${session.userId}/`)) {
    return { error: "Invalid photo reference or unauthorized" }
  }

  const filename = photoReference.split("/").pop()
  if (!filename || !filename.match(/^[a-zA-Z0-9_.-]+$/)) {
    return { error: "Invalid filename" }
  }

  try {
    const { getImageBuffer } = await import("@/lib/upload")
    const imageBuffer = await getImageBuffer(photoReference, session.userId)
    const detectedItems = await analyzeFoodImage(imageBuffer, filename)
    return { success: true, items: detectedItems }
  } catch (error: any) {
    console.error("AI Analysis error:", error)
    return { error: process.env.GEMINI_API_KEY ? "Photo recognition is unavailable. Search the food library instead." : "Photo recognition is not configured yet. Search the food library instead." }
  }
}

export async function searchFoodLibrary(query: string, provider: FoodProvider) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }
  if (!checkRateLimit("food-search-" + session.userId, { windowMs: 60000, max: 8 }).success) {
    return { error: "Please wait a minute before searching again." }
  }
  try {
    return { foods: await searchCatalog(query, provider) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Food search is unavailable. Please try again." }
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
    groupName?: string | null; // Groups AI-detected components into one dish
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    fiberGrams: number | null;
    sugarGrams?: number | null;
    sodiumMg?: number | null;
    catalogRef?: CatalogReference;
  }[];
}

export async function saveMealLog(input: SaveMealInput) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  if (!input || !Array.isArray(input.foodItems) || input.foodItems.length === 0 || input.foodItems.length > 20) {
    return { error: "Please add at least one food item." }
  }
  if (!isCalendarDate(input.date)) return { error: "Please choose a valid date." }
  if (!["Breakfast", "Lunch", "Dinner", "Snack"].includes(input.mealType)) {
    return { error: "Please choose a valid meal type." }
  }

  for (const item of input.foodItems) {
    if (!item || typeof item.name !== "string" || !item.name.trim()) {
      return { error: "All food items must have a name." }
    }
    const requiredAmounts = [item.calories, item.proteinGrams, item.carbGrams, item.fatGrams]
    const optionalAmounts = [item.fiberGrams, item.sugarGrams, item.sodiumMg]
    if (!requiredAmounts.every(isNutritionAmount) ||
        !optionalAmounts.every(value => value == null || isNutritionAmount(value))) {
      return { error: "Nutrition values must be non-negative whole numbers." }
    }
  }

  try {
    const existing = input.id ? await prisma.mealLog.findUnique({ where: { id: input.id } }) : null
    if (input.id && (!existing || existing.clientId !== session.userId)) return { error: "Not found or unauthorized" }
    let finalPhotoReference = input.photoReference ?? null
    if (finalPhotoReference && !new RegExp(`^/api/private-images/(temp|food)/${session.userId}/[a-zA-Z0-9_-]+\\.jpg$`).test(finalPhotoReference)) {
      return { error: "Invalid photo reference." }
    }
    // Never trust client-supplied macros or source metadata for a database record.
    const foodItems = await Promise.all(input.foodItems.map(async item => {
      const ref = item.catalogRef
      if (ref) {
        const food = await getCatalogFood(ref.provider, ref.id)
        const nutrients = scaleNutrients(food, ref.amount, ref.unit)
        return { ...nutrients, name: food.name, portionDescription: `${ref.amount} ${ref.unit}`,
          originType: "database", groupName: item.groupName || null,
          nutritionSource: food.provider, sourceFoodId: food.id, sourceUrl: food.sourceUrl,
          portionAmount: ref.amount, portionUnit: ref.unit }
      }
      return { name: item.name.trim(), portionDescription: item.portionDescription || null,
        originType: "manual", groupName: item.groupName || null,
        calories: item.calories, proteinGrams: item.proteinGrams, carbGrams: item.carbGrams,
        fatGrams: item.fatGrams, fiberGrams: item.fiberGrams ?? null,
        sugarGrams: item.sugarGrams ?? null, sodiumMg: item.sodiumMg ?? null,
        nutritionSource: "user", sourceFoodId: null, sourceUrl: null, portionAmount: null, portionUnit: null }
    }))
    if (finalPhotoReference?.startsWith("/api/private-images/temp/")) {
      const { moveImage } = await import("@/lib/upload")
      const moved = await moveImage(finalPhotoReference, "food", session.userId)
      if (!moved) return { error: "Could not attach the photo. Please upload it again." }
      finalPhotoReference = moved
    }
    const data = { date: input.date, mealType: input.mealType, photoReference: finalPhotoReference,
      source: finalPhotoReference ? "ai_assisted" : "manual" }
    const meal = input.id
      ? await prisma.mealLog.update({ where: { id: input.id }, data: { ...data, foodItems: { deleteMany: {}, create: foodItems } } })
      : await prisma.mealLog.create({ data: { ...data, clientId: session.userId, foodItems: { create: foodItems } } })
    const mealId = input.id || meal.id
    if (input.photoReference?.startsWith("/api/private-images/temp/")) {
      const { deleteImage } = await import("@/lib/upload")
      await deleteImage(input.photoReference, session.userId)
    }
    // Keep the old photo until the database write has succeeded.
    if (existing?.photoReference && existing.photoReference !== finalPhotoReference) {
      const { deleteImage } = await import("@/lib/upload")
      await deleteImage(existing.photoReference, session.userId)
    }

    revalidatePath("/client/food")
    revalidatePath("/individual/food")
    revalidatePath("/client")
    revalidatePath("/individual")
    
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

    await prisma.mealLog.delete({ where: { id: mealId } })
    if (meal.photoReference) {
      const { deleteImage } = await import("@/lib/upload")
      await deleteImage(meal.photoReference, session.userId)
    }

    revalidatePath("/client/food")
    revalidatePath("/individual/food")
    revalidatePath("/client")
    revalidatePath("/individual")

    return { success: true }
  } catch (error) {
    console.error("Error deleting meal log:", error)
    return { error: "Failed to delete meal log" }
  }
}

export async function addWater(date: string, amountMl: number) {
  const session = await getClientSession()
  if (!session) return { error: "Unauthorized" }

  if (!isCalendarDate(date)) return { error: "Please choose a valid date." }
  if (!isNutritionAmount(amountMl) || amountMl === 0) {
    return { error: "Water amount must be a positive whole number of milliliters." }
  }

  try {
    await prisma.waterLogEntry.create({
      data: {
        clientId: session.userId,
        date,
        amountMl
      }
    })

    revalidatePath("/client/food")
    revalidatePath("/individual/food")
    revalidatePath("/client")
    revalidatePath("/individual")

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
    revalidatePath("/individual/food")
    revalidatePath("/client")
    revalidatePath("/individual")

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
