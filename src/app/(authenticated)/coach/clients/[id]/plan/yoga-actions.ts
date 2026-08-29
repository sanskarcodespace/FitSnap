"use server";

import prisma from "@/lib/db/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { revalidatePath } from "next/cache";

export type YogaPlanPoseInput = {
  name: string;
  holdOrRepGuidance?: string;
  notes?: string;
};

export type YogaPlanSequenceInput = {
  name: string;
  description?: string;
  style?: string;
  durationGuidance?: string;
  poses: YogaPlanPoseInput[];
};

export type YogaPlanGuidelineInput = {
  text: string;
};

export type YogaPlanInput = {
  title: string;
  overview?: string;
  sequences: YogaPlanSequenceInput[];
  guidelines: YogaPlanGuidelineInput[];
};

const VALID_STYLES = ["Hatha", "Vinyasa", "Yin", "Restorative", "Power", "Other"];

export async function createYogaPlan(connectionId: string, input: YogaPlanInput) {
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
  const hasSequences = input.sequences.length > 0;
  const hasGuidelines = input.guidelines.length > 0;

  if (!hasOverview && !hasSequences && !hasGuidelines) {
    return { success: false, error: "Plan must have some content (overview, sequences, or guidelines)" };
  }
  
  if (input.title.length > 100) return { success: false, error: "Title too long" };
  if (input.overview && input.overview.length > 2000) return { success: false, error: "Overview too long" };

  for (const s of input.sequences) {
    if (!s.name || s.name.trim() === "") return { success: false, error: "Sequence name is required" };
    if (s.name.length > 100) return { success: false, error: "Sequence name too long" };
    if (s.description && s.description.length > 1000) return { success: false, error: "Sequence description too long" };
    if (s.style && !VALID_STYLES.includes(s.style)) return { success: false, error: "Invalid style" };
    if (s.durationGuidance && s.durationGuidance.length > 100) return { success: false, error: "Duration guidance too long" };

    for (const p of s.poses) {
      if (!p.name || p.name.trim() === "") return { success: false, error: "Pose name is required" };
      if (p.name.length > 100) return { success: false, error: "Pose name too long" };
      if (p.holdOrRepGuidance && p.holdOrRepGuidance.length > 200) return { success: false, error: "Hold/Rep guidance too long" };
      if (p.notes && p.notes.length > 500) return { success: false, error: "Pose notes too long" };
    }
  }

  for (const g of input.guidelines) {
    if (g.text.length > 500) return { success: false, error: "Guideline too long" };
  }

  const existingActive = await prisma.yogaPlan.findFirst({
    where: { coachClientConnectionId: connectionId, status: "ACTIVE" }
  });

  if (existingActive) {
    return { success: false, error: "An active yoga plan already exists" };
  }

  try {
    await prisma.yogaPlan.create({
      data: {
        coachClientConnectionId: connectionId,
        title: input.title,
        overview: input.overview || null,
        status: "ACTIVE",
        sequences: {
          create: input.sequences.map((s, sIndex) => ({
            name: s.name,
            description: s.description || null,
            style: s.style || null,
            durationGuidance: s.durationGuidance || null,
            sortOrder: sIndex,
            poses: {
              create: s.poses.map((p, pIndex) => ({
                name: p.name,
                holdOrRepGuidance: p.holdOrRepGuidance || null,
                notes: p.notes || null,
                sortOrder: pIndex
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
    return { success: true };
  } catch (err) {
    console.error("Failed to create yoga plan:", err);
    return { success: false, error: "Failed to create yoga plan" };
  }
}

export async function updateYogaPlan(connectionId: string, planId: string, input: YogaPlanInput) {
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

  const existingPlan = await prisma.yogaPlan.findUnique({
    where: { id: planId }
  });

  if (!existingPlan || existingPlan.coachClientConnectionId !== connectionId) {
    return { success: false, error: "Plan not found or unauthorized" };
  }
  
  if (existingPlan.status !== "ACTIVE") {
    return { success: false, error: "Cannot edit an archived plan" };
  }

  if (!input.title || input.title.trim() === "") return { success: false, error: "Title is required" };
  
  const hasOverview = !!input.overview && input.overview.trim() !== "";
  const hasSequences = input.sequences.length > 0;
  const hasGuidelines = input.guidelines.length > 0;

  if (!hasOverview && !hasSequences && !hasGuidelines) {
    return { success: false, error: "Plan must have some content" };
  }

  if (input.title.length > 100) return { success: false, error: "Title too long" };
  if (input.overview && input.overview.length > 2000) return { success: false, error: "Overview too long" };

  for (const s of input.sequences) {
    if (!s.name || s.name.trim() === "") return { success: false, error: "Sequence name is required" };
    if (s.name.length > 100) return { success: false, error: "Sequence name too long" };
    if (s.description && s.description.length > 1000) return { success: false, error: "Sequence description too long" };
    if (s.style && !VALID_STYLES.includes(s.style)) return { success: false, error: "Invalid style" };
    if (s.durationGuidance && s.durationGuidance.length > 100) return { success: false, error: "Duration guidance too long" };

    for (const p of s.poses) {
      if (!p.name || p.name.trim() === "") return { success: false, error: "Pose name is required" };
      if (p.name.length > 100) return { success: false, error: "Pose name too long" };
      if (p.holdOrRepGuidance && p.holdOrRepGuidance.length > 200) return { success: false, error: "Hold/Rep guidance too long" };
      if (p.notes && p.notes.length > 500) return { success: false, error: "Pose notes too long" };
    }
  }

  for (const g of input.guidelines) {
    if (g.text.length > 500) return { success: false, error: "Guideline too long" };
  }

  try {
    // Transaction to replace nested records
    await prisma.$transaction(async (tx) => {
      await tx.yogaPlanSequence.deleteMany({ where: { yogaPlanId: planId } });
      await tx.yogaPlanGuideline.deleteMany({ where: { yogaPlanId: planId } });

      await tx.yogaPlan.update({
        where: { id: planId },
        data: {
          title: input.title,
          overview: input.overview || null,
          sequences: {
            create: input.sequences.map((s, sIndex) => ({
              name: s.name,
              description: s.description || null,
              style: s.style || null,
              durationGuidance: s.durationGuidance || null,
              sortOrder: sIndex,
              poses: {
                create: s.poses.map((p, pIndex) => ({
                  name: p.name,
                  holdOrRepGuidance: p.holdOrRepGuidance || null,
                  notes: p.notes || null,
                  sortOrder: pIndex
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
    });

    revalidatePath(`/coach/clients/${connectionId}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to update yoga plan:", err);
    return { success: false, error: "Failed to update yoga plan" };
  }
}

export async function archiveAndStartNewYogaPlan(connectionId: string) {
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

  try {
    const activePlan = await prisma.yogaPlan.findFirst({
      where: { coachClientConnectionId: connectionId, status: "ACTIVE" }
    });

    if (activePlan) {
      await prisma.yogaPlan.update({
        where: { id: activePlan.id },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date()
        }
      });
    }

    revalidatePath(`/coach/clients/${connectionId}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to archive yoga plan:", err);
    return { success: false, error: "Failed to archive yoga plan" };
  }
}
