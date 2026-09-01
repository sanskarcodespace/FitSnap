"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";

export type HabitPlanItemInput = {
  id?: string;
  name: string;
  description?: string;
  targetFrequency: string; // "Daily" | "TimesPerWeek" | "NoSpecificTarget"
  targetTimesPerWeek?: number;
};

export type HabitPlanGuidelineInput = {
  text: string;
};

export type HabitPlanInput = {
  title: string;
  overview?: string;
  items: HabitPlanItemInput[];
  guidelines: HabitPlanGuidelineInput[];
};

async function getCoachSession() {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role !== "COACH") return null;
  return session;
}

function validateHabitPlanInput(input: HabitPlanInput) {
  if (!input.title || input.title.trim() === "") {
    return "Title is required";
  }
  if (input.title.length > 100) {
    return "Title must be 100 characters or less";
  }
  if (input.overview && input.overview.length > 2000) {
    return "Overview must be 2000 characters or less";
  }

  // Required to save: Title + at least one of overview, items, or guidelines
  const hasOverview = !!input.overview && input.overview.trim() !== "";
  const hasItems = input.items.length > 0;
  const hasGuidelines = input.guidelines.length > 0;
  if (!hasOverview && !hasItems && !hasGuidelines) {
    return "Plan must have some content (overview, habits, or guidelines)";
  }

  for (const item of input.items) {
    if (!item.name || item.name.trim() === "") {
      return "Habit name is required";
    }
    if (item.name.length > 150) {
      return "Habit name must be 150 characters or less";
    }
    if (item.description && item.description.length > 1000) {
      return "Habit description must be 1000 characters or less";
    }
    if (!["Daily", "TimesPerWeek", "NoSpecificTarget"].includes(item.targetFrequency)) {
      return "Invalid target frequency";
    }
    if (item.targetFrequency === "TimesPerWeek") {
      if (item.targetTimesPerWeek === undefined || item.targetTimesPerWeek === null) {
        return `Target times per week is required for "${item.name}"`;
      }
      const val = Number(item.targetTimesPerWeek);
      if (isNaN(val) || val < 1 || val > 7) {
        return "Times per week must be an integer between 1 and 7";
      }
    }
  }

  for (const g of input.guidelines) {
    if (!g.text || g.text.trim() === "") {
      return "Guideline text cannot be empty";
    }
    if (g.text.length > 500) {
      return "Guideline must be 500 characters or less";
    }
  }

  return null;
}

export async function createHabitPlan(connectionId: string, input: HabitPlanInput) {
  const session = await getCoachSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection || connection.coachId !== session.userId || connection.status !== "ACTIVE") {
    return { success: false, error: "Forbidden: Connection is not active or not yours" };
  }

  const validationError = validateHabitPlanInput(input);
  if (validationError) return { success: false, error: validationError };

  const existingActive = await prisma.habitPlan.findFirst({
    where: { coachClientConnectionId: connectionId, status: "ACTIVE" }
  });

  if (existingActive) {
    return { success: false, error: "An active habit plan already exists" };
  }

  try {
    await prisma.habitPlan.create({
      data: {
        coachClientConnectionId: connectionId,
        title: input.title.trim(),
        overview: input.overview?.trim() || null,
        status: "ACTIVE",
        items: {
          create: input.items.map((item, index) => ({
            name: item.name.trim(),
            description: item.description?.trim() || null,
            targetFrequency: item.targetFrequency,
            targetTimesPerWeek: item.targetFrequency === "TimesPerWeek" ? Number(item.targetTimesPerWeek) : null,
            sortOrder: index,
            status: "active"
          }))
        },
        guidelines: {
          create: input.guidelines.map(g => ({
            text: g.text.trim()
          }))
        }
      }
    });

    revalidatePath(`/coach/clients/${connectionId}`);
    revalidatePath(`/client/habits`);
    revalidatePath(`/client`);
    return { success: true };
  } catch (err) {
    console.error("Failed to create habit plan:", err);
    return { success: false, error: "Failed to create habit plan" };
  }
}

