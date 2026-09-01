"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";

async function getClientSession() {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role !== "CLIENT") return null;
  return session;
}

export async function toggleHabitCompletion(
  habitPlanItemId: string,
  date: string, // YYYY-MM-DD
  checkState: boolean,
  note?: string
) {
  const session = await getClientSession();
  if (!session) return { success: false, error: "Unauthorized" };

  // Validate date is not in the future
  const todayStr = new Date().toISOString().split("T")[0];
  if (date > todayStr) {
    return { success: false, error: "Cannot check off habits for future dates" };
  }

  // Verify the habit item exists and belongs to this client
  const habitItem = await prisma.habitPlanItem.findUnique({
    where: { id: habitPlanItemId },
    include: {
      habitPlan: {
        include: {
          connection: true
        }
      }
    }
  });

  if (!habitItem || (habitItem.habitPlan.connection?.clientId !== session.userId && habitItem.habitPlan.clientId !== session.userId)) {
    return { success: false, error: "Unauthorized access to habit item" };
  }

  try {
    if (checkState) {
      // Find if completion already exists
      const existing = await prisma.habitCompletion.findFirst({
        where: {
          clientId: session.userId,
          habitPlanItemId,
          date
        }
      });

      if (existing) {
        // Just update note if provided
        if (note !== undefined) {
          await prisma.habitCompletion.update({
            where: { id: existing.id },
            data: { note: note.trim() || null }
          });
        }
        return { success: true };
      }

      // Create completion
      await prisma.habitCompletion.create({
        data: {
          clientId: session.userId,
          habitPlanItemId,
          date,
          habitNameSnapshot: habitItem.name,
          note: note?.trim() || null
        }
      });
    } else {
      // Delete completion
      await prisma.habitCompletion.deleteMany({
        where: {
          clientId: session.userId,
          habitPlanItemId,
          date
        }
      });
    }

    revalidatePath("/client/habits");
    revalidatePath("/client");
    if (habitItem.habitPlan.connection) {
      revalidatePath(`/coach/clients/${habitItem.habitPlan.connection.id}`);
    }
    return { success: true };
  } catch (err) {
    console.error("Failed to toggle habit completion:", err);
    return { success: false, error: "Failed to update habit completion" };
  }
}

export async function saveHabitCompletionNote(
  habitPlanItemId: string,
  date: string,
  note: string
) {
  const session = await getClientSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const completion = await prisma.habitCompletion.findFirst({
      where: {
        clientId: session.userId,
        habitPlanItemId,
        date
      },
      include: {
        habitPlanItem: {
          include: {
            habitPlan: {
              include: {
                connection: true
              }
            }
          }
        }
      }
    });

    if (!completion || completion.clientId !== session.userId) {
      return { success: false, error: "Habit completion not found or unauthorized" };
    }

    if (note.length > 500) {
      return { success: false, error: "Note must be 500 characters or less" };
    }

    await prisma.habitCompletion.update({
      where: { id: completion.id },
      data: { note: note.trim() || null }
    });

    revalidatePath("/client/habits");
    revalidatePath("/client");
    if (completion.habitPlanItem.habitPlan.connection) {
      revalidatePath(`/coach/clients/${completion.habitPlanItem.habitPlan.connection.id}`);
    }
    return { success: true };
  } catch (err) {
    console.error("Failed to save habit note:", err);
    return { success: false, error: "Failed to save note" };
  }
}
