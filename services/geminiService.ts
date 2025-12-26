import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet } from "../types";

// Injected via vite.config.ts
const API_KEYS: string[] = (process.env.API_KEYS as any) || [];
let currentKeyIndex = 0;

const getClient = () => {
  if (API_KEYS.length === 0) throw new Error("Tidak ada API Key yang dikonfigurasi di system.");
  if (currentKeyIndex >= API_KEYS.length) currentKeyIndex = 0;
  
  console.log(`Menggunakan API Key index: ${currentKeyIndex}`);
  return new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] });
};

/**
 * Fungsi untuk memutar API Key jika terjadi error (seperti limit atau leaked)
 */
async function executeWithRotation<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  let lastError: any = null;
  const totalKeys = API_KEYS.length;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    try {
      const ai = getClient();
      return await operation(ai);
    } catch (error: any) {
      lastError = error;
      console.error(`Gagal pada kunci ${currentKeyIndex}:`, error);
      
      // Pindah ke kunci berikutnya
      currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
      
      // Jika error adalah 403 Leaked atau 429 Limit, kita lanjut ke kunci berikutnya
      // Jika sudah mencoba semua kunci, baru lempar error
      if (attempt === totalKeys - 1) {
        break;
      }
    }
  }

  // Ekstraksi pesan error yang lebih bersih
  let errorMsg = "Gagal menghubungi layanan AI setelah mencoba semua kunci.";
  if (lastError) {
    // Tangani error dari Google SDK yang seringkali berupa object atau stringified JSON
    if (typeof lastError === 'string') {
      errorMsg = lastError;
    } else if (lastError.message) {
      try {
        const parsed = JSON.parse(lastError.message);
        errorMsg = parsed?.error?.message || lastError.message;
      } catch {
        errorMsg = lastError.message;
      }
    }
  }

  if (errorMsg.includes("leaked")) {
    errorMsg = "Semua API Key terdeteksi 'Bocor' (Leaked) oleh Google karena dibagikan di publik. Silakan gunakan API Key baru yang private.";
  }

  throw new Error(errorMsg);
}

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
  const model = "gemini-flash-lite-latest";
  const prompt = `
    Pelatih Profesional. Buat rencana 7 hari.
    DATA: Nama ${user.name}, Goal ${user.goal}, Alat ${user.equipment.join(', ')}, Budget Makan: ${user.dietBudget}.
    
    PENTING:
    - Jika Budget Makan adalah 'Murah', gunakan menu sangat hemat/anak kos (tempe, tahu, telur).
    - Bahasa Indonesia, format JSON.
  `;

  return executeWithRotation(async (ai) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: fitnessPlanSchema }
    });
    const text = response.text || "";
    return JSON.parse(text.trim().replace(/^```json/i, "").replace(/```$/i, "")) as FitnessPlan;
  });
};

export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  const model = "gemini-flash-lite-latest";
  const prompt = `Buat ulang rencana makan 7 hari (Budget: MURAH/HEMAT) untuk ${user.name}. Gunakan bahan lokal sangat murah. Format JSON array.`;
  return executeWithRotation(async (ai) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: dailyDietSchema } }
    });
    const text = response.text || "";
    return JSON.parse(text.trim().replace(/^```json/i, "").replace(/```$/i, "")) as DailyDiet[];
  });
};