/** Match PostgreSQL Int fields without allowing NaN, infinity, or silent truncation. */
export function isNutritionAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) &&
    value >= 0 && value <= 2_147_483_647;
}

/** Reject impossible dates as well as timestamps and locale-dependent strings. */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