export async function updateHabitPlan(habitPlanId: string, input: HabitPlanInput) {
  const session = await getCoachSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const habitPlan = await prisma.habitPlan.findUnique({
    where: { id: habitPlanId },
    include: { connection: true, items: true }
  });

  if (
    !habitPlan ||
    habitPlan.connection?.coachId !== session.userId ||
    habitPlan.connection?.status !== "ACTIVE" ||
    habitPlan.status !== "ACTIVE"
  ) {
    return { success: false, error: "Forbidden: Cannot edit this plan" };
  }

  const validationError = validateHabitPlanInput(input);
  if (validationError) return { success: false, error: validationError };

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update the parent plan details
      await tx.habitPlan.update({
        where: { id: habitPlanId },
        data: {
          title: input.title.trim(),
          overview: input.overview?.trim() || null
        }
      });

      // 2. Recreate guidelines (guidelines don't have logs so we can delete & recreate)
      await tx.habitPlanGuideline.deleteMany({
        where: { habitPlanId }
      });
      if (input.guidelines.length > 0) {
        await tx.habitPlanGuideline.createMany({
          data: input.guidelines.map(g => ({
            habitPlanId,
            text: g.text.trim()
          }))
        });
      }

      // 3. Process items
      const submittedIds = new Set(input.items.map(item => item.id).filter(Boolean) as string[]);
      
      // Mark as removed any items that exist in the database but are not in the submitted list
      const databaseItems = habitPlan.items;
      const itemsToSoftDelete = databaseItems.filter(dbItem => !submittedIds.has(dbItem.id) && dbItem.status === "active");
      
      for (const item of itemsToSoftDelete) {
        await tx.habitPlanItem.update({
          where: { id: item.id },
          data: { status: "removed" }
        });
      }

      // Process input items: update existing active ones, or create new ones
      for (let index = 0; index < input.items.length; index++) {
        const item = input.items[index];
        if (item.id && databaseItems.some(dbItem => dbItem.id === item.id)) {
          // Update in place (preserving database id)
          await tx.habitPlanItem.update({
            where: { id: item.id },
            data: {
              name: item.name.trim(),
              description: item.description?.trim() || null,
              targetFrequency: item.targetFrequency,
              targetTimesPerWeek: item.targetFrequency === "TimesPerWeek" ? Number(item.targetTimesPerWeek) : null,
              sortOrder: index,
              status: "active" // ensure it's active in case it was somehow removed (e.g. re-added)
            }
          });
        } else {
          // Create new item
          await tx.habitPlanItem.create({
            data: {
              habitPlanId,
              name: item.name.trim(),
              description: item.description?.trim() || null,
              targetFrequency: item.targetFrequency,
              targetTimesPerWeek: item.targetFrequency === "TimesPerWeek" ? Number(item.targetTimesPerWeek) : null,
              sortOrder: index,
              status: "active"
            }
          });
        }
      }
    });

    revalidatePath(`/coach/clients/${habitPlan.coachClientConnectionId}`);
    revalidatePath(`/client/habits`);
    revalidatePath(`/client`);
    return { success: true };
  } catch (err) {
    console.error("Failed to update habit plan:", err);
    return { success: false, error: "Failed to update habit plan" };
  }
}

export async function archiveAndStartNewHabitPlan(connectionId: string, input: HabitPlanInput) {
  const session = await getCoachSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection || connection.coachId !== session.userId || connection.status !== "ACTIVE") {
    return { success: false, error: "Forbidden: Connection is not active or not yours" };
  }

  const validationError = validateHabitPlanInput(input);
  if (validationError) return { success: false, error: validationError };

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Archive current active plans
      await tx.habitPlan.updateMany({
        where: {
          coachClientConnectionId: connectionId,
          status: "ACTIVE"
        },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date()
        }
      });

      // 2. Create the new plan
      const newPlan = await tx.habitPlan.create({
        data: {
          coachClientConnectionId: connectionId,
          title: input.title.trim(),
          overview: input.overview?.trim() || null,
          status: "ACTIVE",
          guidelines: {
            create: input.guidelines.map(g => ({
              text: g.text.trim()
            }))
          }
        }
      });

      // 3. Create items under the new plan
      for (let index = 0; index < input.items.length; index++) {
        const item = input.items[index];
        await tx.habitPlanItem.create({
          data: {
            habitPlanId: newPlan.id,
            name: item.name.trim(),
            description: item.description?.trim() || null,
            targetFrequency: item.targetFrequency,
            targetTimesPerWeek: item.targetFrequency === "TimesPerWeek" ? Number(item.targetTimesPerWeek) : null,
            sortOrder: index,
            status: "active"
          }
        });
      }
    });

    revalidatePath(`/coach/clients/${connectionId}`);
    revalidatePath(`/client/habits`);
    revalidatePath(`/client`);
    return { success: true };
  } catch (err) {
    console.error("Failed to archive and start new habit plan:", err);
    return { success: false, error: "Failed to archive and start new habit plan" };
  }
}
