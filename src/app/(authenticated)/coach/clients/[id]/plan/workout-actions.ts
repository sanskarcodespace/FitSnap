"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";

export type WorkoutPlanExerciseInput = {
  name: string;
  setsRepsDescription?: string;
  notes?: string;
};

export type WorkoutPlanSessionInput = {
  name: string;
  description?: string;
  exercises: WorkoutPlanExerciseInput[];
};

export type WorkoutPlanGuidelineInput = {
  text: string;
};

export type WorkoutPlanInput = {
  title: string;
  overview?: string;
  sessions: WorkoutPlanSessionInput[];
  guidelines: WorkoutPlanGuidelineInput[];
};

export async function createWorkoutPlan(connectionId: string, input: WorkoutPlanInput) {
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
  const hasSessions = input.sessions.length > 0;
  const hasGuidelines = input.guidelines.length > 0;

  if (!hasOverview && !hasSessions && !hasGuidelines) {
    return { success: false, error: "Plan must have some content (overview, sessions, or guidelines)" };
  }
  
  if (input.title.length > 100) return { success: false, error: "Title too long" };
  if (input.overview && input.overview.length > 2000) return { success: false, error: "Overview too long" };

  for (const s of input.sessions) {
    if (!s.name || s.name.trim() === "") return { success: false, error: "Session name is required" };
    if (s.name.length > 100) return { success: false, error: "Session name too long" };
    if (s.description && s.description.length > 1000) return { success: false, error: "Session description too long" };
    for (const e of s.exercises) {
      if (!e.name || e.name.trim() === "") return { success: false, error: "Exercise name is required" };
      if (e.name.length > 100) return { success: false, error: "Exercise name too long" };
      if (e.setsRepsDescription && e.setsRepsDescription.length > 200) return { success: false, error: "Sets/Reps description too long" };
      if (e.notes && e.notes.length > 500) return { success: false, error: "Exercise notes too long" };
    }
  }

  for (const g of input.guidelines) {
    if (g.text.length > 500) return { success: false, error: "Guideline too long" };
  }

  const existingActive = await prisma.workoutPlan.findFirst({
    where: { coachClientConnectionId: connectionId, status: "ACTIVE" }
  });

  if (existingActive) {
    return { success: false, error: "An active workout plan already exists" };
  }

  try {
    await prisma.workoutPlan.create({
      data: {
        coachClientConnectionId: connectionId,
        title: input.title,
        overview: input.overview || null,
        status: "ACTIVE",
        sessions: {
          create: input.sessions.map((s, sIndex) => ({
            name: s.name,
            description: s.description || null,
            sortOrder: sIndex,
            exercises: {
              create: s.exercises.map((e, eIndex) => ({
                name: e.name,
                setsRepsDescription: e.setsRepsDescription || null,
                notes: e.notes || null,
                sortOrder: eIndex
              }))
            }
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
    console.error("Failed to create workout plan:", err);
    return { success: false, error: "Failed to create workout plan" };
  }
}

export async function updateWorkoutPlan(workoutPlanId: string, input: WorkoutPlanInput) {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return { success: false, error: "Unauthorized" };

  const session = await verifyToken(token);
  if (!session || session.role !== "COACH") return { success: false, error: "Unauthorized" };

  const workoutPlan = await prisma.workoutPlan.findUnique({
    where: { id: workoutPlanId },
    include: { connection: true }
  });

  if (!workoutPlan || workoutPlan.connection.coachId !== session.userId || workoutPlan.connection.status !== "ACTIVE" || workoutPlan.status !== "ACTIVE") {
    return { success: false, error: "Forbidden: Cannot edit this plan" };
  }
  
  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  const hasOverview = !!input.overview && input.overview.trim() !== "";
  const hasSessions = input.sessions.length > 0;
  const hasGuidelines = input.guidelines.length > 0;
  if (!hasOverview && !hasSessions && !hasGuidelines) return { success: false, error: "Plan must have some content" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.workoutPlan.update({
        where: { id: workoutPlanId },
        data: {
          title: input.title,
          overview: input.overview || null,
        }
      });
      
      // Delete existing sessions (will cascade delete exercises)
      await tx.workoutPlanSession.deleteMany({
        where: { workoutPlanId: workoutPlanId }
      });
      
      // Re-create sessions and exercises
      for (let sIndex = 0; sIndex < input.sessions.length; sIndex++) {
        const s = input.sessions[sIndex];
        await tx.workoutPlanSession.create({
          data: {
            workoutPlanId: workoutPlanId,
            name: s.name,
            description: s.description || null,
            sortOrder: sIndex,
            exercises: {
              create: s.exercises.map((e, eIndex) => ({
                name: e.name,
                setsRepsDescription: e.setsRepsDescription || null,
                notes: e.notes || null,
                sortOrder: eIndex
              }))
            }
          }
        });
      }

      await tx.workoutPlanGuideline.deleteMany({
        where: { workoutPlanId: workoutPlanId }
      });
      
      if (input.guidelines.length > 0) {
        await tx.workoutPlanGuideline.createMany({
          data: input.guidelines.map(g => ({
            workoutPlanId: workoutPlanId,
            text: g.text
          }))
        });
      }
    });

    revalidatePath(`/coach/clients/${workoutPlan.coachClientConnectionId}`);
    revalidatePath(`/client/plan`);
    return { success: true };
  } catch (err) {
    console.error("Failed to update workout plan:", err);
    return { success: false, error: "Failed to update workout plan" };
  }
}

export async function archiveAndStartNewWorkoutPlan(connectionId: string, input: WorkoutPlanInput) {
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
  const hasSessions = input.sessions.length > 0;
  const hasGuidelines = input.guidelines.length > 0;
  if (!hasOverview && !hasSessions && !hasGuidelines) return { success: false, error: "Plan must have some content" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.workoutPlan.updateMany({
        where: { 
          coachClientConnectionId: connectionId,
          status: "ACTIVE" 
        },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date()
        }
      });
      
      // Create new plan and nested sessions/exercises
      const newPlan = await tx.workoutPlan.create({
        data: {
          coachClientConnectionId: connectionId,
          title: input.title,
          overview: input.overview || null,
          status: "ACTIVE",
          guidelines: {
            create: input.guidelines.map(g => ({
              text: g.text
            }))
          }
        }
      });

      for (let sIndex = 0; sIndex < input.sessions.length; sIndex++) {
        const s = input.sessions[sIndex];
        await tx.workoutPlanSession.create({
          data: {
            workoutPlanId: newPlan.id,
            name: s.name,
            description: s.description || null,
            sortOrder: sIndex,
            exercises: {
              create: s.exercises.map((e, eIndex) => ({
                name: e.name,
                setsRepsDescription: e.setsRepsDescription || null,
                notes: e.notes || null,
                sortOrder: eIndex
              }))
            }
          }
        });
      }
    });

    revalidatePath(`/coach/clients/${connectionId}`);
    revalidatePath(`/client/plan`);
    return { success: true };
  } catch (err) {
    console.error("Failed to archive and start new workout plan:", err);
    return { success: false, error: "Failed to archive and start new workout plan" };
  }
}
