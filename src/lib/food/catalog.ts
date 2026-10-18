import type { CatalogFood, FoodProvider } from "./catalog-types";
import { normalizeOpenFoodFacts, normalizeUSDA } from "./normalize";
import { checkRateLimit } from "@/lib/rate-limit";

const FIELDS = "code,product_name,brands,nutriments,no_nutrition_data,data_quality_errors_tags";
const OFF = "https://world.openfoodfacts.org";
const USDA = "https://api.nal.usda.gov/fdc/v1";
// Bounded, public-data cache. Never store user photos or user records here.
const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
async function readJSON(url: string, provider: FoodProvider, search = false): Promise<any> {
  const key = url;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const request = (async () => {
    const limit = provider === "openfoodfacts"
      ? { windowMs: 60000, max: search ? 8 : 12 }
      : { windowMs: 3600000, max: 900 };
    if (!checkRateLimit("catalog-provider-" + provider + (provider === "openfoodfacts" ? (search ? "-search" : "-product") : ""), limit).success) {
      throw new Error("The food library is busy. Please wait a minute before trying again.");
    }
    const response = await fetch(url, {
      headers: { "User-Agent": "FitSnap/1.0 (https://github.com/sanskarcodespace/FitSnap)", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      // Our bounded cache handles successful JSON only; don't persist failures.
      cache: "no-store",
    });
    if (!response.ok) throw new Error("The food library is unavailable. Please retry or enter the package label manually.");
    const value = await response.json();
    if (cache.size >= 300) cache.delete(cache.keys().next().value!);
    cache.set(key, { value, expires: Date.now() + (search ? 15 * 60000 : 24 * 3600000) });
    return value;
  })();
  pending.set(key, request);
  try { return await request; } finally { pending.delete(key); }
}
function usdaKey() {
  const key = process.env.USDA_API_KEY;
  if (!key) throw new Error("General-food lookup is not configured yet. Search packaged foods or enter nutrition from a label.");
  return key;
}
export async function searchCatalog(query: string, provider: FoodProvider): Promise<CatalogFood[]> {
  if (typeof query !== "string" || query.trim().length < 2 || query.length > 120) throw new Error("Enter 2–120 characters to search.");
  if (provider === "usda") {
    const params = new URLSearchParams({ query: query.trim(), pageSize: "12", api_key: usdaKey() });
    const data = await readJSON(USDA + "/foods/search?" + params, provider, true);
    return (Array.isArray(data.foods) ? data.foods : []).map(normalizeUSDA).filter((f: CatalogFood | null): f is CatalogFood => f !== null);
  }
  if (provider !== "openfoodfacts") throw new Error("Choose a food library.");
  if (/^\d{8,14}$/.test(query.trim())) {
    try { return [await getCatalogFood(provider, query.trim())]; }
    catch (error) { if (error instanceof Error && error.message === "No complete nutrition record was found for this food.") return []; throw error; }
  }
  // Full-text search uses the documented legacy search endpoint; v3 has no search.
  const params = new URLSearchParams({ search_terms: query.trim(), search_simple: "1", action: "process", json: "1", page_size: "12", fields: FIELDS });
  const data = await readJSON(OFF + "/cgi/search.pl?" + params, provider, true);
  return (Array.isArray(data.products) ? data.products : []).map(normalizeOpenFoodFacts).filter((f: CatalogFood | null): f is CatalogFood => f !== null);
}
export async function getCatalogFood(provider: FoodProvider, id: string): Promise<CatalogFood> {
  let food: CatalogFood | null;
  if (provider === "usda" && /^\d{1,12}$/.test(id)) {
    food = normalizeUSDA(await readJSON(USDA + "/food/" + id + "?api_key=" + encodeURIComponent(usdaKey()), provider));
  } else if (provider === "openfoodfacts" && /^\d{8,14}$/.test(id)) {
    const data = await readJSON(OFF + "/api/v3/product/" + id + ".json?fields=" + FIELDS, provider);
    food = normalizeOpenFoodFacts(data.product);
  } else throw new Error("Invalid food reference.");
  if (!food) throw new Error("No complete nutrition record was found for this food.");
  return food;
}
