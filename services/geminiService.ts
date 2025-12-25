import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
    dayNumber: { type: Type.INTEGER, description: "1 sampai 7" },
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
    time: { type: Type.STRING, description: "Jam makan, format HH:MM (contoh: 07:00)" },
    menu: { type: Type.STRING, description: "Nama makanan dan porsi" },
    calories: { type: Type.NUMBER }
  },
  required: ["time", "menu", "calories"]
};

const dailyDietSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dayNumber: { type: Type.INTEGER, description: "1 sampai 7" },
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
    routines: {
      type: Type.ARRAY,
      items: dailyRoutineSchema,
      description: "Harus ada 7 item untuk 7 hari (Senin-Minggu)"
    },
    diet: {
      type: Type.ARRAY,
      items: dailyDietSchema,
      description: "Harus ada 7 item untuk 7 hari"
    },
    createdAt: { type: Type.STRING }
  },
  required: ["weekNumber", "overview", "routines", "diet", "createdAt"]
};

export const generateFitnessPlan = async (
  user: UserProfile, 
  weekNumber: number = 1, 
  lastFeedback?: WeeklyFeedback
): Promise<FitnessPlan> => {
  const model = "gemini-3-flash-preview";
  
  let contextPrompt = "";
  
  if (weekNumber > 1 && lastFeedback) {
    contextPrompt = `
      INI ADALAH RENCANA UNTUK MINGGU KE-${weekNumber}.
      Evaluasi Minggu Sebelumnya (Minggu ${lastFeedback.weekCompleted}):
      - Berat Badan Sekarang: ${lastFeedback.currentWeight} kg (Awal: ${user.weight} kg).
      - Feedback User: ${lastFeedback.difficultyRating} (Jika "Too Hard", kurangi intensitas. Jika "Too Easy", tambah beban/intensitas).
      - Catatan Tambahan: ${lastFeedback.notes}.
      Tolong sesuaikan rencana minggu ini berdasarkan feedback di atas.
    `;
  } else {
    contextPrompt = `INI ADALAH RENCANA UNTUK MINGGU PERTAMA.`;
  }

  const prompt = `
    Bertindak sebagai pelatih kebugaran profesional. Buat rencana latihan dan diet 7 HARI (Seminggu Penuh) yang sangat detail.
    
    DATA PENGGUNA:
    Nama: ${user.name}
    Usia: ${user.age}
    Gender: ${user.gender}
    Tinggi: ${user.height} cm
    Berat Awal: ${user.weight} kg
    Tujuan: ${user.goal}
    Alat: ${user.equipment.join(', ')}
    Kondisi Kesehatan: ${user.healthCheckStatus}, ${user.medicalHistory}

    INSTRUKSI KHUSUS:
    1. ${contextPrompt}
    2. Buat jadwal latihan untuk Hari 1 sampai Hari 7. Sertakan setidaknya 1 atau 2 hari istirahat (Rest Day) aktif.
    3. Buat jadwal makan UNTUK SETIAP HARI (Hari 1-7) dengan JAM SPESIFIK (Time) untuk setiap makan (Sarapan, Siang, Malam, Snack).
    4. Bahasa Indonesia.
    5. Gunakan format JSON raw.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: fitnessPlanSchema,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

    return JSON.parse(text) as FitnessPlan;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Gagal membuat rencana.");
  }
};

export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  const model = "gemini-3-flash-preview";

  const dietArraySchema: Schema = {
    type: Type.ARRAY,
    items: dailyDietSchema,
    description: "List diet untuk 7 hari (Array of objects)"
  };

  const prompt = `
    Buat ulang HANYA rencana diet/makan selama 7 hari (Senin-Minggu) untuk:
    ${user.name}, Tujuan: ${user.goal}, Berat: ${user.weight}kg.

    INSTRUKSI KHUSUS (LOW BUDGET):
    1. Menu HARUS MURAH & MUDAH didapat di Indonesia (Warteg/Pasar/Anak Kos).
    2. Gunakan bahan seperti: Telur, Tahu, Tempe, Sayuran Lokal, Ayam (sesekali).
    3. Hindari bahan mahal/import.
    4. Format output HARUS JSON ARRAY [ {dayNumber: 1...}, {dayNumber: 2...} ].
    5. Jangan bungkus dengan objek lain.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dietArraySchema,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    // Cleanup markdown formatting if any
    text = text.trim();
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    text = text.trim();

    return JSON.parse(text) as DailyDiet[];
  } catch (error: any) {
    console.error("Gemini API Error (Diet Only):", error);
    throw new Error("Gagal membuat menu murah.");
  }
};