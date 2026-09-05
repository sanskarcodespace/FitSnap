import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";

// Initialize the client.
// It will automatically pick up the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

export type DetectedFoodItem = {
  name: string;
  portionDescription: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams?: number;
  sodiumMg?: number;
};

/** Structured food item returned by AI image analysis before nutrition calculation */
export type DetectedFoodRaw = {
  name: string;
  quantity: number;
  unit: string;
  isEstimated: boolean;
};

/** Food item with full nutrition after the "Calculate Nutrition" step */
export type CalculatedFoodItem = {
  name: string;
  quantity: number;
  unit: string;
  portionDescription: string;
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
  sodiumMg: number;
};

export async function analyzeFoodText(name: string, portion: string): Promise<DetectedFoodItem | null> {
  if (process.env.MOCK_AI === "true") {
    return {
      name: "Mock " + name,
      portionDescription: portion || "1 serving",
      calories: 100,
      proteinGrams: 10,
      carbGrams: 10,
      fatGrams: 5,
      fiberGrams: 2
    };
  }

  try {
    const prompt = `
You are a highly capable AI nutrition assistant. 
The user is manually logging a food item.
Name: "${name}"
Portion/Quantity: "${portion}"

Your task is to estimate the nutritional values for this specific portion of the food.

Please return the result strictly as a single JSON object. Do not include markdown formatting or any other text outside the JSON object.
If the food is completely unrecognizable or makes no sense, return a JSON object with all zero values.

Provide an object with the following fields:
- "name" (string): The cleaned up name of the food item.
- "portionDescription" (string): A clean description of the estimated portion.
- "calories" (number): Estimated calories.
- "proteinGrams" (number): Estimated protein in grams.
- "carbGrams" (number): Estimated carbohydrates in grams.
- "fatGrams" (number): Estimated fat in grams.
- "fiberGrams" (number): Estimated fiber in grams (default 0 if unknown).

Example output:
{
  "name": "Grilled Chicken Breast",
  "portionDescription": "150g",
  "calories": 248,
  "proteinGrams": 46,
  "carbGrams": 0,
  "fatGrams": 5,
  "fiberGrams": 0
}
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = response.text;
    if (!responseText) return null;

    try {
      const parsed = JSON.parse(responseText);
      if (parsed && typeof parsed === 'object') {
        return parsed as DetectedFoodItem;
      }
      return null;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", responseText);
      return null;
    }
  } catch (error) {
    console.error("Error in analyzeFoodText:", error);
    throw new Error("Analysis failed");
  }
}

/**
 * Analyzes a food image and returns detected food items with quantity estimates.
 * This is the FIRST step — it detects foods and estimates portions but does NOT
 * calculate full nutrition. That happens in calculateNutritionForItems().
 */
export async function analyzeFoodImage(image: Buffer | string, filename?: string): Promise<DetectedFoodRaw[]> {
  if (process.env.MOCK_AI === "true") {
    return [
      { name: "Rice", quantity: 250, unit: "g", isEstimated: true },
      { name: "Chicken", quantity: 150, unit: "g", isEstimated: true },
      { name: "Dal", quantity: 120, unit: "g", isEstimated: true },
    ];
  }

  try {
    let fileBuffer: Buffer;
    let mimeType: string = "image/jpeg";
    
    if (Buffer.isBuffer(image)) {
      fileBuffer = image;
      if (filename) {
        mimeType = getMimeType(filename);
      }
    } else {
      fileBuffer = await fs.readFile(image);
      mimeType = getMimeType(image);
    }

    const prompt = `
You are a highly capable AI food recognition assistant. I am providing you with a photo of a meal.

Your task is to:
1. Identify EACH distinct food item visible in the photo.
2. Estimate the quantity/portion for each food item based on visual cues.

IMPORTANT RULES FOR QUANTITY ESTIMATION:
- Use grams (g) for foods that are naturally weighed: rice, chicken, meat, dal, paneer, salad, etc.
- Use "piece" or "pieces" for countable items: eggs, roti, chapati, banana, apple, cookies, etc.
- Use "bowl" for soups, cereals, or foods served in a bowl.
- Use "cup" for beverages or measured servings.
- Use "serving" only when no better unit applies.
- NEVER force everything into grams. Use the most natural unit for each food.
- All quantities are ESTIMATES based on visual information. Mark them as estimated.

Please return the result strictly as a JSON array of objects. Do not include markdown formatting or any other text outside the JSON array.
If you cannot identify any food, or if the image is blurry, return an empty array: []

For each food item, provide an object with these fields:
- "name" (string): The specific name of the food item (e.g. "Basmati Rice", "Grilled Chicken Breast", "Roti", "Boiled Egg").
- "quantity" (number): The estimated quantity as a number.
- "unit" (string): The unit of measurement. One of: "g", "kg", "ml", "piece", "pieces", "bowl", "cup", "serving".
- "isEstimated" (boolean): Always true for image-based detection.

Example output for a plate with rice, chicken, eggs, and roti:
[
  { "name": "Steamed Rice", "quantity": 250, "unit": "g", "isEstimated": true },
  { "name": "Grilled Chicken", "quantity": 150, "unit": "g", "isEstimated": true },
  { "name": "Boiled Egg", "quantity": 2, "unit": "pieces", "isEstimated": true },
  { "name": "Roti", "quantity": 2, "unit": "pieces", "isEstimated": true }
]
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: fileBuffer.toString("base64"),
                  mimeType,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = response.text;
    if (!responseText) {
      return [];
    }

    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        // Validate and sanitize each item
        return parsed.map((item: any) => ({
          name: typeof item.name === "string" ? item.name : "Unknown Food",
          quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0,
          unit: typeof item.unit === "string" ? item.unit : "g",
          isEstimated: true,
        }));
      }
      return [];
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", responseText);
      return [];
    }
  } catch (error) {
    console.error("Error in analyzeFoodImage:", error);
    throw new Error("Analysis failed");
  }
}

