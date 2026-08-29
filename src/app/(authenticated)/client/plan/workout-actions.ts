"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

export type WorkoutLogInput = {
  date: string; // YYYY-MM-DD
  title: string;
  category: string; // "Strength" | "Cardio" | "Sports" | "Other"
  durationMinutes?: number | null;
  notes?: string | null;
  source: string; // "plan" | "custom"
  linkedWorkoutPlanSessionId?: string | null;
};

export async function logWorkout(input: WorkoutLogInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") return { success: false, error: "Unauthorized" };

  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  if (input.title.length > 100) return { success: false, error: "Title too long" };

  if (!["Strength", "Cardio", "Sports", "Other"].includes(input.category)) {
    return { success: false, error: "Invalid category" };
  }

  if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
    if (input.durationMinutes < 0) return { success: false, error: "Duration cannot be negative" };
    if (input.durationMinutes > 1440) return { success: false, error: "Duration cannot exceed 24 hours" }; // 1440 mins
  }

  if (input.notes && input.notes.length > 1000) return { success: false, error: "Notes too long" };

  if (!input.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { success: false, error: "Invalid date format, expected YYYY-MM-DD" };
  }

  // Prevent logging in the future (based on server time; in a real app might consider client timezone but sticking to robust check)
  const inputDate = parseISO(input.date);
  if (!isValid(inputDate)) return { success: false, error: "Invalid date" };
  const today = new Date();
  if (startOfDay(inputDate) > endOfDay(today)) {
    return { success: false, error: "Cannot log workouts in the future" };
  }

  try {
    await prisma.workoutLog.create({
      data: {
        clientId: session.userId,
        date: input.date,
        title: input.title,
        category: input.category,
        durationMinutes: input.durationMinutes || null,
        notes: input.notes || null,
        source: input.source || "custom",
        linkedWorkoutPlanSessionId: input.linkedWorkoutPlanSessionId || null
      }
    });

    revalidatePath(`/client/plan`);
    revalidatePath(`/client`); // Dashboard
    return { success: true };
  } catch (err) {
    console.error("Failed to log workout:", err);
    return { success: false, error: "Failed to log workout" };
  }
}

export async function updateWorkoutLog(id: string, input: WorkoutLogInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") return { success: false, error: "Unauthorized" };

  const existingLog = await prisma.workoutLog.findUnique({ where: { id } });
  if (!existingLog || existingLog.clientId !== session.userId) {
    return { success: false, error: "Workout log not found or unauthorized" };
  }

  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  if (input.title.length > 100) return { success: false, error: "Title too long" };
  if (!["Strength", "Cardio", "Sports", "Other"].includes(input.category)) return { success: false, error: "Invalid category" };
  
  if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
    if (input.durationMinutes < 0) return { success: false, error: "Duration cannot be negative" };
    if (input.durationMinutes > 1440) return { success: false, error: "Duration cannot exceed 24 hours" };
  }

  if (input.notes && input.notes.length > 1000) return { success: false, error: "Notes too long" };

  if (!input.date.match(/^\d{4}-\d{2}-\d{2}$/)) return { success: false, error: "Invalid date format, expected YYYY-MM-DD" };
  
  const inputDate = parseISO(input.date);
  if (!isValid(inputDate)) return { success: false, error: "Invalid date" };
  const today = new Date();
  if (startOfDay(inputDate) > endOfDay(today)) {
    return { success: false, error: "Cannot log workouts in the future" };
  }

  try {
    await prisma.workoutLog.update({
      where: { id },
      data: {
        date: input.date,
        title: input.title,
        category: input.category,
        durationMinutes: input.durationMinutes || null,
        notes: input.notes || null,
        // we don't necessarily update source or linked session here unless desired, 
        // but typically a user might just update the content, not where it came from.
      }
    });

    revalidatePath(`/client/plan`);
    revalidatePath(`/client`);
    return { success: true };
  } catch (err) {
    console.error("Failed to update workout log:", err);
    return { success: false, error: "Failed to update workout log" };
  }
}

export async function deleteWorkoutLog(id: string) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") return { success: false, error: "Unauthorized" };

  const existingLog = await prisma.workoutLog.findUnique({ where: { id } });
  if (!existingLog || existingLog.clientId !== session.userId) {
    return { success: false, error: "Workout log not found or unauthorized" };
  }

  try {
    await prisma.workoutLog.delete({
      where: { id }
    });

    revalidatePath(`/client/plan`);
    revalidatePath(`/client`);
    return { success: true };
  } catch (err) {
    console.error("Failed to delete workout log:", err);
    return { success: false, error: "Failed to delete workout log" };
  }
}
