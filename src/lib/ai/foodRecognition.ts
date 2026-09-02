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

export async function analyzeFoodText(name: string, portion: string): Promise<DetectedFoodItem | null> {
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

export async function analyzeFoodImage(imagePath: string): Promise<DetectedFoodItem[]> {
  try {
    // Ensure the file exists and read it
    const fileBuffer = await fs.readFile(imagePath);
    const mimeType = getMimeType(imagePath) || "image/jpeg";

    const prompt = `
You are a highly capable AI nutrition assistant. I am providing you with a photo of a meal.
Your task is to analyze this photo, identify the food items, estimate their portions, and estimate their nutritional values.

Please return the result strictly as a JSON array of objects. Do not include markdown formatting or any other text outside the JSON array.
If you cannot identify any food, or if the image is blurry, return an empty array: []

For each food item you identify, provide an object with the following fields:
- "name" (string): The name of the food item.
- "portionDescription" (string): A description of the estimated portion (e.g., "1 cup", "150g", "1 medium piece").
- "calories" (number): Estimated calories.
- "proteinGrams" (number): Estimated protein in grams.
- "carbGrams" (number): Estimated carbohydrates in grams.
- "fatGrams" (number): Estimated fat in grams.
- "fiberGrams" (number): Estimated fiber in grams (default 0 if unknown).

Example output:
[
  {
    "name": "Grilled Chicken Breast",
    "portionDescription": "150g",
    "calories": 248,
    "proteinGrams": 46,
    "carbGrams": 0,
    "fatGrams": 5,
    "fiberGrams": 0
  },
  {
    "name": "Steamed Broccoli",
    "portionDescription": "1 cup",
    "calories": 55,
    "proteinGrams": 4,
    "carbGrams": 11,
    "fatGrams": 1,
    "fiberGrams": 5
  }
]
`;

    // Make the call to the model
    // Time out after 20 seconds.
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
        return parsed;
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
