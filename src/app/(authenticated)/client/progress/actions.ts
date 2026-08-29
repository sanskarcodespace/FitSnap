"use server"

import prisma from "@/lib/db/prisma"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth/jwt"
import { revalidatePath } from "next/cache"
import { getWeightHistory, getMeasurementHistory, MeasurementType } from "@/lib/progress/history"

async function getSession() {
  const token = (await cookies()).get("session_token")?.value
  if (!token) throw new Error("Not authenticated")
  
  const session = await verifyToken(token)
  if (!session || session.role !== "CLIENT") throw new Error("Not authorized")
  
  return session
}

export async function logWeight(data: {
  date: string,
  weightValue: number,
  note?: string
}) {
  try {
    const session = await getSession();
    
    if (data.weightValue <= 0 || data.weightValue > 1000) {
      return { success: false, error: "Please enter a valid weight." };
    }
    
    const entryDate = new Date(data.date);
    if (entryDate > new Date()) {
      return { success: false, error: "Cannot log weight in the future." };
    }

    const profile = await prisma.clientProfile.findUnique({
      where: { userId: session.userId }
    });

    if (!profile) {
      return { success: false, error: "Profile not found." };
    }

    await prisma.weightEntry.create({
      data: {
        clientId: session.userId,
        date: entryDate,
        weightValue: data.weightValue,
        weightUnit: profile.preferredWeightUnit || "kg",
        note: data.note || null
      }
    });

    revalidatePath("/client");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to log weight:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function editWeight(id: string, data: {
  date: string,
  weightValue: number,
  note?: string
}) {
  try {
    const session = await getSession();
    
    if (data.weightValue <= 0 || data.weightValue > 1000) {
      return { success: false, error: "Please enter a valid weight." };
    }
    
    const entryDate = new Date(data.date);
    if (entryDate > new Date()) {
      return { success: false, error: "Cannot log weight in the future." };
    }

    const entry = await prisma.weightEntry.findUnique({ where: { id } });
    if (!entry || entry.clientId !== session.userId) {
      return { success: false, error: "Entry not found or access denied." };
    }

    await prisma.weightEntry.update({
      where: { id },
      data: {
        date: entryDate,
        weightValue: data.weightValue,
        note: data.note || null
      }
    });

    revalidatePath("/client");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to edit weight:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteWeight(id: string) {
  try {
    const session = await getSession();
    
    const entry = await prisma.weightEntry.findUnique({ where: { id } });
    if (!entry || entry.clientId !== session.userId) {
      return { success: false, error: "Entry not found or access denied." };
    }

    await prisma.weightEntry.delete({ where: { id } });

    revalidatePath("/client");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete weight:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function logMeasurement(data: {
  date: string,
  waistValue?: number,
  chestValue?: number,
  hipsValue?: number,
  armsValue?: number,
  thighsValue?: number,
  note?: string
}) {
  try {
    const session = await getSession();
    
    const entryDate = new Date(data.date);
    if (entryDate > new Date()) {
      return { success: false, error: "Cannot log measurements in the future." };
    }

    if (!data.waistValue && !data.chestValue && !data.hipsValue && !data.armsValue && !data.thighsValue) {
      return { success: false, error: "Please provide at least one measurement." };
    }

    // Basic positive bounds check
    const values = [data.waistValue, data.chestValue, data.hipsValue, data.armsValue, data.thighsValue];
    for (const val of values) {
      if (val !== undefined && val !== null && (val <= 0 || val > 1000)) {
        return { success: false, error: "Please enter valid positive measurements." };
      }
    }

    const profile = await prisma.clientProfile.findUnique({
      where: { userId: session.userId }
    });

    if (!profile) {
      return { success: false, error: "Profile not found." };
    }

    await prisma.bodyMeasurementEntry.create({
      data: {
        clientId: session.userId,
        date: entryDate,
        waistValue: data.waistValue,
        chestValue: data.chestValue,
        hipsValue: data.hipsValue,
        armsValue: data.armsValue,
        thighsValue: data.thighsValue,
        measurementUnit: profile.preferredMeasurementUnit || "cm",
        note: data.note || null
      }
    });

    revalidatePath("/client");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to log measurement:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function editMeasurement(id: string, data: {
  date: string,
  waistValue?: number,
  chestValue?: number,
  hipsValue?: number,
  armsValue?: number,
  thighsValue?: number,
  note?: string
}) {
  try {
    const session = await getSession();
    
    const entryDate = new Date(data.date);
    if (entryDate > new Date()) {
      return { success: false, error: "Cannot log measurements in the future." };
    }

    if (!data.waistValue && !data.chestValue && !data.hipsValue && !data.armsValue && !data.thighsValue) {
      return { success: false, error: "Please provide at least one measurement." };
    }

    const values = [data.waistValue, data.chestValue, data.hipsValue, data.armsValue, data.thighsValue];
    for (const val of values) {
      if (val !== undefined && val !== null && (val <= 0 || val > 1000)) {
        return { success: false, error: "Please enter valid positive measurements." };
      }
    }

    const entry = await prisma.bodyMeasurementEntry.findUnique({ where: { id } });
    if (!entry || entry.clientId !== session.userId) {
      return { success: false, error: "Entry not found or access denied." };
    }

    await prisma.bodyMeasurementEntry.update({
      where: { id },
      data: {
        date: entryDate,
        waistValue: data.waistValue,
        chestValue: data.chestValue,
        hipsValue: data.hipsValue,
        armsValue: data.armsValue,
        thighsValue: data.thighsValue,
        note: data.note || null
      }
    });

    revalidatePath("/client");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to edit measurement:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteMeasurement(id: string) {
  try {
    const session = await getSession();
    
    const entry = await prisma.bodyMeasurementEntry.findUnique({ where: { id } });
    if (!entry || entry.clientId !== session.userId) {
      return { success: false, error: "Entry not found or access denied." };
    }

    await prisma.bodyMeasurementEntry.delete({ where: { id } });

    revalidatePath("/client");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete measurement:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function updatePreferredMeasurementUnit(unit: "cm" | "in") {
  try {
    const session = await getSession();
    
    await prisma.clientProfile.update({
      where: { userId: session.userId },
      data: { preferredMeasurementUnit: unit }
    });

    revalidatePath("/client");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update measurement unit:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function fetchWeightHistory(startDateStr: string, endDateStr: string) {
  const session = await getSession();
  return getWeightHistory(session.userId, startDateStr, endDateStr);
}

export async function fetchMeasurementHistory(type: MeasurementType, startDateStr: string, endDateStr: string) {
  const session = await getSession();
  return getMeasurementHistory(session.userId, type, startDateStr, endDateStr);
}
