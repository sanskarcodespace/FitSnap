import prisma from "@/lib/db/prisma";
import { getWorkoutCount, getYogaCount, getProgressPhotoCount } from "./activity-signals";
import { getWeightHistory } from "@/lib/progress/history";
import { getNutritionHistorySummary } from "./nutrition";
import { getCheckinStats } from "@/app/(authenticated)/client/checkins/actions";

export type ClientReportData = {
  coachBusinessName?: string;
  isDisconnected?: boolean;
  period: { start: string; end: string };
  prevPeriod: { start: string; end: string };
  metrics: {
    nutrition: {
      hasPlan: boolean;
      daysLogged: number;
      cals: { current: number; prev: number | null };
      protein: { current: number; prev: number | null };
      carbs: { current: number; prev: number | null };
      fat: { current: number; prev: number | null };
      water: { current: number; prev: number | null };
    } | null;
    workouts: {
      hasPlan: boolean;
      count: { current: number; prev: number | null };
    } | null;
    yoga: {
      hasPlan: boolean;
      count: { current: number; prev: number | null };
    } | null;
    habits: {
      items: {
        id: string;
        name: string;
        completed: number;
        target: number;
      }[];
    } | null;
    checkins: {
      hasPlan: boolean;
      sleepHours: { current: number | null; prev: number | null };
      count: number;
    } | null;
    measurements: {
      hasData: boolean;
      weightChange: number | null;
      currentWeight: number | null;
    } | null;
    photos: {
      count: number;
    } | null;
  };
  goalProgress: {
    goal: string;
    note: string;
  };
};

