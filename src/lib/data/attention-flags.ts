import prisma from "@/lib/db/prisma";
import { getClientActivitySignals } from "./activity-signals";
import { getWeightHistory } from "@/lib/progress/history";

export type AttentionFlagType = 
  | "REDUCED_ENGAGEMENT"
  | "MISSING_FOOD_LOGS"
  | "REPEATED_MISSED_MEALS"
  | "LOW_PROTEIN_ADHERENCE"
  | "MISSED_WORKOUTS"
  | "MISSED_YOGA_SESSIONS"
  | "WEIGHT_PLATEAU"
  | "POOR_HABIT_CONSISTENCY";

export type AttentionFlag = {
  type: AttentionFlagType;
  label: string;
  explanation: string;
  href: string;
};

export async function getClientAttentionFlags(
  coachId: string, 
  clientId: string
): Promise<AttentionFlag[]> {
  const flags: AttentionFlag[] = [];

  // 1. Verify Active Connection and Onboarding Status
  const connection = await prisma.coachClientConnection.findFirst({
    where: {
      coachId,
      clientId,
      status: "ACTIVE"
    },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      }
    }
  });

  if (!connection || !connection.client || !connection.client.clientProfile?.onboardingCompleted) {
    return flags; // Return empty flags for non-active or Profile-Setup-Pending clients
  }

  const profile = connection.client.clientProfile;

  // 2. Fetch Activity Signals (Reused from Block 22)
  const signals = await getClientActivitySignals(coachId, clientId);

  const todayStr = new Date().toISOString().split('T')[0];
  const start7dDate = new Date();
  start7dDate.setDate(start7dDate.getDate() - 6);
  const start7dStr = start7dDate.toISOString().split('T')[0];

  const start30dDate = new Date();
  start30dDate.setDate(start30dDate.getDate() - 29);
  const start30dStr = start30dDate.toISOString().split('T')[0];

  // ==========================================
  // Rule 1: REDUCED_ENGAGEMENT
  // ==========================================
  if (!signals.lastActivityAt) {
    flags.push({
      type: "REDUCED_ENGAGEMENT",
      label: "Reduced Engagement",
      explanation: "No activity logged since onboarding.",
      href: "#activity"
    });
  } else {
    const diffMs = new Date().getTime() - new Date(signals.lastActivityAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      flags.push({
        type: "REDUCED_ENGAGEMENT",
        label: "Reduced Engagement",
        explanation: `No activity logged in ${diffDays} days.`,
        href: "#activity"
      });
    }
  }

  // ==========================================
  // Rule 2: MISSING_FOOD_LOGS
  // ==========================================
  if (signals.foodLoggingDays7d <= 2) {
    flags.push({
      type: "MISSING_FOOD_LOGS",
      label: "Missing Food Logs",
      explanation: `Food has only been logged on ${signals.foodLoggingDays7d} of the last 7 days.`,
      href: "#nutrition"
    });
  }

  // ==========================================
  // Rule 3: REPEATED_MISSED_MEALS
  // ==========================================
  // Mutually exclusive with Rule 2 by threshold (>= 4 of 7 days)
  if (signals.foodLoggingDays7d >= 4) {
    const mealLogs = await prisma.mealLog.findMany({
      where: {
        clientId,
        date: { gte: start7dStr, lte: todayStr }
      }
    });

    const loggedDates = new Set(mealLogs.map(m => m.date));
    const mealsByDate: Record<string, Set<string>> = {};
    for (const date of Array.from(loggedDates)) {
      mealsByDate[date] = new Set();
    }
    for (const log of mealLogs) {
      if (log.mealType !== "Snack") {
        mealsByDate[log.date].add(log.mealType);
      }
    }

    let missingBreakfast = true;
    let missingLunch = true;
    let missingDinner = true;

    for (const date of Array.from(loggedDates)) {
      if (mealsByDate[date].has("Breakfast")) missingBreakfast = false;
      if (mealsByDate[date].has("Lunch")) missingLunch = false;
      if (mealsByDate[date].has("Dinner")) missingDinner = false;
    }

    let flaggedMeal: string | null = null;
    if (missingBreakfast) flaggedMeal = "Breakfast";
    else if (missingLunch) flaggedMeal = "Lunch";
    else if (missingDinner) flaggedMeal = "Dinner";

    if (flaggedMeal) {
      flags.push({
        type: "REPEATED_MISSED_MEALS",
        label: "Repeated Missed Meals",
        explanation: `${flaggedMeal} is consistently missing across all logged days, though other meals are being logged.`,
        href: "#nutrition"
      });
    }
  }

  // ==========================================
  // Rule 4: LOW_PROTEIN_ADHERENCE
  // ==========================================
  if (signals.proteinAdherencePercent7d !== null && signals.proteinAdherencePercent7d < 70) {
    flags.push({
      type: "LOW_PROTEIN_ADHERENCE",
      label: "Low Protein Adherence",
      explanation: `Protein adherence is averaging ${Math.round(signals.proteinAdherencePercent7d)}% against target.`,
      href: "#nutrition"
    });
  }

  // ==========================================
  // Rule 5: MISSED_WORKOUTS
  // ==========================================
  const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
    where: { coachClientConnectionId: connection.id, status: "ACTIVE" },
    include: { sessions: true }
  });
  if (activeWorkoutPlan && activeWorkoutPlan.sessions.length > 0 && signals.workoutCount7d === 0) {
    flags.push({
      type: "MISSED_WORKOUTS",
      label: "Missed Workouts",
      explanation: "0 workouts logged in the last 7 days despite an active plan.",
      href: "#workouts"
    });
  }

  // ==========================================
  // Rule 6: MISSED_YOGA_SESSIONS
  // ==========================================
  const activeYogaPlan = await prisma.yogaPlan.findFirst({
    where: { coachClientConnectionId: connection.id, status: "ACTIVE" },
    include: { sequences: true }
  });
  if (activeYogaPlan && activeYogaPlan.sequences.length > 0 && signals.yogaCount7d === 0) {
    flags.push({
      type: "MISSED_YOGA_SESSIONS",
      label: "Missed Yoga Sessions",
      explanation: "0 sessions logged in the last 7 days despite an active plan.",
      href: "#yoga"
    });
  }

  // ==========================================
  // Rule 7: WEIGHT_PLATEAU
  // ==========================================
  if (profile.goal === "Weight Loss" || profile.goal === "Weight Gain") {
    const weightHistory = await getWeightHistory(clientId, start30dStr, todayStr);
    const loggedWeights = weightHistory.entries.filter(e => e.isLogged);
    if (loggedWeights.length >= 2) {
      const earliest = loggedWeights[0];
      const latest = loggedWeights[loggedWeights.length - 1];
      
      const earliestDate = new Date(earliest.date).getTime();
      const latestDate = new Date(latest.date).getTime();
      const densityDays = (latestDate - earliestDate) / (1000 * 60 * 60 * 24);
      
      if (densityDays >= 21) {
        const change = latest.value - earliest.value;
        const threshold = weightHistory.preferredWeightUnit === "lbs" ? 1.0 : 0.5;
        
        if (Math.abs(change) < threshold) {
          const changeStr = change > 0 ? `+${change.toFixed(1)}` : `${change.toFixed(1)}`;
          flags.push({
            type: "WEIGHT_PLATEAU",
            label: "Weight Plateau",
            explanation: `Weight has only changed by ${changeStr} ${weightHistory.preferredWeightUnit} over the last 30 days.`,
            href: "#progress"
          });
        }
      }
    }
  }

  // ==========================================
  // Rule 8: POOR_HABIT_CONSISTENCY
  // ==========================================
  const activeHabitPlan = await prisma.habitPlan.findFirst({
    where: { coachClientConnectionId: connection.id, status: "ACTIVE" },
    include: { items: { where: { status: "active" } } }
  });

  if (activeHabitPlan && activeHabitPlan.items.length > 0) {
    const targetItems = activeHabitPlan.items.filter(item => 
      item.targetFrequency === "Daily" || item.targetFrequency === "TimesPerWeek"
    );

    if (targetItems.length > 0) {
      // Fetch completions in last 7 days
      const completions = await prisma.habitCompletion.findMany({
        where: {
          clientId,
          date: { gte: start7dStr, lte: todayStr }
        }
      });
      
      let lowestRatio = 1.1; // > 1
      let flaggedHabitName: string | null = null;
      let flaggedCompletions = 0;
      let flaggedTarget = 0;

      for (const item of targetItems) {
        const itemCompletions = completions.filter(c => c.habitPlanItemId === item.id).length;
        const targetEquivalent = item.targetFrequency === "Daily" ? 7 : (item.targetTimesPerWeek || 0);
        
        if (targetEquivalent > 0) {
          const ratio = itemCompletions / targetEquivalent;
          if (ratio < lowestRatio) {
            lowestRatio = ratio;
            flaggedHabitName = item.name;
            flaggedCompletions = itemCompletions;
            flaggedTarget = targetEquivalent;
          }
        }
      }

      if (lowestRatio <= 0.5 && flaggedHabitName) {
        flags.push({
          type: "POOR_HABIT_CONSISTENCY",
          label: "Poor Habit Consistency",
          explanation: `${flaggedHabitName} completed on ${flaggedCompletions} of ${flaggedTarget} target days this week.`,
          href: "#habits"
        });
      }
    }
  }

  return flags;
}
