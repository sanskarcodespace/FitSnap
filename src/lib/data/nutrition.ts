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

export type NutritionHistorySummary = {
  hasActiveConnection: boolean;
  hasTarget: boolean;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterLiters: number;
    fiber?: number | null;
  } | null;
  daysInRange: number;
  daysLogged: number;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    waterMl: number;
  };
  dailyData: {
    date: string;
    isLogged: boolean;
    consumed: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
      waterMl: number;
    };
  }[];
}

export async function getNutritionHistorySummary(
  clientId: string,
  startDateStr: string,
  endDateStr: string,
  requestingCoachId?: string
): Promise<NutritionHistorySummary> {
  // Validate dates
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const today = new Date();
  
  if (start > end) {
    throw new Error("Start date cannot be after end date");
  }
  if (end > today) {
    throw new Error("End date cannot be in the future");
  }
  
  const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (daysDiff > 366) {
    throw new Error("Date range cannot exceed 366 days");
  }

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

  // 2. Fetch Meals & Water in range
  const meals = await prisma.mealLog.findMany({
    where: { 
      clientId, 
      date: {
        gte: startDateStr,
        lte: endDateStr
      } 
    },
    include: { foodItems: true },
    orderBy: { date: 'asc' }
  });

  const waterEntries = await prisma.waterLogEntry.findMany({
    where: { 
      clientId, 
      date: {
        gte: startDateStr,
        lte: endDateStr
      } 
    },
    orderBy: { date: 'asc' }
  });

  // 3. Generate array of all dates in range
  const datesInRange: string[] = [];
  let current = new Date(start);
  while (current <= end) {
    datesInRange.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Group fetched data by date for quick lookup
  const mealsByDate = meals.reduce((acc, meal) => {
    if (!acc[meal.date]) acc[meal.date] = [];
    acc[meal.date].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  const waterByDate = waterEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, typeof waterEntries>);

  // 4. Aggregate daily data
  const dailyData: NutritionHistorySummary["dailyData"] = [];
  
  let daysLoggedFood = 0;
  
  const metricSums = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    waterMl: 0
  };

  const metricDaysCount = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    waterMl: 0
  };

  datesInRange.forEach(dateStr => {
    const dayMeals = mealsByDate[dateStr] || [];
    const dayWater = waterByDate[dateStr] || [];
    
    const isLogged = dayMeals.length > 0;
    if (isLogged) daysLoggedFood++;

    const dayConsumed = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      waterMl: 0
    };

    dayMeals.forEach(meal => {
      meal.foodItems.forEach(item => {
        dayConsumed.calories += item.calories;
        dayConsumed.protein += item.proteinGrams;
        dayConsumed.carbs += item.carbGrams;
        dayConsumed.fat += item.fatGrams;
        dayConsumed.fiber += item.fiberGrams;
        dayConsumed.sugar += item.sugarGrams || 0;
        dayConsumed.sodium += item.sodiumMg || 0;
      });
    });

    dayWater.forEach(entry => {
      dayConsumed.waterMl += entry.amountMl;
    });

    dailyData.push({
      date: dateStr,
      isLogged,
      consumed: dayConsumed
    });

    // Add to sums ONLY if the day has relevant logged data
    // For food metrics, we only count the day if ANY food was logged (isLogged = true)
    if (isLogged) {
      metricSums.calories += dayConsumed.calories;
      metricDaysCount.calories++;
      
      metricSums.protein += dayConsumed.protein;
      metricDaysCount.protein++;
      
      metricSums.carbs += dayConsumed.carbs;
      metricDaysCount.carbs++;
      
      metricSums.fat += dayConsumed.fat;
      metricDaysCount.fat++;
      
      metricSums.fiber += dayConsumed.fiber;
      metricDaysCount.fiber++;
      
      metricSums.sugar += dayConsumed.sugar;
      metricDaysCount.sugar++;
      
      metricSums.sodium += dayConsumed.sodium;
      metricDaysCount.sodium++;
    }

    // For water, we only count the day if ANY water was logged
    if (dayWater.length > 0) {
      metricSums.waterMl += dayConsumed.waterMl;
      metricDaysCount.waterMl++;
    }
  });

  return {
    hasActiveConnection,
    hasTarget,
    targets: target ? {
      calories: target.calorieTarget,
      protein: target.proteinTargetGrams,
      carbs: target.carbTargetGrams,
      fat: target.fatTargetGrams,
      waterLiters: target.waterTargetLiters,
      fiber: target.fiberTargetGrams
    } : null,
    daysInRange: datesInRange.length,
    daysLogged: daysLoggedFood,
    averages: {
      calories: metricDaysCount.calories ? Math.round(metricSums.calories / metricDaysCount.calories) : 0,
      protein: metricDaysCount.protein ? Math.round(metricSums.protein / metricDaysCount.protein) : 0,
      carbs: metricDaysCount.carbs ? Math.round(metricSums.carbs / metricDaysCount.carbs) : 0,
      fat: metricDaysCount.fat ? Math.round(metricSums.fat / metricDaysCount.fat) : 0,
      fiber: metricDaysCount.fiber ? Math.round(metricSums.fiber / metricDaysCount.fiber) : 0,
      sugar: metricDaysCount.sugar ? Math.round(metricSums.sugar / metricDaysCount.sugar) : 0,
      sodium: metricDaysCount.sodium ? Math.round(metricSums.sodium / metricDaysCount.sodium) : 0,
      waterMl: metricDaysCount.waterMl ? Math.round(metricSums.waterMl / metricDaysCount.waterMl) : 0,
    },
    dailyData
  };
}
