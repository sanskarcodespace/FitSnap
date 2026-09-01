import prisma from "@/lib/db/prisma";
import { getNutritionHistorySummary } from "./nutrition";
import { getWeightHistory } from "../progress/history";
import { getCheckinStats } from "@/app/(authenticated)/client/checkins/actions";

export async function getWorkoutCount(clientId: string, startDate: string, endDate: string) {
  return prisma.workoutLog.count({
    where: {
      clientId,
      date: { gte: startDate, lte: endDate }
    }
  });
}

export async function getYogaCount(clientId: string, startDate: string, endDate: string) {
  return prisma.yogaLog.count({
    where: {
      clientId,
      date: { gte: startDate, lte: endDate }
    }
  });
}

export async function getProgressPhotoCount(clientId: string, startDate: string, endDate: string) {
  return prisma.progressPhotoEntry.count({
    where: {
      clientId,
      date: { gte: startDate, lte: endDate }
    }
  });
}

export type ClientActivitySignals = {
  lastActivityAt: string | null;
  foodLoggingDays7d: number;
  proteinAdherencePercent7d: number | null;
  workoutCount7d: number;
  yogaCount7d: number;
  weightChange30d: number | null;
  hasWeightIn30d: boolean;
  lowestHabit7d: { name: string; completed: number; total: number } | null;
  checkInDays7d: number;
  lastProgressPhotoAt: string | null;
};

export async function getClientActivitySignals(coachId: string, clientId: string): Promise<ClientActivitySignals> {
  // 1. Verify connection
  const connection = await prisma.coachClientConnection.findFirst({
    where: { coachId, clientId, status: "ACTIVE" },
  });

  if (!connection) {
    throw new Error("You do not have an active connection with this client.");
  }

  const today = new Date();
  
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  const d7 = new Date(today);
  d7.setDate(today.getDate() - 6);
  const start7d = formatDate(d7);
  
  const d30 = new Date(today);
  d30.setDate(today.getDate() - 29);
  const start30d = formatDate(d30);

  const todayStr = formatDate(today);

  // 2. Nutrition
  const nutritionSummary = await getNutritionHistorySummary(clientId, start7d, todayStr, coachId);
  const foodLoggingDays7d = nutritionSummary.daysLogged;
  let proteinAdherencePercent7d: number | null = null;
  
  if (nutritionSummary.targets && nutritionSummary.targets.protein > 0) {
    let sumPercent = 0;
    let daysWithFood = 0;
    
    for (const day of nutritionSummary.dailyData) {
      if (day.isLogged) {
        sumPercent += (day.consumed.protein / nutritionSummary.targets.protein) * 100;
        daysWithFood++;
      }
    }
    
    if (daysWithFood > 0) {
      proteinAdherencePercent7d = sumPercent / daysWithFood;
    }
  }

  // 3. Workouts
  const workoutCount7d = await getWorkoutCount(clientId, start7d, todayStr);

  // 4. Yoga
  const yogaCount7d = await getYogaCount(clientId, start7d, todayStr);

  // 5. Weight Change 30d
  const weightHistory = await getWeightHistory(clientId, start30d, todayStr);
  let weightChange30d: number | null = null;
  let hasWeightIn30d = false;
  
  if (weightHistory.entries.length > 0) {
    const loggedWeights = weightHistory.entries.filter(e => e.isLogged);
    if (loggedWeights.length > 0) {
      hasWeightIn30d = true;
      const earliest = loggedWeights[0];
      const latest = loggedWeights[loggedWeights.length - 1];
      weightChange30d = latest.value - earliest.value;
    }
  }

  // 6. Check-ins
  const checkinStats = await getCheckinStats(clientId, start7d, todayStr);
  const checkInDays7d = checkinStats.periodCheckIns.length;

  // 7. Habits
  let lowestHabit7d: { name: string; completed: number; total: number } | null = null;
  const activeHabitPlan = await prisma.habitPlan.findFirst({
    where: { coachClientConnectionId: connection.id, status: "ACTIVE" },
    include: { items: { where: { status: "active" } } }
  });

  if (activeHabitPlan && activeHabitPlan.items.length > 0) {
    let lowestRate = Infinity;
    
    const completions = await prisma.habitCompletion.findMany({
      where: {
        clientId,
        date: { gte: start7d, lte: todayStr },
        habitPlanItemId: { in: activeHabitPlan.items.map(i => i.id) }
      }
    });

    for (const item of activeHabitPlan.items) {
      const completedCount = completions.filter(c => c.habitPlanItemId === item.id).length;
      const rate = completedCount / 7;
      if (rate < lowestRate) {
        lowestRate = rate;
        lowestHabit7d = {
          name: item.name,
          completed: completedCount,
          total: 7
        };
      }
    }
  }

  // 8. Progress Photos
  const latestPhoto = await prisma.progressPhotoEntry.findFirst({
    where: { clientId },
    orderBy: { date: 'desc' }
  });
  const lastProgressPhotoAt = latestPhoto ? latestPhoto.date : null;

  // 9. Last Activity At
  // Fetch the max date from each domain (across ALL time) to find `lastActivityAt`
  const lastDates: (string | null)[] = [];
  
  const lastMeal = await prisma.mealLog.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastMeal) lastDates.push(lastMeal.date);
  
  const lastWater = await prisma.waterLogEntry.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastWater) lastDates.push(lastWater.date);

  const lastWorkout = await prisma.workoutLog.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastWorkout) lastDates.push(lastWorkout.date);

  const lastYoga = await prisma.yogaLog.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastYoga) lastDates.push(lastYoga.date);

  const lastWeight = await prisma.weightEntry.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastWeight) lastDates.push(lastWeight.date.toISOString().split('T')[0]);

  const lastMeasurement = await prisma.bodyMeasurementEntry.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastMeasurement) lastDates.push(lastMeasurement.date.toISOString().split('T')[0]);

  if (lastProgressPhotoAt) lastDates.push(lastProgressPhotoAt);

  const lastHabit = await prisma.habitCompletion.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastHabit) lastDates.push(lastHabit.date);

  const lastCheckin = await prisma.dailyCheckIn.findFirst({ where: { clientId }, orderBy: { date: 'desc' }, select: { date: true } });
  if (lastCheckin) lastDates.push(lastCheckin.date);

  const validDates = lastDates.filter((d): d is string => d !== null);
  let lastActivityAt: string | null = null;
  if (validDates.length > 0) {
    validDates.sort((a, b) => (a > b ? -1 : 1));
    lastActivityAt = validDates[0];
  }

  return {
    lastActivityAt,
    foodLoggingDays7d,
    proteinAdherencePercent7d,
    workoutCount7d,
    yogaCount7d,
    weightChange30d,
    hasWeightIn30d,
    lowestHabit7d,
    checkInDays7d,
    lastProgressPhotoAt,
  };
}
