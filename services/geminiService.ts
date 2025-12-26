
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet } from "../types";

// Skema untuk latihan dalam rutinitas
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

// Skema untuk rutinitas harian
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

// Skema untuk rincian makanan
const mealSchema = {
  type: Type.OBJECT,
  properties: {
    time: { type: Type.STRING },
    menu: { type: Type.STRING },
    calories: { type: Type.NUMBER }
  },
  required: ["time", "menu", "calories"]
};

// Skema untuk diet harian
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

// Skema utama rencana kebugaran mingguan
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

/**
 * Generates a fitness plan using Gemini API.
 * Follows guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
 */
export const generateFitnessPlan = async (user: UserProfile, weekNumber: number = 1, lastFeedback?: WeeklyFeedback): Promise<FitnessPlan> => {
  // Always create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Bertindaklah sebagai Pelatih Kebugaran AI Profesional.
    Buat rencana kebugaran & diet 7 hari untuk user berikut:
    - Nama: ${user.name}, Umur: ${user.age} tahun
    - Tujuan: ${user.goal}
    - Peralatan: ${user.equipment.join(', ')}
    - Budget Makan: ${user.dietBudget}
    - Riwayat Medis: ${user.medicalHistory || 'Tidak ada'}
    - Perokok: ${user.isSmoker ? 'Ya' : 'Tidak'}
    - Feedback Minggu Lalu: ${lastFeedback ? JSON.stringify(lastFeedback) : 'Baru mulai'}
    - Minggu Ke: ${weekNumber}

    Kebutuhan:
    1. Pastikan menu diet sesuai dengan budget yang dipilih.
    2. Jika user memiliki riwayat medis, hindari gerakan yang berbahaya.
    3. Gunakan Bahasa Indonesia yang ramah.
    4. Kembalikan format JSON murni.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: fitnessPlanSchema 
    }
  });
  
  // Directly access .text property as per guidelines
  const text = response.text;
  if (!text) throw new Error("Gagal menerima respon dari AI.");
  return JSON.parse(text.trim());
};

/**
 * Regenerates a cheap diet plan using Gemini API.
 */
export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  // Always create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    Buat ulang rencana makan 7 hari (Budget: HEMAT) untuk ${user.name} (Tujuan: ${user.goal}).
    Fokus pada bahan lokal murah yang kaya protein seperti telur, tempe, tahu, dan dada ayam.
    Format output: JSON array dari DailyDiet.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: { type: Type.ARRAY, items: dailyDietSchema } 
    }
  });
  
  // Directly access .text property as per guidelines
  const text = response.text;
  if (!text) throw new Error("Gagal menerima respon dari AI.");
  return JSON.parse(text.trim());
};
