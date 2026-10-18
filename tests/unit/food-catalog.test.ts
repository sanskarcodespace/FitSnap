// @vitest-environment node
import { describe, it, expect } from "vitest";
import { normalizeOpenFoodFacts, normalizeUSDA } from "@/lib/food/normalize";
import { scaleNutrients } from "@/lib/food/catalog-types";
import { parseDetectedFoods } from "@/lib/ai/foodRecognition";
const product = () => ({
  code: "12345678", product_name: "Oats", nutriments: {
    "energy-kcal_100g": 380, proteins_100g: 12, carbohydrates_100g: 60,
    fat_100g: 8, sodium_100g: 0.02,
  },
});
describe("food source integrity", () => {
  it("does not substitute missing nutrients with zero", () => {
    const food = normalizeOpenFoodFacts(product())!;
    expect(food.nutrients).toMatchObject({ fiberGrams: null, sugarGrams: null, sodiumMg: 20 });
    expect(scaleNutrients(food, 50, "g")).toMatchObject({ calories: 190, proteinGrams: 6, fiberGrams: null, sodiumMg: 10 });
  });
  it("preserves actual zero values", () => {
    const p = product(); p.nutriments.fat_100g = 0;
    expect(normalizeOpenFoodFacts(p)?.nutrients.fatGrams).toBe(0);
  });
  it.each(["energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"])("rejects missing core nutrient %s", key => {
    const p = product(); delete (p.nutriments as Record<string, unknown>)[key];
    expect(normalizeOpenFoodFacts(p)).toBeNull();
  });
  it.each([-1, NaN, Infinity, "42", null, 1001])("rejects invalid energy %s", value => {
    const p = product(); Object.assign(p.nutriments, { "energy-kcal_100g": value });
    expect(normalizeOpenFoodFacts(p)).toBeNull();
  });
  it("rejects provider quality errors", () => {
    expect(normalizeOpenFoodFacts({ ...product(), data_quality_errors_tags: ["en:nutrition-value-invalid"] })).toBeNull();
  });
  it("never uses AI-estimated provider fields to fill missing nutrition", () => {
    expect(normalizeOpenFoodFacts({ code: "12345678", product_name: "Unknown", nutriments_estimated: product().nutriments })).toBeNull();
  });
  it.each([0, -5, NaN, Infinity, 10001])("rejects invalid portions %s", amount => {
    expect(() => scaleNutrients(normalizeOpenFoodFacts(product())!, amount, "g")).toThrow();
  });
  it("does not guess the density of a USDA food", () => {
    const food = { ...normalizeOpenFoodFacts(product())!, basis: "100g" as const };
    expect(() => scaleNutrients(food, 100, "ml")).toThrow("weight in grams");
  });
  it("maps USDA detail nutrients by id and explicit unit", () => {
    const food = normalizeUSDA({ fdcId: 123, description: "Rice, cooked", foodNutrients: [
      { nutrient: { id: 1008, unitName: "kcal" }, amount: 130 },
      { nutrient: { id: 1003, unitName: "g" }, amount: 2.7 },
      { nutrient: { id: 1005, unitName: "g" }, amount: 28 },
      { nutrient: { id: 1004, unitName: "g" }, amount: 0.3 },
      { nutrient: { id: 1093, unitName: "mg" }, amount: 1 },
    ] })!;
    expect(food.nutrients.sodiumMg).toBe(1);
    expect(scaleNutrients(food, 200, "g").calories).toBe(260);
  });
  it("rejects kilojoules falsely labeled as calories", () => {
    expect(normalizeUSDA({ fdcId: 123, description: "Rice", foodNutrients: [
      { nutrientId: 1008, unitName: "kJ", value: 130 },
      { nutrientId: 1003, unitName: "g", value: 2 },
      { nutrientId: 1005, unitName: "g", value: 28 },
      { nutrientId: 1004, unitName: "g", value: 0.3 },
    ] })).toBeNull();
  });
  it("treats photo output as suggestions and ignores any generated nutrition", () => {
    expect(parseDetectedFoods(JSON.stringify([{ name: "Rice", quantity: 150, unit: "g", calories: 999, isEstimated: false }]))).toEqual([
      { name: "Rice", quantity: 150, unit: "g", isEstimated: true, dishName: null },
    ]);
  });
  it("drops malformed photo detections", () => {
    expect(parseDetectedFoods(JSON.stringify([null, { name: "Rice", quantity: -2, unit: "g" }, { name: "Unknown", quantity: 5, unit: "bucket" }]))).toEqual([]);
  });
});
