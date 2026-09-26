// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isCalendarDate } from "@/lib/food-validation";

const mocks = vi.hoisted(() => ({
  create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), water: vi.fn(),
  verifyToken: vi.fn(), getFood: vi.fn(),
}));
vi.mock("@/lib/db/prisma", () => ({ default: {
  mealLog: { create: mocks.create, update: mocks.update, findUnique: mocks.findUnique },
  waterLogEntry: { create: mocks.water },
}}));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: () => ({ value: "test-token" }),
}) }));
vi.mock("@/lib/food/catalog", () => ({ getCatalogFood: mocks.getFood, searchCatalog: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/jwt", () => ({ verifyToken: mocks.verifyToken }));
vi.mock("@/lib/upload", () => ({ processAndStoreImage: vi.fn() }));
import { addWater, saveMealLog } from "@/app/(authenticated)/client/food/actions";

const meal = () => ({
  date: "2026-09-01", mealType: "Lunch",
  foodItems: [{
    name: "Soup", calories: 150, proteinGrams: 5, carbGrams: 20,
    fatGrams: 6, fiberGrams: 2, sugarGrams: 4, sodiumMg: 350,
  }],
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyToken.mockResolvedValue({ userId: "client-1", role: "CLIENT" });
  mocks.create.mockResolvedValue({ id: "meal-1" });
  mocks.findUnique.mockResolvedValue({ id: "meal-1", clientId: "client-1" });
});

describe("food logging", () => {
  it.each(["CLIENT", "INDIVIDUAL"])("preserves sugar and sodium for %s meals", async role => {
    mocks.verifyToken.mockResolvedValue({ userId: "client-1", role });
    expect(await saveMealLog(meal())).toEqual({ success: true, id: "meal-1" });
    expect(mocks.create.mock.calls[0][0].data.foodItems.create[0])
      .toMatchObject({ sugarGrams: 4, sodiumMg: 350 });
  });
  it("preserves nutrients when replacing an edited meal's items", async () => {
    expect(await saveMealLog({ ...meal(), id: "meal-1" })).toMatchObject({ success: true });
    expect(mocks.update.mock.calls[0][0].data.foodItems.create[0])
      .toMatchObject({ sugarGrams: 4, sodiumMg: 350 });
  });
  it("allows manual items with unknown optional nutrients", async () => {
    const input = meal();
    Object.assign(input.foodItems[0], { sugarGrams: undefined, sodiumMg: null });
    expect(await saveMealLog(input)).toMatchObject({ success: true });
    expect(mocks.create.mock.calls[0][0].data.foodItems.create[0])
      .toMatchObject({ sugarGrams: null, sodiumMg: null });
  });
  it.each([-1, NaN, Infinity, 1.5, 2147483648])("rejects invalid nutrient %s before writing", async value => {
    const input = meal();
    input.foodItems[0].calories = value;
    expect(await saveMealLog(input)).toHaveProperty("error");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects invalid optional nutrients", async () => {
    const input = meal();
    input.foodItems[0].sodiumMg = -10;
    expect(await saveMealLog(input)).toHaveProperty("error");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each(["2026-02-30", "invalid", "2026-09-01T00:00:00Z"])("rejects date %s", async date => {
    expect(await saveMealLog({ ...meal(), date })).toHaveProperty("error");
    expect(await addWater(date, 250)).toHaveProperty("error");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.water).not.toHaveBeenCalled();
  });
  it.each([0, -250, NaN, Infinity, 0.5, 2147483648])("rejects invalid water amount %s", async value => {
    expect(await addWater("2026-09-01", value)).toHaveProperty("error");
    expect(mocks.water).not.toHaveBeenCalled();
  });
  it("records valid water for the signed-in user", async () => {
    expect(await addWater("2026-09-01", 250)).toEqual({ success: true });
    expect(mocks.water).toHaveBeenCalledWith({ data: {
      clientId: "client-1", date: "2026-09-01", amountMl: 250,
    }});
  });
  it("rejects unauthenticated writes", async () => {
    mocks.verifyToken.mockResolvedValue(null);
    expect(await saveMealLog(meal())).toEqual({ error: "Unauthorized" });
    expect(await addWater("2026-09-01", 250)).toEqual({ error: "Unauthorized" });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.water).not.toHaveBeenCalled();
  });
  it("does not update another user's meal", async () => {
    mocks.findUnique.mockResolvedValue({ clientId: "other-client" });
    expect(await saveMealLog({ ...meal(), id: "meal-1" })).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("validates leap days", () => {
    expect(isCalendarDate("2024-02-29")).toBe(true);
    expect(isCalendarDate("2025-02-29")).toBe(false);
  });
});

it("recalculates catalog nutrition on the server instead of trusting supplied macros", async () => {
  mocks.getFood.mockResolvedValue({
    id: "12345678", provider: "openfoodfacts", name: "Source oats", brand: null,
    sourceUrl: "https://world.openfoodfacts.org/product/12345678", basis: "100g-or-100ml",
    nutrients: { calories: 400, proteinGrams: 12, carbGrams: 60, fatGrams: 8, fiberGrams: null, sugarGrams: 2, sodiumMg: 5 },
  });
  const input = meal();
  Object.assign(input.foodItems[0], { calories: 1, name: "Forged name",
    catalogRef: { provider: "openfoodfacts", id: "12345678", amount: 50, unit: "g" } });
  expect(await saveMealLog(input)).toMatchObject({ success: true });
  expect(mocks.create.mock.calls[0][0].data.foodItems.create[0]).toMatchObject({
    name: "Source oats", calories: 200, proteinGrams: 6, fiberGrams: null,
    nutritionSource: "openfoodfacts", sourceFoodId: "12345678", portionAmount: 50, portionUnit: "g",
  });
});
