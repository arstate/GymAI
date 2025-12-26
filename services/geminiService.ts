
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet } from "../types";

/**
 * Fungsi pembantu untuk membuat instance AI baru setiap kali dipanggil.
 * Ini memastikan aplikasi selalu menggunakan API_KEY yang aktif (baik dari env atau dialog).
 */
const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

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

// Skema untuk rutinitas harian (Workout)
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
 * Menghasilkan rencana kebugaran dan diet 7 hari yang dipersonalisasi.
 */
export const generateFitnessPlan = async (user: UserProfile, weekNumber: number = 1, lastFeedback?: WeeklyFeedback): Promise<FitnessPlan> => {
  const ai = createClient();
  // Menggunakan model Gemini 3 Flash untuk keseimbangan kecepatan dan kecerdasan dalam perencanaan
  const model = "gemini-3-flash-preview";
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
    3. Gunakan Bahasa Indonesia yang sangat ramah dan memotivasi.
    4. Kembalikan data dalam format JSON murni sesuai schema.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: fitnessPlanSchema 
    }
  });
  
  return JSON.parse(response.text.trim());
};

/**
 * Menghasilkan ulang rencana makan khusus dengan budget hemat (local food focus).
 */
export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  const ai = createClient();
  const model = "gemini-3-flash-preview";
  const prompt = `
    Buat ulang rencana makan 7 hari (Budget: HEMAT) untuk ${user.name} (Tujuan: ${user.goal}).
    Fokus pada bahan lokal murah yang kaya protein seperti telur, tempe, tahu, dan dada ayam jika memungkinkan.
    Format output: JSON array dari DailyDiet.
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: { type: Type.ARRAY, items: dailyDietSchema } 
    }
  });
  
  return JSON.parse(response.text.trim());
};
