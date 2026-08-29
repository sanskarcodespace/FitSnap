"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { revalidatePath } from "next/cache"

export async function saveNutritionTargets(connectionId: string, formData: FormData) {
  const token = (await cookies()).get("session_token")?.value
  if (!token) return { error: "Not authenticated" }
  
  const session = await verifyToken(token)
  if (!session || session.role !== "COACH") return { error: "Not authorized" }

  // Verify ownership of connection
  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: connectionId }
  })

  if (!connection || connection.coachId !== session.userId || connection.status !== "ACTIVE") {
    return { error: "Connection not found or not active" }
  }

  // Parse and validate numeric inputs
  const parsePositiveInt = (val: FormDataEntryValue | null) => {
    if (!val) return null
    const num = parseInt(val.toString(), 10)
    return isNaN(num) || num <= 0 ? null : num
  }

  const parsePositiveFloat = (val: FormDataEntryValue | null) => {
    if (!val) return null
    const num = parseFloat(val.toString())
    return isNaN(num) || num <= 0 ? null : num
  }

  const calorieTarget = parsePositiveInt(formData.get("calorieTarget"))
  const proteinTargetGrams = parsePositiveInt(formData.get("proteinTargetGrams"))
  const carbTargetGrams = parsePositiveInt(formData.get("carbTargetGrams"))
  const fatTargetGrams = parsePositiveInt(formData.get("fatTargetGrams"))
  const waterTargetLiters = parsePositiveFloat(formData.get("waterTargetLiters"))
  
  // Fiber is optional, but if provided must be positive
  let fiberTargetGrams = null
  const fiberRaw = formData.get("fiberTargetGrams")
  if (fiberRaw) {
    fiberTargetGrams = parsePositiveInt(fiberRaw)
    if (!fiberTargetGrams) return { error: "Fiber must be a positive number if provided." }
  }

  if (!calorieTarget || !proteinTargetGrams || !carbTargetGrams || !fatTargetGrams || !waterTargetLiters) {
    return { error: "Please provide valid positive numbers for all required fields." }
  }

  try {
    await prisma.nutritionTarget.upsert({
      where: { connectionId },
      update: {
        calorieTarget,
        proteinTargetGrams,
        carbTargetGrams,
        fatTargetGrams,
        waterTargetLiters,
        fiberTargetGrams
      },
      create: {
        connectionId,
        calorieTarget,
        proteinTargetGrams,
        carbTargetGrams,
        fatTargetGrams,
        waterTargetLiters,
        fiberTargetGrams
      }
    })

    revalidatePath(`/coach/clients/${connectionId}`)
    return { success: true }
  } catch (err) {
    return { error: "An unexpected error occurred while saving targets." }
  }
}