export async function getClientReport(
  coachId: string | undefined,
  clientId: string,
  startDate: string,
  endDate: string,
  periodMode: string = "custom"
): Promise<ClientReportData> {
  let connection = null;
  
  if (coachId) {
    connection = await prisma.coachClientConnection.findFirst({
      where: { coachId, clientId, status: "ACTIVE" },
      include: { 
        client: { include: { clientProfile: true } },
        coach: { include: { coachProfile: true } }
      }
    });
    if (!connection) throw new Error("You do not have an active connection with this client.");
  } else {
    connection = await prisma.coachClientConnection.findFirst({
      where: { clientId, status: "ACTIVE" },
      include: { 
        client: { include: { clientProfile: true } },
        coach: { include: { coachProfile: true } }
      }
    });
  }

  // Calculate previous period dates
  let prevStartDate = "";
  let prevEndDate = "";
  
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  const daysInPeriod = Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (periodMode === "month") {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Find the previous month's same dates
    // Truncate to the SAME NUMBER OF DAYS from the 1st of the preceding month
    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);
    
    const prevEnd = new Date(prevStart);
    // Add the exact same number of days we've had so far this month
    const daysInCurrentPeriod = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    prevEnd.setDate(prevEnd.getDate() + daysInCurrentPeriod);

    // Make sure we don't exceed the last day of the previous month
    const lastDayOfPrevMonth = new Date(start.getFullYear(), start.getMonth(), 0);
    if (prevEnd > lastDayOfPrevMonth) {
      prevEndDate = lastDayOfPrevMonth.toISOString().split('T')[0];
    } else {
      prevEndDate = prevEnd.toISOString().split('T')[0];
    }
    prevStartDate = prevStart.toISOString().split('T')[0];
  } else {
    const prevEnd = new Date(startObj);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (daysInPeriod - 1));

    prevStartDate = prevStart.toISOString().split('T')[0];
    prevEndDate = prevEnd.toISOString().split('T')[0];
  }

  // Concurrently fetch all independent domain data
  const [
    nutritionPlan, nutritionCurrent, nutritionPrev,
    workoutPlan, workoutCountCurr, workoutCountPrev,
    yogaPlan, yogaCountCurr, yogaCountPrev,
    activeHabitPlan,
    checkinsCurr, checkinsPrev,
    weightHistoryCurr,
    photoCountCurr
  ] = await Promise.all([
    connection ? prisma.dietPlan.findFirst({ where: { coachClientConnectionId: connection.id, status: "ACTIVE" } }) : Promise.resolve(null),
    getNutritionHistorySummary(clientId, startDate, endDate),
    getNutritionHistorySummary(clientId, prevStartDate, prevEndDate),
    connection ? prisma.workoutPlan.findFirst({ where: { coachClientConnectionId: connection.id, status: "ACTIVE" } }) : Promise.resolve(null),
    getWorkoutCount(clientId, startDate, endDate),
    getWorkoutCount(clientId, prevStartDate, prevEndDate),
    connection ? prisma.yogaPlan.findFirst({ where: { coachClientConnectionId: connection.id, status: "ACTIVE" } }) : Promise.resolve(null),
    getYogaCount(clientId, startDate, endDate),
    getYogaCount(clientId, prevStartDate, prevEndDate),
    connection ? prisma.habitPlan.findFirst({ where: { coachClientConnectionId: connection.id, status: "ACTIVE" }, include: { items: { where: { status: "active" } } } }) : Promise.resolve(null),
    getCheckinStats(clientId, startDate, endDate),
    getCheckinStats(clientId, prevStartDate, prevEndDate),
    getWeightHistory(clientId, startDate, endDate),
    getProgressPhotoCount(clientId, startDate, endDate)
  ]);

  // 1. Nutrition
  let nutritionSection = null;
  if (nutritionPlan || nutritionCurrent.daysLogged > 0 || !connection) {
    nutritionSection = {
      hasPlan: !!nutritionPlan,
      daysLogged: nutritionCurrent.daysLogged,
      cals: { current: Math.round(nutritionCurrent.averages.calories), prev: nutritionPrev.daysLogged > 0 ? Math.round(nutritionPrev.averages.calories) : null },
      protein: { current: Math.round(nutritionCurrent.averages.protein), prev: nutritionPrev.daysLogged > 0 ? Math.round(nutritionPrev.averages.protein) : null },
      carbs: { current: Math.round(nutritionCurrent.averages.carbs), prev: nutritionPrev.daysLogged > 0 ? Math.round(nutritionPrev.averages.carbs) : null },
      fat: { current: Math.round(nutritionCurrent.averages.fat), prev: nutritionPrev.daysLogged > 0 ? Math.round(nutritionPrev.averages.fat) : null },
      water: { current: Number((nutritionCurrent.averages.waterMl / 1000).toFixed(1)), prev: nutritionPrev.daysLogged > 0 ? Number((nutritionPrev.averages.waterMl / 1000).toFixed(1)) : null }
    };
  }

  // 2. Workouts
  let workoutSection = null;
  if (workoutPlan || workoutCountCurr > 0 || !connection) {
    workoutSection = {
      hasPlan: !!workoutPlan,
      count: { current: workoutCountCurr, prev: workoutCountPrev }
    };
  }

  // 3. Yoga
  let yogaSection = null;
  if (yogaPlan || yogaCountCurr > 0 || !connection) {
    yogaSection = {
      hasPlan: !!yogaPlan,
      count: { current: yogaCountCurr, prev: yogaCountPrev }
    };
  }

  // 4. Habits
  let habitSection = null;
  if (activeHabitPlan && activeHabitPlan.items.length > 0) {
    const completions = await prisma.habitCompletion.findMany({
      where: {
        clientId,
        date: { gte: startDate, lte: endDate },
        habitPlanItemId: { in: activeHabitPlan.items.map(i => i.id) }
      }
    });

    const items = activeHabitPlan.items.map(item => {
      const completed = completions.filter(c => c.habitPlanItemId === item.id).length;
      let target = daysInPeriod;
      if (item.targetFrequency === "TimesPerWeek" && item.targetTimesPerWeek) {
        target = Math.ceil((item.targetTimesPerWeek * daysInPeriod) / 7);
      }
      return {
        id: item.id,
        name: item.name,
        completed,
        target
      };
    });

    habitSection = { items };
  }

  // 5. Check-ins (Sleep)
  let checkinsSection = null;
  if (checkinsCurr.totalDays > 0) {
    checkinsSection = {
      hasPlan: true,
      count: checkinsCurr.totalDays,
      sleepHours: {
        current: checkinsCurr.averages.sleepHours,
        prev: checkinsPrev.totalDays > 0 ? checkinsPrev.averages.sleepHours : null
      }
    };
  }

  // 6. Measurements / Weight
  let measurementsSection = null;
  if (weightHistoryCurr.entries.length > 0) {
    const firstWeight = weightHistoryCurr.entries[weightHistoryCurr.entries.length - 1].value;
    const lastWeight = weightHistoryCurr.entries[0].value;
    measurementsSection = {
      hasData: true,
      weightChange: Number((lastWeight - firstWeight).toFixed(1)),
      currentWeight: lastWeight
    };
  }

  // 7. Progress Photos
  let photosSection = null;
  if (photoCountCurr > 0) {
    photosSection = { count: photoCountCurr };
  }

  const clientGoal = connection?.client?.clientProfile?.goal || "Not specified";
  let goalNote = "No specific progress metric for this goal.";
  if (clientGoal === "Weight Loss" || clientGoal === "Muscle Gain") {
    if (measurementsSection && measurementsSection.weightChange !== null) {
      const diff = measurementsSection.weightChange;
      if (diff > 0) goalNote = `Weight changed by +${diff}kg over this period.`;
      else if (diff < 0) goalNote = `Weight changed by ${diff}kg over this period.`;
      else goalNote = "Weight remained stable over this period.";
    } else {
      goalNote = "No weight data logged in this period to evaluate progress.";
    }
  } else {
    goalNote = `Progress towards ${clientGoal} is tracked via consistency across assigned habits, workouts, and nutrition.`;
  }

  return {
    coachBusinessName: connection?.coach?.coachProfile?.businessName || undefined,
    isDisconnected: !connection,
    period: { start: startDate, end: endDate },
    prevPeriod: { start: prevStartDate, end: prevEndDate },
    metrics: {
      nutrition: nutritionSection,
      workouts: workoutSection,
      yoga: yogaSection,
      habits: habitSection,
      checkins: checkinsSection,
      measurements: measurementsSection,
      photos: photosSection,
    },
    goalProgress: {
      goal: clientGoal,
      note: goalNote
    }
  };
}
