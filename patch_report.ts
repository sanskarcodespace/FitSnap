import fs from 'fs';
const path = 'src/lib/data/client-report.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `  // 1. Nutrition
  const nutritionPlan = connection ? await prisma.dietPlan.findFirst({ where: { coachClientConnectionId: connection.id, status: "ACTIVE" } }) : null;
  const nutritionCurrent = await getNutritionHistorySummary(clientId, startDate, endDate);
  const nutritionPrev = await getNutritionHistorySummary(clientId, prevStartDate, prevEndDate);
  
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
  const workoutPlan = connection ? await prisma.workoutPlan.findFirst({ where: { coachClientConnectionId: connection.id, status: "ACTIVE" } }) : null;
  const workoutCountCurr = await getWorkoutCount(clientId, startDate, endDate);
  const workoutCountPrev = await getWorkoutCount(clientId, prevStartDate, prevEndDate);

  let workoutSection = null;
  if (workoutPlan || workoutCountCurr > 0 || !connection) {
    workoutSection = {
      hasPlan: !!workoutPlan,
      count: { current: workoutCountCurr, prev: workoutCountPrev }
    };
  }

  // 3. Yoga
  const yogaPlan = connection ? await prisma.yogaPlan.findFirst({ where: { coachClientConnectionId: connection.id, status: "ACTIVE" } }) : null;
  const yogaCountCurr = await getYogaCount(clientId, startDate, endDate);
  const yogaCountPrev = await getYogaCount(clientId, prevStartDate, prevEndDate);

  let yogaSection = null;
  if (yogaPlan || yogaCountCurr > 0 || !connection) {
    yogaSection = {
      hasPlan: !!yogaPlan,
      count: { current: yogaCountCurr, prev: yogaCountPrev }
    };
  }

  // 4. Habits
  const activeHabitPlan = connection ? await prisma.habitPlan.findFirst({
    where: { coachClientConnectionId: connection.id, status: "ACTIVE" },
    include: { items: { where: { status: "active" } } }
  }) : null;

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
  const checkinsCurr = await getCheckinStats(clientId, startDate, endDate);
  const checkinsPrev = await getCheckinStats(clientId, prevStartDate, prevEndDate);
  
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
  const weightHistoryCurr = await getWeightHistory(clientId, startDate, endDate);
  
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
  const photoCountCurr = await getProgressPhotoCount(clientId, startDate, endDate);`,
  `  // Concurrently fetch all independent domain data
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
  if (photoCountCurr > 0) {`
);

fs.writeFileSync(path, content);
console.log("Patched client-report.ts");
