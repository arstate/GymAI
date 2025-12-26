import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet } from "../types";

const API_KEYS: string[] = (process.env.API_KEYS as any) || [];
let currentKeyIndex = 0;

const getClient = () => {
  if (API_KEYS.length === 0) throw new Error("Tidak ada API Key yang dikonfigurasi.");
  if (currentKeyIndex >= API_KEYS.length) currentKeyIndex = 0;
  return new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] });
};

async function executeWithRotation<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  let lastError: any = null;
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    try {
      return await operation(getClient());
    } catch (error: any) {
      lastError = error;
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    }
  }
  throw new Error(lastError?.message || "Gagal menghubungi layanan AI.");
}

// ... schemas remain same ...
const exerciseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    durationSeconds: { type: Type.NUMBER },
    reps: { type: Type.NUMBER },
    sets: { type: Type.NUMBER },
    restSeconds: { type: Type.NUMBER },
    tips: { type: Type.STRING }
  },
  required: ["name", "description", "sets", "restSeconds", "tips"]
};

const dailyRoutineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dayNumber: { type: Type.INTEGER },
    title: { type: Type.STRING },
    focusArea: { type: Type.STRING },
    isRestDay: { type: Type.BOOLEAN },
    exercises: { type: Type.ARRAY, items: exerciseSchema },
    estimatedDurationMin: { type: Type.NUMBER }
  },
  required: ["dayNumber", "title", "focusArea", "isRestDay", "exercises", "estimatedDurationMin"]
};

const mealSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    time: { type: Type.STRING },
    menu: { type: Type.STRING },
    calories: { type: Type.NUMBER }
  },
  required: ["time", "menu", "calories"]
};

const dailyDietSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dayNumber: { type: Type.INTEGER },
    totalCalories: { type: Type.NUMBER },
    meals: {
      type: Type.OBJECT,
      properties: {
        breakfast: mealSchema,
        lunch: mealSchema,
        dinner: mealSchema,
        snack1: mealSchema,
        snack2: mealSchema
      },
      required: ["breakfast", "lunch", "dinner", "snack1"]
    }
  },
  required: ["dayNumber", "totalCalories", "meals"]
};

const fitnessPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    weekNumber: { type: Type.INTEGER },
    overview: { type: Type.STRING },
    routines: { type: Type.ARRAY, items: dailyRoutineSchema },
    diet: { type: Type.ARRAY, items: dailyDietSchema },
    createdAt: { type: Type.STRING }
  },
  required: ["weekNumber", "overview", "routines", "diet", "createdAt"]
};

export const generateFitnessPlan = async (user: UserProfile, weekNumber: number = 1, lastFeedback?: WeeklyFeedback): Promise<FitnessPlan> => {
  const model = "gemini-3-flash-preview";
  let contextPrompt = weekNumber > 1 ? `Feedback: ${lastFeedback?.difficultyRating}, Berat: ${lastFeedback?.currentWeight}kg.` : "Rencana Baru.";

  const prompt = `
    Pelatih Profesional. Buat rencana 7 hari.
    DATA: Nama ${user.name}, Goal ${user.goal}, Alat ${user.equipment.join(', ')}, Budget Makan: ${user.dietBudget}.
    
    PENTING:
    - Jika Budget Makan adalah 'Murah', gunakan menu anak kos (tempe, tahu, telur, sayur pasar).
    - Jika 'Sedang', gunakan menu rumahan seimbang.
    - Jika 'Premium', gunakan protein tinggi (daging, salmon).
    - Bahasa Indonesia, format JSON.
  `;

  return executeWithRotation(async (ai) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: fitnessPlanSchema }
    });
    return JSON.parse(response.text.trim().replace(/^```json/i, "").replace(/```$/i, "")) as FitnessPlan;
  });
};

export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Buat ulang rencana makan 7 hari (Budget: MURAH/HEMAT) untuk ${user.name}. Gunakan bahan lokal sangat murah. Format JSON array.`;
  return executeWithRotation(async (ai) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: dailyDietSchema } }
    });
    return JSON.parse(response.text.trim().replace(/^```json/i, "").replace(/```$/i, "")) as DailyDiet[];
  });
};