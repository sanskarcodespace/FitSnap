"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";

export type MealGuidanceInput = {
  mealType: string;
  customLabel?: string;
  guidanceText: string;
};

export type GuidelineInput = {
  text: string;
};

export type DietPlanInput = {
  title: string;
  overview?: string;
  mealGuidance: MealGuidanceInput[];
  guidelines: GuidelineInput[];
};

export async function createDietPlan(connectionId: string, input: DietPlanInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "COACH") return { success: false, error: "Unauthorized" };

  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection || connection.coachId !== session.userId || connection.status !== "ACTIVE") {
    return { success: false, error: "Forbidden: Connection is not active or not yours" };
  }
  
  if (!input.title || input.title.trim() === "") {
    return { success: false, error: "Title is required" };
  }

  const hasOverview = !!input.overview && input.overview.trim() !== "";
  const hasMeals = input.mealGuidance.length > 0;
  const hasGuidelines = input.guidelines.length > 0;

  if (!hasOverview && !hasMeals && !hasGuidelines) {
    return { success: false, error: "Plan must have some content (overview, meal guidance, or guidelines)" };
  }
  
  if (input.title.length > 100) return { success: false, error: "Title too long" };
  if (input.overview && input.overview.length > 2000) return { success: false, error: "Overview too long" };
  
  for (const mg of input.mealGuidance) {
    if (mg.guidanceText.length > 1000) return { success: false, error: "Meal guidance too long" };
    if (mg.customLabel && mg.customLabel.length > 50) return { success: false, error: "Meal label too long" };
  }

  for (const g of input.guidelines) {
    if (g.text.length > 500) return { success: false, error: "Guideline too long" };
  }

  const existingActive = await prisma.dietPlan.findFirst({
    where: { coachClientConnectionId: connectionId, status: "ACTIVE" }
  });

  if (existingActive) {
    return { success: false, error: "An active diet plan already exists" };
  }

  try {
    await prisma.dietPlan.create({
      data: {
        coachClientConnectionId: connectionId,
        title: input.title,
        overview: input.overview || null,
        status: "ACTIVE",
        mealGuidance: {
          create: input.mealGuidance.map(mg => ({
            mealType: mg.mealType,
            customLabel: mg.customLabel || null,
            guidanceText: mg.guidanceText
          }))
        },
        guidelines: {
          create: input.guidelines.map(g => ({
            text: g.text
          }))
        }
      }
    });

    revalidatePath(`/coach/clients/${connectionId}`);
    revalidatePath(`/client/plan`);
    return { success: true };
  } catch (err) {
    console.error("Failed to create diet plan:", err);
    return { success: false, error: "Failed to create diet plan" };
  }
}

export async function updateDietPlan(dietPlanId: string, input: DietPlanInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "COACH") return { success: false, error: "Unauthorized" };

  const dietPlan = await prisma.dietPlan.findUnique({
    where: { id: dietPlanId },
    include: { connection: true }
  });

  if (!dietPlan || dietPlan.connection.coachId !== session.userId || dietPlan.connection.status !== "ACTIVE" || dietPlan.status !== "ACTIVE") {
    return { success: false, error: "Forbidden: Cannot edit this plan" };
  }
  
  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  const hasOverview = !!input.overview && input.overview.trim() !== "";
  const hasMeals = input.mealGuidance.length > 0;
  const hasGuidelines = input.guidelines.length > 0;
  if (!hasOverview && !hasMeals && !hasGuidelines) return { success: false, error: "Plan must have some content" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dietPlan.update({
        where: { id: dietPlanId },
        data: {
          title: input.title,
          overview: input.overview || null,
        }
      });
      
      await tx.dietPlanMealGuidance.deleteMany({
        where: { dietPlanId: dietPlanId }
      });
      if (input.mealGuidance.length > 0) {
        await tx.dietPlanMealGuidance.createMany({
          data: input.mealGuidance.map(mg => ({
            dietPlanId: dietPlanId,
            mealType: mg.mealType,
            customLabel: mg.customLabel || null,
            guidanceText: mg.guidanceText
          }))
        });
      }

      await tx.dietPlanGuideline.deleteMany({
        where: { dietPlanId: dietPlanId }
      });
      if (input.guidelines.length > 0) {
        await tx.dietPlanGuideline.createMany({
          data: input.guidelines.map(g => ({
            dietPlanId: dietPlanId,
            text: g.text
          }))
        });
      }
    });

    revalidatePath(`/coach/clients/${dietPlan.coachClientConnectionId}`);
    revalidatePath(`/client/plan`);
    return { success: true };
  } catch (err) {
    console.error("Failed to update diet plan:", err);
    return { success: false, error: "Failed to update diet plan" };
  }
}

export async function archiveAndStartNewDietPlan(connectionId: string, input: DietPlanInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "COACH") return { success: false, error: "Unauthorized" };

  const connection = await prisma.coachClientConnection.findUnique({
    where: { id: connectionId }
  });

  if (!connection || connection.coachId !== session.userId || connection.status !== "ACTIVE") {
    return { success: false, error: "Forbidden: Connection is not active or not yours" };
  }
  
  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  const hasOverview = !!input.overview && input.overview.trim() !== "";
  const hasMeals = input.mealGuidance.length > 0;
  const hasGuidelines = input.guidelines.length > 0;
  if (!hasOverview && !hasMeals && !hasGuidelines) return { success: false, error: "Plan must have some content" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.dietPlan.updateMany({
        where: { 
          coachClientConnectionId: connectionId,
          status: "ACTIVE" 
        },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date()
        }
      });
      
      await tx.dietPlan.create({
        data: {
          coachClientConnectionId: connectionId,
          title: input.title,
          overview: input.overview || null,
          status: "ACTIVE",
          mealGuidance: {
            create: input.mealGuidance.map(mg => ({
              mealType: mg.mealType,
              customLabel: mg.customLabel || null,
              guidanceText: mg.guidanceText
            }))
          },
          guidelines: {
            create: input.guidelines.map(g => ({
              text: g.text
            }))
          }
        }
      });
    });

    revalidatePath(`/coach/clients/${connectionId}`);
    revalidatePath(`/client/plan`);
    return { success: true };
  } catch (err) {
    console.error("Failed to archive and start new diet plan:", err);
    return { success: false, error: "Failed to archive and start new diet plan" };
  }
}
