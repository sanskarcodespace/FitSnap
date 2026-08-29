"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";

export type YogaLogInput = {
  date: string; // YYYY-MM-DD
  title: string;
  style: string;
  durationMinutes?: number | null;
  notes?: string | null;
  source: string; // "plan" | "custom"
  linkedYogaPlanSequenceId?: string | null;
};

const VALID_STYLES = ["Hatha", "Vinyasa", "Yin", "Restorative", "Power", "Other"];

export async function logYogaSession(input: YogaLogInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") return { success: false, error: "Unauthorized" };

  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  if (input.title.length > 100) return { success: false, error: "Title too long" };

  if (!VALID_STYLES.includes(input.style)) {
    return { success: false, error: "Invalid style" };
  }

  if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
    if (input.durationMinutes < 0) return { success: false, error: "Duration cannot be negative" };
    if (input.durationMinutes > 1440) return { success: false, error: "Duration cannot exceed 24 hours" };
  }

  if (input.notes && input.notes.length > 1000) return { success: false, error: "Notes too long" };

  if (!input.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { success: false, error: "Invalid date format, expected YYYY-MM-DD" };
  }

  const inputDate = parseISO(input.date);
  if (!isValid(inputDate)) return { success: false, error: "Invalid date" };
  const today = new Date();
  if (startOfDay(inputDate) > endOfDay(today)) {
    return { success: false, error: "Cannot log yoga sessions in the future" };
  }

  try {
    await prisma.yogaLog.create({
      data: {
        clientId: session.userId,
        date: input.date,
        title: input.title,
        style: input.style,
        durationMinutes: input.durationMinutes || null,
        notes: input.notes || null,
        source: input.source || "custom",
        linkedYogaPlanSequenceId: input.linkedYogaPlanSequenceId || null
      }
    });

    revalidatePath(`/client/plan`);
    revalidatePath(`/client`); // Dashboard
    return { success: true };
  } catch (err) {
    console.error("Failed to log yoga session:", err);
    return { success: false, error: "Failed to log yoga session" };
  }
}

export async function updateYogaLog(id: string, input: YogaLogInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") return { success: false, error: "Unauthorized" };

  const existingLog = await prisma.yogaLog.findUnique({ where: { id } });
  if (!existingLog || existingLog.clientId !== session.userId) {
    return { success: false, error: "Yoga log not found or unauthorized" };
  }

  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  if (input.title.length > 100) return { success: false, error: "Title too long" };
  if (!VALID_STYLES.includes(input.style)) return { success: false, error: "Invalid style" };
  
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
    return { success: false, error: "Cannot log yoga sessions in the future" };
  }

  try {
    await prisma.yogaLog.update({
      where: { id },
      data: {
        date: input.date,
        title: input.title,
        style: input.style,
        durationMinutes: input.durationMinutes || null,
        notes: input.notes || null,
        source: input.source || "custom",
        linkedYogaPlanSequenceId: input.linkedYogaPlanSequenceId || null
      }
    });

    revalidatePath(`/client/plan`);
    revalidatePath(`/client`);
    return { success: true };
  } catch (err) {
    console.error("Failed to update yoga log:", err);
    return { success: false, error: "Failed to update yoga log" };
  }
}

export async function deleteYogaLog(id: string) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") return { success: false, error: "Unauthorized" };

  const existingLog = await prisma.yogaLog.findUnique({ where: { id } });
  if (!existingLog || existingLog.clientId !== session.userId) {
    return { success: false, error: "Yoga log not found or unauthorized" };
  }

  try {
    await prisma.yogaLog.delete({
      where: { id }
    });

    revalidatePath(`/client/plan`);
    revalidatePath(`/client`);
    return { success: true };
  } catch (err) {
    console.error("Failed to delete yoga log:", err);
    return { success: false, error: "Failed to delete yoga log" };
  }
}
