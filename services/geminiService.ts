
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet } from "../types";

// Fungsi untuk mendapatkan daftar key dari environment
const getApiKeys = (): string[] => {
  const keys = process.env.API_KEY || "";
  return keys.split(",").map(k => k.trim()).filter(Boolean);
};

// Variable untuk melacak key mana yang sedang digunakan
let currentKeyIndex = 0;

/**
 * Wrapper untuk memanggil Gemini dengan dukungan Multi-Key Failover.
 */
async function callGeminiWithRetry<T>(
  task: (ai: GoogleGenAI) => Promise<T>,
  retries: number = 0
): Promise<T> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("API_KEY tidak ditemukan di environment variable.");
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
      console.warn(`Key index ${currentKeyIndex % keys.length} bermasalah. Mencoba key cadangan...`);
      currentKeyIndex++;
      return callGeminiWithRetry(task, retries + 1);
    }
    throw error;
  }
}

// Schema definitions
const exerciseSchema = {
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
      - Jenis Kelamin: ${user.gender}
      - Tinggi: ${user.height}cm
      - BB Sekarang: ${user.weight}kg
      - Target BB Akhir: ${user.targetWeight}kg (Penting: Sesuaikan kalori berdasarkan target ini)
      - Tujuan Utama: ${user.goal}
      - Peralatan Tersedia: ${user.equipment.join(', ')}
      - Budget Makan: ${user.dietBudget}
      - Riwayat Medis/Cedera: ${user.medicalHistory || 'Tidak ada'}
      - Perokok: ${user.isSmoker ? 'Ya' : 'Tidak'}
      - Feedback Progres Minggu Lalu: ${lastFeedback ? JSON.stringify(lastFeedback) : 'Baru mulai program'}
      - Minggu Ke: ${weekNumber}

      Instruksi Khusus: 
      1. Jika selisih BB sekarang dan target besar, buat defisit/surplus kalori yang aman. 
      2. Menu diet HARUS sangat relevan dengan budget "${user.dietBudget}". 
      3. Gunakan Bahasa Indonesia yang memotivasi.
      
      Kembalikan respon dalam format JSON sesuai schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: fitnessPlanSchema,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Gagal menerima respon dari AI.");
    return JSON.parse(text.trim());
  });
};

export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `
      Buat ulang rencana makan 7 hari yang sangat optimal untuk budget ${user.dietBudget} untuk ${user.name}.
      Tujuan: ${user.goal}. BB Saat ini: ${user.weight}kg, Target: ${user.targetWeight}kg.
      Gunakan istilah kuliner Indonesia yang umum.
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
