import prisma from "@/lib/db/prisma";
import { AttentionFlag } from "./attention-flags";
import { ClientActivitySignals } from "./activity-signals";

export type BatchedClientData = {
  clientId: string;
  signals: ClientActivitySignals | null;
  attentionFlags: AttentionFlag[];
};

export async function getBatchedActivityAndFlags(
  coachId: string,
  clientIds: string[]
): Promise<Map<string, BatchedClientData>> {
  const result = new Map<string, BatchedClientData>();

  if (clientIds.length === 0) return result;

  // Initialize empty results for all requested clients
  for (const cid of clientIds) {
    result.set(cid, { clientId: cid, signals: null, attentionFlags: [] });
  }

  // 1. Fetch active connections and profiles
  const connections = await prisma.coachClientConnection.findMany({
    where: {
      coachId,
      clientId: { in: clientIds },
      status: "ACTIVE"
    },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      habitPlans: {
        where: { status: "ACTIVE" },
        include: { items: { where: { status: "active" } } }
      },
      workoutPlans: {
        where: { status: "ACTIVE" },
        include: { sessions: true }
      },
      yogaPlans: {
        where: { status: "ACTIVE" },
        include: { sequences: true }
      },
      nutritionTarget: true
    }
  });

  const validClientIds = connections
    .filter(c => c.client?.clientProfile?.onboardingCompleted)
    .map(c => c.clientId as string);

  if (validClientIds.length === 0) return result;

  // Dates
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  const d7 = new Date(today);
  d7.setDate(today.getDate() - 6);
  const start7d = formatDate(d7);
  
  const d30 = new Date(today);
  d30.setDate(today.getDate() - 29);
  const start30d = formatDate(d30);
  const todayStr = formatDate(today);

  // --- BATCH QUERIES ---
  // Nutrition 7d
  const mealLogs = await prisma.mealLog.findMany({
    where: { clientId: { in: validClientIds }, date: { gte: start7d, lte: todayStr } },
    include: { foodItems: true }
  });

  // Workouts 7d
  const workoutLogs = await prisma.workoutLog.findMany({
    where: { clientId: { in: validClientIds }, date: { gte: start7d, lte: todayStr } },
    select: { clientId: true, date: true }
  });

  // Yoga 7d
  const yogaLogs = await prisma.yogaLog.findMany({
    where: { clientId: { in: validClientIds }, date: { gte: start7d, lte: todayStr } },
    select: { clientId: true, date: true }
  });

  // Weights 30d
  const weights30d = await prisma.weightEntry.findMany({
    where: { clientId: { in: validClientIds }, date: { gte: new Date(start30d), lte: new Date(todayStr + "T23:59:59.999Z") } },
    orderBy: { date: 'asc' }
  });

  // Checkins 7d
  const checkins7d = await prisma.dailyCheckIn.findMany({
    where: { clientId: { in: validClientIds }, date: { gte: start7d, lte: todayStr } }
  });

  // Habits 7d
  const habitCompletions7d = await prisma.habitCompletion.findMany({
    where: { clientId: { in: validClientIds }, date: { gte: start7d, lte: todayStr } }
  });

  // Last Activity (from various sources)
  const lastMeals = await prisma.mealLog.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastWaters = await prisma.waterLogEntry.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastWorkouts = await prisma.workoutLog.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastYogas = await prisma.yogaLog.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastWeights = await prisma.weightEntry.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastMeasurements = await prisma.bodyMeasurementEntry.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastPhotos = await prisma.progressPhotoEntry.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastHabits = await prisma.habitCompletion.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });
  const lastCheckins = await prisma.dailyCheckIn.groupBy({ by: ['clientId'], _max: { date: true }, where: { clientId: { in: validClientIds } } });

  for (const conn of connections) {
    if (!conn.client?.clientProfile?.onboardingCompleted) continue;
    const cid = conn.clientId as string;

    // Last Activity
    const maxDates: string[] = [];
    const addDate = (d?: string | Date | null) => { if (d) maxDates.push(typeof d === 'string' ? d : d.toISOString().split('T')[0]); };
    
    addDate(lastMeals.find(x => x.clientId === cid)?._max.date);
    addDate(lastWaters.find(x => x.clientId === cid)?._max.date);
    addDate(lastWorkouts.find(x => x.clientId === cid)?._max.date);
    addDate(lastYogas.find(x => x.clientId === cid)?._max.date);
    addDate(lastWeights.find(x => x.clientId === cid)?._max.date);
    addDate(lastMeasurements.find(x => x.clientId === cid)?._max.date);
    addDate(lastPhotos.find(x => x.clientId === cid)?._max.date);
    addDate(lastHabits.find(x => x.clientId === cid)?._max.date);
    addDate(lastCheckins.find(x => x.clientId === cid)?._max.date);

    maxDates.sort((a, b) => (a > b ? -1 : 1));
    const lastActivityAt = maxDates.length > 0 ? maxDates[0] : null;

    // Nutrition
    const cMeals = mealLogs.filter(m => m.clientId === cid);
    const loggedDays = new Set(cMeals.map(m => m.date));
    const foodLoggingDays7d = loggedDays.size;

    let proteinAdherencePercent7d: number | null = null;
    const targetProtein = conn.nutritionTarget?.proteinTargetGrams || 0;
    if (targetProtein > 0) {
      let sumPercent = 0;
      let daysWithFood = 0;
      
      for (const d of Array.from(loggedDays)) {
        const dayMeals = cMeals.filter(m => m.date === d);
        let dayProtein = 0;
        dayMeals.forEach(m => m.foodItems.forEach(fi => dayProtein += fi.proteinGrams));
        sumPercent += (dayProtein / targetProtein) * 100;
        daysWithFood++;
      }
      if (daysWithFood > 0) proteinAdherencePercent7d = sumPercent / daysWithFood;
    }

    // Workouts
    const workoutCount7d = workoutLogs.filter(w => w.clientId === cid).length;
    // Yoga
    const yogaCount7d = yogaLogs.filter(y => y.clientId === cid).length;
    // Checkins
    const checkInDays7d = checkins7d.filter(c => c.clientId === cid).length;

    // Weight 30d
    const cWeights = weights30d.filter(w => w.clientId === cid);
    let weightChange30d: number | null = null;
    const hasWeightIn30d = cWeights.length > 0;
    
    if (cWeights.length > 0) {
      const earliest = cWeights[0];
      const latest = cWeights[cWeights.length - 1];
      weightChange30d = latest.weightValue - earliest.weightValue;
    }

    // Habits 7d
    const habitPlan = conn.habitPlans[0];
    let lowestHabit7d: { name: string; completed: number; total: number } | null = null;
    const cCompletions = habitCompletions7d.filter(hc => hc.clientId === cid);
    
    if (habitPlan && habitPlan.items.length > 0) {
      let lowestRate = Infinity;
      for (const item of habitPlan.items) {
        const completedCount = cCompletions.filter(c => c.habitPlanItemId === item.id).length;
        const rate = completedCount / 7;
        if (rate < lowestRate) {
          lowestRate = rate;
          lowestHabit7d = { name: item.name, completed: completedCount, total: 7 };
        }
      }
    }

    const lastProgressPhotoAt = lastPhotos.find(x => x.clientId === cid)?._max.date || null;

    const signals: ClientActivitySignals = {
      lastActivityAt,
      foodLoggingDays7d,
      proteinAdherencePercent7d,
      workoutCount7d,
      yogaCount7d,
      weightChange30d,
      hasWeightIn30d,
      lowestHabit7d,
      checkInDays7d,
      lastProgressPhotoAt
    };

    // --- ATTENTION FLAGS ---
    const flags: AttentionFlag[] = [];
    const profile = conn.client!.clientProfile!;

    // Rule 1: REDUCED_ENGAGEMENT
    if (!lastActivityAt) {
      flags.push({ type: "REDUCED_ENGAGEMENT", label: "Reduced Engagement", explanation: "No activity logged since onboarding.", href: "#activity" });
    } else {
      const diffDays = Math.floor((new Date().getTime() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        flags.push({ type: "REDUCED_ENGAGEMENT", label: "Reduced Engagement", explanation: `No activity logged in ${diffDays} days.`, href: "#activity" });
      }
    }

    // Rule 2: MISSING_FOOD_LOGS
    if (foodLoggingDays7d <= 2) {
      flags.push({ type: "MISSING_FOOD_LOGS", label: "Missing Food Logs", explanation: `Food has only been logged on ${foodLoggingDays7d} of the last 7 days.`, href: "#nutrition" });
    } else if (foodLoggingDays7d >= 4) {
      // Rule 3: REPEATED_MISSED_MEALS
      const mealsByDate: Record<string, Set<string>> = {};
      for (const d of Array.from(loggedDays)) mealsByDate[d] = new Set();
      for (const m of cMeals) { if (m.mealType !== "Snack") mealsByDate[m.date].add(m.mealType); }
      
      let missingBreakfast = true, missingLunch = true, missingDinner = true;
      for (const d of Array.from(loggedDays)) {
        if (mealsByDate[d].has("Breakfast")) missingBreakfast = false;
        if (mealsByDate[d].has("Lunch")) missingLunch = false;
        if (mealsByDate[d].has("Dinner")) missingDinner = false;
      }
      
      const flaggedMeal = missingBreakfast ? "Breakfast" : missingLunch ? "Lunch" : missingDinner ? "Dinner" : null;
      if (flaggedMeal) {
        flags.push({ type: "REPEATED_MISSED_MEALS", label: "Repeated Missed Meals", explanation: `${flaggedMeal} is consistently missing across all logged days, though other meals are being logged.`, href: "#nutrition" });
      }
    }

    // Rule 4: LOW_PROTEIN_ADHERENCE
    if (proteinAdherencePercent7d !== null && proteinAdherencePercent7d < 70) {
      flags.push({ type: "LOW_PROTEIN_ADHERENCE", label: "Low Protein Adherence", explanation: `Protein adherence is averaging ${Math.round(proteinAdherencePercent7d)}% against target.`, href: "#nutrition" });
    }

    // Rule 5: MISSED_WORKOUTS
    const activeWorkoutPlan = conn.workoutPlans[0];
    if (activeWorkoutPlan && activeWorkoutPlan.sessions.length > 0 && workoutCount7d === 0) {
      flags.push({ type: "MISSED_WORKOUTS", label: "Missed Workouts", explanation: "0 workouts logged in the last 7 days despite an active plan.", href: "#workouts" });
    }

    // Rule 6: MISSED_YOGA_SESSIONS
    const activeYogaPlan = conn.yogaPlans[0];
    if (activeYogaPlan && activeYogaPlan.sequences.length > 0 && yogaCount7d === 0) {
      flags.push({ type: "MISSED_YOGA_SESSIONS", label: "Missed Yoga Sessions", explanation: "0 sessions logged in the last 7 days despite an active plan.", href: "#yoga" });
    }

    // Rule 7: WEIGHT_PLATEAU
    if ((profile.goal === "Weight Loss" || profile.goal === "Weight Gain") && cWeights.length >= 2) {
      const earliest = cWeights[0];
      const latest = cWeights[cWeights.length - 1];
      const densityDays = (latest.date.getTime() - earliest.date.getTime()) / (1000 * 60 * 60 * 24);
      if (densityDays >= 21) {
        const change = latest.weightValue - earliest.weightValue;
        const threshold = profile.preferredWeightUnit === "lbs" ? 1.0 : 0.5;
        if (Math.abs(change) < threshold) {
          const changeStr = change > 0 ? `+${change.toFixed(1)}` : `${change.toFixed(1)}`;
          flags.push({ type: "WEIGHT_PLATEAU", label: "Weight Plateau", explanation: `Weight has only changed by ${changeStr} ${profile.preferredWeightUnit} over the last 30 days.`, href: "#progress" });
        }
      }
    }

    // Rule 8: POOR_HABIT_CONSISTENCY
    if (habitPlan && habitPlan.items.length > 0) {
      const targetItems = habitPlan.items.filter(i => i.targetFrequency === "Daily" || i.targetFrequency === "TimesPerWeek");
      if (targetItems.length > 0) {
        let lowestRatio = 1.1;
        let flaggedHabitName: string | null = null;
        let flaggedCompletions = 0;
        let flaggedTarget = 0;
        
        for (const item of targetItems) {
          const itemCompletions = cCompletions.filter(c => c.habitPlanItemId === item.id).length;
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
          flags.push({ type: "POOR_HABIT_CONSISTENCY", label: "Poor Habit Consistency", explanation: `${flaggedHabitName} completed on ${flaggedCompletions} of ${flaggedTarget} target days this week.`, href: "#habits" });
        }
      }
    }

    result.set(cid, { clientId: cid, signals, attentionFlags: flags });
  }

  return result;
}
