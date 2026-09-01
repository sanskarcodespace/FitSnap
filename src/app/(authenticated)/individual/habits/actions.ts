"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";

export async function addIndividualHabit(name: string, description: string = "", targetFrequency: string = "Daily", targetTimesPerWeek: number | null = null) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "INDIVIDUAL") return { success: false, error: "Unauthorized" };

  // Find or create active self-managed plan
  let plan = await prisma.habitPlan.findFirst({
    where: {
      clientId: session.userId,
      coachClientConnectionId: null,
      status: "ACTIVE"
    },
    include: { items: true }
  });

  if (!plan) {
    plan = await prisma.habitPlan.create({
      data: {
        clientId: session.userId,
        title: "My Habits",
        status: "ACTIVE",
      },
      include: { items: true }
    });
  }

  const sortOrder = plan.items.length;

  await prisma.habitPlanItem.create({
    data: {
      habitPlanId: plan.id,
      name,
      description,
      targetFrequency,
      targetTimesPerWeek,
      sortOrder,
      status: "active"
    }
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeIndividualHabit(itemId: string) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "INDIVIDUAL") return { success: false, error: "Unauthorized" };

  // Ensure this item belongs to a plan owned by the user
  const item = await prisma.habitPlanItem.findUnique({
    where: { id: itemId },
    include: { habitPlan: true }
  });

  if (!item || item.habitPlan.clientId !== session.userId) {
    return { success: false, error: "Unauthorized or not found" };
  }

  await prisma.habitPlanItem.update({
    where: { id: itemId },
    data: { status: "removed" }
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleIndividualHabit(itemId: string, dateStr: string, completed: boolean) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "INDIVIDUAL") return { success: false, error: "Unauthorized" };

  const item = await prisma.habitPlanItem.findUnique({
    where: { id: itemId },
    include: { habitPlan: true }
  });

  if (!item || item.habitPlan.clientId !== session.userId) {
    return { success: false, error: "Item not found" };
  }

  const existing = await prisma.habitCompletion.findFirst({
    where: {
      clientId: session.userId,
      habitPlanItemId: itemId,
      date: dateStr
    }
  });

  if (completed) {
    if (!existing) {
      await prisma.habitCompletion.create({
        data: {
          clientId: session.userId,
          habitPlanItemId: itemId,
          habitNameSnapshot: item.name,
          date: dateStr
        }
      });
    }
  } else {
    if (existing) {
      await prisma.habitCompletion.delete({
        where: { id: existing.id }
      });
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function saveIndividualHabitNote(itemId: string, dateStr: string, note: string) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "INDIVIDUAL") return { success: false, error: "Unauthorized" };

  const existing = await prisma.habitCompletion.findFirst({
    where: {
      clientId: session.userId,
      habitPlanItemId: itemId,
      date: dateStr
    }
  });

  if (!existing) {
    return { success: false, error: "Cannot add note to an incomplete habit" };
  }

  await prisma.habitCompletion.update({
    where: { id: existing.id },
    data: { note: note.trim() || null }
  });

  revalidatePath("/", "layout");
  return { success: true };
}