/**
 * Takes a list of confirmed food items (name + quantity + unit) and calculates
 * full nutritional breakdown for each. This is the SECOND step, called after
 * the user reviews and edits the AI-detected foods.
 */
export async function calculateNutritionForItems(
  items: { name: string; quantity: number; unit: string }[]
): Promise<CalculatedFoodItem[]> {
  if (items.length === 0) return [];

  if (process.env.MOCK_AI === "true") {
    return items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      portionDescription: `${item.quantity} ${item.unit}`,
      calories: Math.round(item.quantity * 1.5),
      proteinGrams: Math.round(item.quantity * 0.2),
      carbGrams: Math.round(item.quantity * 0.3),
      fatGrams: Math.round(item.quantity * 0.05),
      fiberGrams: Math.round(item.quantity * 0.02),
      sugarGrams: Math.round(item.quantity * 0.01),
      sodiumMg: Math.round(item.quantity * 0.5),
    }));
  }

  try {
    const foodListStr = items.map((item, i) =>
      `${i + 1}. ${item.name} — ${item.quantity} ${item.unit}`
    ).join("\n");

    const prompt = `
You are a highly capable AI nutrition calculator.

The user has confirmed the following food items with specific quantities:

${foodListStr}

For EACH food item, calculate the nutritional values based on the EXACT quantity provided.
The calculation must be quantity-proportional. For example, if 100g of chicken has 165 calories,
then 150g should have 247.5 calories (round to nearest integer).

For items measured in "piece", "pieces", "bowl", "cup", or "serving", use standard portion sizes:
- 1 roti/chapati ≈ 30–40g
- 1 boiled egg ≈ 50g
- 1 banana ≈ 120g
- 1 bowl of dal ≈ 200ml
- 1 cup of tea/coffee ≈ 150ml

Return a JSON array where each object corresponds to a food item in the same order.
Each object must have:
- "name" (string): The food name.
- "quantity" (number): The confirmed quantity.
- "unit" (string): The unit of measurement.
- "portionDescription" (string): A human-readable description like "250g" or "2 pieces".
- "calories" (number): Total calories for this quantity.
- "proteinGrams" (number): Total protein in grams.
- "carbGrams" (number): Total carbohydrates in grams.
- "fatGrams" (number): Total fat in grams.
- "fiberGrams" (number): Total fiber in grams.
- "sugarGrams" (number): Total sugar in grams (0 if unknown).
- "sodiumMg" (number): Total sodium in milligrams (0 if unknown).

Return ONLY the JSON array, no markdown or extra text.
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty AI response");
    }

    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, i: number) => ({
          name: item.name || items[i]?.name || "Unknown",
          quantity: item.quantity || items[i]?.quantity || 0,
          unit: item.unit || items[i]?.unit || "g",
          portionDescription: item.portionDescription || `${items[i]?.quantity} ${items[i]?.unit}`,
          calories: Math.round(item.calories || 0),
          proteinGrams: Math.round(item.proteinGrams || 0),
          carbGrams: Math.round(item.carbGrams || 0),
          fatGrams: Math.round(item.fatGrams || 0),
          fiberGrams: Math.round(item.fiberGrams || 0),
          sugarGrams: Math.round(item.sugarGrams || 0),
          sodiumMg: Math.round(item.sodiumMg || 0),
        }));
      }
      throw new Error("AI returned non-array response");
    } catch (parseError) {
      console.error("Failed to parse AI nutrition response:", responseText);
      throw new Error("Failed to parse nutrition data");
    }
  } catch (error) {
    console.error("Error in calculateNutritionForItems:", error);
    throw new Error("Nutrition calculation failed");
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}
