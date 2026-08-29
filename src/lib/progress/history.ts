import prisma from "@/lib/db/prisma";

export interface WeightHistorySummary {
  entries: { date: string; value: number; note: string | null; isLogged: boolean; id: string }[];
  periodAverage: number | null;
  periodChange: number | null;
  mostRecentWeight: number | null;
  mostRecentDate: string | null;
  targetWeight: number | null;
  hasWeightGoal: boolean;
  preferredWeightUnit: string;
}

export interface MeasurementHistorySummary {
  entries: { date: string; value: number; note: string | null; isLogged: boolean; id: string }[];
  periodAverage: number | null;
  periodChange: number | null;
  mostRecentValue: number | null;
  mostRecentDate: string | null;
  preferredMeasurementUnit: string;
}

export type MeasurementType = "waist" | "chest" | "hips" | "arms" | "thighs";

function validateDateRange(startDateStr: string, endDateStr: string) {
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

  return { start, end };
}

export async function getWeightHistory(
  clientId: string,
  startDateStr: string,
  endDateStr: string
): Promise<WeightHistorySummary> {
  validateDateRange(startDateStr, endDateStr);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: clientId }
  });

  if (!clientProfile) {
    throw new Error("Client profile not found");
  }

  // Find most recent weight regardless of range
  const mostRecentEntry = await prisma.weightEntry.findFirst({
    where: { clientId },
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Find entries in range
  // We need to group by date to get the most recent entry per date if there are multiple.
  const rawEntries = await prisma.weightEntry.findMany({
    where: {
      clientId,
      date: {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr)
      }
    },
    orderBy: [
      { date: 'asc' },
      { createdAt: 'desc' } // Most recent first for a given date
    ]
  });

  const uniqueEntriesMap = new Map<string, typeof rawEntries[0]>();
  for (const entry of rawEntries) {
    const dateKey = entry.date.toISOString().split('T')[0];
    if (!uniqueEntriesMap.has(dateKey)) {
      uniqueEntriesMap.set(dateKey, entry);
    }
  }

  const entriesInRange = Array.from(uniqueEntriesMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate stats
  let periodAverage = null;
  let periodChange = null;

  if (entriesInRange.length > 0) {
    const sum = entriesInRange.reduce((acc, curr) => acc + curr.weightValue, 0);
    periodAverage = sum / entriesInRange.length;
    periodChange = entriesInRange[entriesInRange.length - 1].weightValue - entriesInRange[0].weightValue;
  }

  return {
    entries: entriesInRange.map(e => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      value: e.weightValue,
      note: e.note,
      isLogged: true
    })),
    periodAverage,
    periodChange,
    mostRecentWeight: mostRecentEntry?.weightValue || null,
    mostRecentDate: mostRecentEntry?.date.toISOString().split('T')[0] || null,
    targetWeight: clientProfile.targetWeight,
    hasWeightGoal: clientProfile.goal === "Lose Weight" || clientProfile.goal === "Gain Weight",
    preferredWeightUnit: clientProfile.preferredWeightUnit || "kg"
  };
}

export async function getMeasurementHistory(
  clientId: string,
  type: MeasurementType,
  startDateStr: string,
  endDateStr: string
): Promise<MeasurementHistorySummary> {
  validateDateRange(startDateStr, endDateStr);

  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: clientId }
  });

  if (!clientProfile) {
    throw new Error("Client profile not found");
  }

  const valueField = `${type}Value` as keyof typeof prisma.bodyMeasurementEntry.fields;

  // Find most recent regardless of range
  const mostRecentEntry = await prisma.bodyMeasurementEntry.findFirst({
    where: { 
      clientId,
      [valueField]: { not: null }
    },
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  const rawEntries = await prisma.bodyMeasurementEntry.findMany({
    where: {
      clientId,
      date: {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr)
      },
      [valueField]: { not: null }
    },
    orderBy: [
      { date: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  const uniqueEntriesMap = new Map<string, typeof rawEntries[0]>();
  for (const entry of rawEntries) {
    const dateKey = entry.date.toISOString().split('T')[0];
    if (!uniqueEntriesMap.has(dateKey)) {
      uniqueEntriesMap.set(dateKey, entry);
    }
  }

  const entriesInRange = Array.from(uniqueEntriesMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  let periodAverage = null;
  let periodChange = null;

  if (entriesInRange.length > 0) {
    const values = entriesInRange.map(e => e[valueField as keyof typeof e] as number);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    periodAverage = sum / entriesInRange.length;
    periodChange = values[values.length - 1] - values[0];
  }

  return {
    entries: entriesInRange.map(e => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      value: e[valueField as keyof typeof e] as number,
      note: e.note,
      isLogged: true
    })),
    periodAverage,
    periodChange,
    mostRecentValue: (mostRecentEntry?.[valueField as keyof typeof mostRecentEntry] as number | undefined) || null,
    mostRecentDate: mostRecentEntry?.date.toISOString().split('T')[0] || null,
    preferredMeasurementUnit: clientProfile.preferredMeasurementUnit || "cm"
  };
}
