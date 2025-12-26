
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet, DailyRoutine } from "../types";

const getApiKeys = (): string[] => {
  try {
    const keys = (process.env.API_KEY || "").toString();
    return keys.split(",").map(k => k.trim()).filter(Boolean);
  } catch (e) {
    return [];
  }
};

let currentKeyIndex = 0;

async function callGeminiWithRetry<T>(
  task: (ai: GoogleGenAI) => Promise<T>,
  retries: number = 0
): Promise<T> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("API_KEY tidak ditemukan. Harap atur API_KEY di Environment Variables Vercel.");
  }

  const keyToUse = keys[currentKeyIndex % keys.length];
  const ai = new GoogleGenAI({ apiKey: keyToUse });

  try {
    return await task(ai);
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isAuthError = errorMsg.includes("401") || errorMsg.includes("key") || errorMsg.includes("not found");
    const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota");

    if ((isAuthError || isQuotaError) && retries < keys.length - 1) {
      currentKeyIndex++;
      return callGeminiWithRetry(task, retries + 1);
    }
    throw error;
  }
}

const exerciseSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    imagePrompt: { type: Type.STRING, description: "Detailed description for a stickman illustration of this exercise" },
    durationSeconds: { type: Type.NUMBER },
    reps: { type: Type.NUMBER },
    sets: { type: Type.NUMBER },
    restSeconds: { type: Type.NUMBER },
    tips: { type: Type.STRING }
  },
  required: ["name", "description", "imagePrompt", "sets", "restSeconds", "tips"]
};

const dailyRoutineSchema = {
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

const mealSchema = {
  type: Type.OBJECT,
  properties: {
    time: { type: Type.STRING },
    menu: { type: Type.STRING },
    calories: { type: Type.NUMBER }
  },
  required: ["time", "menu", "calories"]
};

const dailyDietSchema = {
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

const fitnessPlanSchema = {
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
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      Bertindaklah sebagai Pelatih Kebugaran & Nutrisi AI Profesional (Elite Level).
      Buat rencana kebugaran & diet 7 hari yang sangat spesifik dan aman untuk user berikut:
      - Nama: ${user.name}, Umur: ${user.age} tahun
      - Laju Perubahan BB Target: ${user.weeklyTargetKg} kg per minggu
      - Tujuan Utama: ${user.goal}
      - Peralatan Tersedia: ${user.equipment.join(', ')}
      - Minggu Ke: ${weekNumber}

      Instruksi Latihan:
      Untuk setiap gerakan latihan, buatlah 'imagePrompt' yang mendeskripsikan instruksi visual untuk ilustrasi stickman (stikmen).
      Contoh: "A professional 2D stickman diagram of a push up, showing starting position and down position with arrows, clean vector lines, white background."

      Kembalikan respon dalam format JSON sesuai schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: fitnessPlanSchema
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Gagal menerima respon dari AI.");
    return JSON.parse(text.trim());
  });
};

export const generateExerciseImage = async (exerciseName: string, imagePrompt: string): Promise<string> => {
  return callGeminiWithRetry(async (ai) => {
    const finalPrompt = `Create a clean, minimalist 2D stickman (stikmen) tutorial illustration for the exercise: "${exerciseName}". 
    Visual style: ${imagePrompt}. 
    Requirements: High contrast, black lines on pure white background, educational diagram style, professional, no text in image, clear motion arrows if needed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: finalPrompt }],
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found");
  });
};

export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      Buat ulang rencana makan 7 hari yang sangat optimal untuk budget ${user.dietBudget} untuk ${user.name}.
      Format output: JSON array dari DailyDiet sesuai schema.
    `;
    
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { type: Type.ARRAY, items: dailyDietSchema } 
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Gagal menerima respon diet dari AI.");
    return JSON.parse(text.trim());
  });
};

export const askAiAssistant = async (
  user: UserProfile, 
  currentDiet: DailyDiet, 
  currentRoutine: DailyRoutine,
  userQuestion: string
): Promise<string> => {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      Anda adalah asisten FitGenius ID. Jawab pertanyaan user "${userQuestion}" berdasarkan konteks diet dan latihan mereka hari ini.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Maaf, saya sedang tidak bisa berpikir. Coba tanya lagi nanti ya.";
  });
};
