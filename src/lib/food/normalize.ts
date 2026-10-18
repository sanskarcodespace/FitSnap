import type { CatalogFood, Nutrients } from "./catalog-types";

type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const number = (value: unknown, max: number): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max ? value : null;

function complete(n: Record<keyof Nutrients, number | null>): n is Nutrients {
  return n.calories !== null && n.proteinGrams !== null && n.carbGrams !== null && n.fatGrams !== null;
}
export function normalizeOpenFoodFacts(raw: unknown): CatalogFood | null {
  const p = object(raw), n = object(p.nutriments);
  if (typeof p.code !== "string" || !/^\d{8,14}$/.test(p.code) ||
      typeof p.product_name !== "string" || !p.product_name.trim()) return null;
  // Exclude known quality errors and records explicitly lacking nutrition.
  if (p.no_nutrition_data === "on" || (Array.isArray(p.data_quality_errors_tags) && p.data_quality_errors_tags.length)) return null;
  const nutrients = {
    calories: number(n["energy-kcal_100g"], 1000),
    proteinGrams: number(n.proteins_100g, 100), carbGrams: number(n.carbohydrates_100g, 100),
    fatGrams: number(n.fat_100g, 100), fiberGrams: number(n.fiber_100g, 100),
    sugarGrams: number(n.sugars_100g, 100),
    // OFF sodium is in grams; the journal stores milligrams.
    sodiumMg: number(n.sodium_100g, 100) === null ? null : (n.sodium_100g as number) * 1000,
  };
  if (!complete(nutrients)) return null;
  return { id: p.code, provider: "openfoodfacts", name: p.product_name.trim(),
    brand: typeof p.brands === "string" ? p.brands : null,
    sourceUrl: "https://world.openfoodfacts.org/product/" + p.code,
    basis: "100g-or-100ml", nutrients };
}
export function normalizeUSDA(raw: unknown): CatalogFood | null {
  const p = object(raw);
  if (!Number.isInteger(p.fdcId) || typeof p.description !== "string" || !Array.isArray(p.foodNutrients)) return null;
  const nutrient = (id: number, unit: string, max: number) => {
    for (const rawNutrient of p.foodNutrients as unknown[]) {
      const n = object(rawNutrient), detail = object(n.nutrient);
      if ((n.nutrientId ?? detail.id) === id &&
          String(n.unitName ?? detail.unitName).toLowerCase() === unit) {
        return number(n.value ?? n.amount, max);
      }
    }
    return null;
  };
  const nutrients = {
    calories: nutrient(1008, "kcal", 1000) ?? nutrient(2047, "kcal", 1000) ?? nutrient(2048, "kcal", 1000),
    proteinGrams: nutrient(1003, "g", 100), carbGrams: nutrient(1005, "g", 100),
    fatGrams: nutrient(1004, "g", 100), fiberGrams: nutrient(1079, "g", 100),
    sugarGrams: nutrient(2000, "g", 100), sodiumMg: nutrient(1093, "mg", 100000),
  };
  if (!complete(nutrients)) return null;
  return { id: String(p.fdcId), provider: "usda", name: p.description,
    brand: typeof p.brandOwner === "string" ? p.brandOwner : typeof p.dataType === "string" ? p.dataType : null,
    sourceUrl: "https://fdc.nal.usda.gov/food-details/" + p.fdcId + "/nutrients", basis: "100g", nutrients };
}
