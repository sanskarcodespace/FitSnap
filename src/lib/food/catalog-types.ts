export type FoodProvider = "openfoodfacts" | "usda";
export type Nutrients = {
  calories: number; proteinGrams: number; carbGrams: number; fatGrams: number;
  fiberGrams: number | null; sugarGrams: number | null; sodiumMg: number | null;
};
export type CatalogFood = {
  id: string; provider: FoodProvider; name: string; brand: string | null;
  sourceUrl: string; basis: "100g" | "100g-or-100ml"; nutrients: Nutrients;
};
export type CatalogReference = { provider: FoodProvider; id: string; amount: number; unit: "g" | "ml" };
export function scaleNutrients(food: CatalogFood, amount: number, unit: "g" | "ml"): Nutrients {
  if (unit !== "g" && unit !== "ml") throw new Error("Choose grams or milliliters.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) throw new Error("Enter an amount between 0 and 10,000.");
  if (food.basis === "100g" && unit !== "g") throw new Error("This food requires a weight in grams.");
  return Object.fromEntries(Object.entries(food.nutrients).map(([key, value]) =>
    [key, value === null ? null : Math.round(value * amount / 100)]
  )) as Nutrients;
}
