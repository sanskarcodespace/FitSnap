import prisma from "@/lib/db/prisma"

export type NutritionSummary = {
  hasActiveConnection: boolean;
  hasTarget: boolean;
  consumedTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    waterMl: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterLiters: number;
    fiber?: number | null;
  } | null;
  meals: any[];
  waterEntries: any[];
}

export async function getDailyNutritionSummary(
  clientId: string, 
  date: string, 
  requestingCoachId?: string
): Promise<NutritionSummary> {
  // 1. Fetch active connection
  const connectionWhere: any = {
    clientId: clientId,
    status: "ACTIVE"
  };
  
  if (requestingCoachId) {
    connectionWhere.coachId = requestingCoachId;
  }

  const activeConnection = await prisma.coachClientConnection.findFirst({
    where: connectionWhere,
    include: {
      nutritionTarget: true
    }
  });

  const hasActiveConnection = !!activeConnection;
  const target = activeConnection?.nutritionTarget || null;
  const hasTarget = !!target;

  // 2. Fetch Meals & Water
  const meals = await prisma.mealLog.findMany({
    where: { clientId, date },
    include: { foodItems: true },
    orderBy: { createdAt: 'asc' }
  });

  const waterEntries = await prisma.waterLogEntry.findMany({
    where: { clientId, date },
    orderBy: { loggedAt: 'asc' }
  });

  // 3. Aggregate totals
  const consumedTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    waterMl: 0
  };

  meals.forEach(meal => {
    meal.foodItems.forEach(item => {
      consumedTotals.calories += item.calories;
      consumedTotals.protein += item.proteinGrams;
      consumedTotals.carbs += item.carbGrams;
      consumedTotals.fat += item.fatGrams;
      consumedTotals.fiber += item.fiberGrams;
      consumedTotals.sugar += item.sugarGrams || 0;
      consumedTotals.sodium += item.sodiumMg || 0;
    });
  });

  waterEntries.forEach(entry => {
    consumedTotals.waterMl += entry.amountMl;
  });

  return {
    hasActiveConnection,
    hasTarget,
    consumedTotals,
    targets: target ? {
      calories: target.calorieTarget,
      protein: target.proteinTargetGrams,
      carbs: target.carbTargetGrams,
      fat: target.fatTargetGrams,
      waterLiters: target.waterTargetLiters,
      fiber: target.fiberTargetGrams
    } : null,
    meals,
    waterEntries
  };
}
