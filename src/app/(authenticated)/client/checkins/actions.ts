"use server"

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function upsertDailyCheckIn(data: {
  date: string;
  sleepHours?: number | null;
  steps?: number | null;
  mood?: number | null;
  energy?: number | null;
  note?: string | null;
}) {
  const token = (await cookies()).get("session_token")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session?.userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Basic validation
  if (!data.date) {
    return { success: false, error: "Date is required" };
  }
  
  // Future date check
  const today = new Date();
  // Adjust to local time string comparison
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localTodayStr = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
  if (data.date > localTodayStr) {
    return { success: false, error: "Cannot log check-in for a future date" };
  }

  if (
    data.sleepHours == null && 
    data.steps == null && 
    data.mood == null && 
    data.energy == null
  ) {
    return { success: false, error: "At least one measurement (Sleep, Steps, Mood, Energy) is required" };
  }

  if (data.sleepHours != null && (data.sleepHours < 0 || data.sleepHours > 24)) {
    return { success: false, error: "Sleep hours must be between 0 and 24" };
  }

  if (data.steps != null && (data.steps < 0 || data.steps > 200000)) {
    return { success: false, error: "Steps must be a reasonable positive number" };
  }

  if (data.mood != null && (data.mood < 1 || data.mood > 5)) {
    return { success: false, error: "Mood must be between 1 and 5" };
  }

  if (data.energy != null && (data.energy < 1 || data.energy > 5)) {
    return { success: false, error: "Energy must be between 1 and 5" };
  }

  if (data.note && data.note.length > 1000) {
    return { success: false, error: "Note is too long (maximum 1000 characters)" };
  }

  try {
    await prisma.dailyCheckIn.upsert({
      where: {
        clientId_date: {
          clientId: session.userId,
          date: data.date,
        }
      },
      update: {
        sleepHours: data.sleepHours,
        steps: data.steps,
        mood: data.mood,
        energy: data.energy,
        note: data.note,
      },
      create: {
        clientId: session.userId,
        date: data.date,
        sleepHours: data.sleepHours,
        steps: data.steps,
        mood: data.mood,
        energy: data.energy,
        note: data.note,
      }
    });

    revalidatePath("/client");
    revalidatePath("/client/checkins");
    return { success: true };
  } catch (error) {
    console.error("Error upserting check-in:", error);
    return { success: false, error: "Failed to save check-in" };
  }
}

export async function deleteDailyCheckIn(id: string) {
  const token = (await cookies()).get("session_token")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session?.userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const checkIn = await prisma.dailyCheckIn.findUnique({ where: { id } });
    if (!checkIn) {
      return { success: false, error: "Check-in not found" };
    }
    
    if (checkIn.clientId !== session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.dailyCheckIn.delete({
      where: { id }
    });

    revalidatePath("/client");
    revalidatePath("/client/checkins");
    return { success: true };
  } catch (error) {
    console.error("Error deleting check-in:", error);
    return { success: false, error: "Failed to delete check-in" };
  }
}

export async function getCheckinStats(clientId: string, startDate: string, endDate: string) {
  const token = (await cookies()).get("session_token")?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session?.userId) {
    throw new Error("Not authenticated");
  }

  const checkIns = await prisma.dailyCheckIn.findMany({
    where: {
      clientId,
    },
    orderBy: {
      date: 'desc'
    }
  });

  const periodCheckIns = checkIns.filter(c => c.date >= startDate && c.date <= endDate);
  const totalDays = periodCheckIns.length;

  // Compute averages
  let sleepSum = 0, sleepCount = 0;
  let stepsSum = 0, stepsCount = 0;
  let moodSum = 0, moodCount = 0;
  let energySum = 0, energyCount = 0;

  periodCheckIns.forEach(c => {
    if (c.sleepHours != null) { sleepSum += c.sleepHours; sleepCount++; }
    if (c.steps != null) { stepsSum += c.steps; stepsCount++; }
    if (c.mood != null) { moodSum += c.mood; moodCount++; }
    if (c.energy != null) { energySum += c.energy; energyCount++; }
  });

  const averages = {
    sleepHours: sleepCount > 0 ? sleepSum / sleepCount : null,
    steps: stepsCount > 0 ? stepsSum / stepsCount : null,
    mood: moodCount > 0 ? moodSum / moodCount : null,
    energy: energyCount > 0 ? energySum / energyCount : null,
  };

  // Compute streak (Block 20 exact logic: any checkin existence counts)
  let currentStreak = 0;
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localTodayStr = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
  
  const yesterday = new Date(today.getTime() - tzOffset);
  yesterday.setDate(yesterday.getDate() - 1);
  const localYesterdayStr = yesterday.toISOString().split('T')[0];

  const hasToday = checkIns.some(c => c.date === localTodayStr);
  const hasYesterday = checkIns.some(c => c.date === localYesterdayStr);

  if (hasToday || hasYesterday) {
    let dateObj = new Date(hasToday ? localTodayStr : localYesterdayStr);
    while (true) {
      const dateStr = dateObj.toISOString().split('T')[0];
      if (checkIns.some(c => c.date === dateStr)) {
        currentStreak++;
        dateObj.setDate(dateObj.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    history: checkIns, // Return all so the UI can filter by period if it wants, but period stats are computed
    periodCheckIns,
    totalDays,
    averages,
    currentStreak
  };
}
