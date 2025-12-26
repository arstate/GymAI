import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet } from "../types";

// Inisialisasi AI secara langsung menggunakan process.env.API_KEY
// Di Vercel, pastikan Anda sudah menambahkan environment variable dengan nama API_KEY
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key tidak ditemukan. Pastikan sudah diatur di Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
};

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
  const ai = getAI();
  const model = "gemini-flash-lite-latest";
  const prompt = `
    Pelatih Profesional. Buat rencana 7 hari.
    DATA: Nama ${user.name}, Goal ${user.goal}, Alat ${user.equipment.join(', ')}, Budget Makan: ${user.dietBudget}.
    
    PENTING:
    - Jika Budget Makan adalah 'Murah', gunakan menu sangat hemat/anak kos (tempe, tahu, telur).
    - Bahasa Indonesia, format JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: fitnessPlanSchema }
  });
  const text = response.text || "";
  return JSON.parse(text.trim().replace(/^```json/i, "").replace(/```$/i, "")) as FitnessPlan;
};

export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  const ai = getAI();
  const model = "gemini-flash-lite-latest";
  const prompt = `Buat ulang rencana makan 7 hari (Budget: MURAH/HEMAT) untuk ${user.name}. Gunakan bahan lokal sangat murah. Format JSON array.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: dailyDietSchema } }
  });
  const text = response.text || "";
  return JSON.parse(text.trim().replace(/^```json/i, "").replace(/```$/i, "")) as DailyDiet[];
};