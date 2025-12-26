
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FitnessPlan, WeeklyFeedback, DailyDiet, DailyRoutine, Exercise } from "../types";

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
    throw new Error("API_KEY tidak ditemukan.");
  }

  const keyToUse = keys[currentKeyIndex % keys.length];
  const ai = new GoogleGenAI({ apiKey: keyToUse });

  try {
    return await task(ai);
  } catch (error: any) {
    const errorMsg = error?.message || "";
    if ((errorMsg.includes("401") || errorMsg.includes("429")) && retries < keys.length - 1) {
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
    imagePrompt: { type: Type.STRING, description: "Prompt visual untuk stikmen gerakan ini" },
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

/**
 * Fungsi internal untuk generate gambar tutorial stikmen
 */
const generateExerciseImage = async (exerciseName: string, imagePrompt: string): Promise<string> => {
  return callGeminiWithRetry(async (ai) => {
    const finalPrompt = `Diagram tutorial stikmen 2D minimalis untuk latihan: "${exerciseName}". 
    Deskripsi gerakan: ${imagePrompt}. 
    Gaya: Garis hitam tebal di atas latar belakang putih bersih, diagram edukasi profesional, berikan panah arah gerakan, tanpa teks di dalam gambar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: finalPrompt }],
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Gagal generate gambar");
  });
};

/**
 * Generate Fitness Plan LENGKAP dengan semua gambar tutorial di awal
 */
export const generateFitnessPlan = async (
  user: UserProfile, 
  weekNumber: number = 1, 
  lastFeedback?: WeeklyFeedback, 
  onProgress?: (msg: string) => void
): Promise<FitnessPlan> => {
  // 1. Generate Struktur Teks
  onProgress?.("Sedang menyusun rencana latihan & nutrisi pintarmu...");
  const plan: FitnessPlan = await callGeminiWithRetry(async (ai) => {
    const prompt = `
      Bertindaklah sebagai Pelatih Elite Kebugaran FitGenius ID. 
      Buat jadwal 7 hari untuk ${user.name} (Tujuan: ${user.goal}, Budget Makan: ${user.dietBudget}).
      Sertakan imagePrompt yang sangat detail untuk setiap latihan agar bisa digambar sebagai stikmen tutorial.
      Format: JSON sesuai schema. Gunakan Bahasa Indonesia.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: fitnessPlanSchema
      }
    });
    
    return JSON.parse(response.text?.trim() || "{}");
  });

  // 2. Batch Generate Gambar (Agar tidak realtime saat user memakai aplikasi)
  onProgress?.("Sedang menggambar tutorial stikmen untuk semua latihan...");
  
  const uniqueExerciseMap = new Map<string, Exercise>();
  plan.routines.forEach(r => {
    if (!r.isRestDay) r.exercises.forEach(ex => uniqueExerciseMap.set(ex.name, ex));
  });

  const exercises = Array.from(uniqueExerciseMap.values());
  const imageDataMap = new Map<string, string>();

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    onProgress?.(`Menggambar tutorial: ${ex.name} (${i+1}/${exercises.length})`);
    try {
      const b64Image = await generateExerciseImage(ex.name, ex.imagePrompt);
      imageDataMap.set(ex.name, b64Image);
    } catch (e) {
      console.error(`Gagal menggambar ${ex.name}`, e);
    }
  }

  // 3. Masukkan gambar ke plan
  plan.routines.forEach(r => {
    if (!r.isRestDay) {
      r.exercises.forEach(ex => {
        ex.imageUrl = imageDataMap.get(ex.name);
      });
    }
  });

  return plan;
};

export const regenerateCheapDietPlan = async (user: UserProfile): Promise<DailyDiet[]> => {
  return callGeminiWithRetry(async (ai) => {
    const prompt = `Buat ulang rencana makan 7 hari optimal untuk budget ${user.dietBudget}. JSON array.`;
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { type: Type.ARRAY, items: dailyDietSchema } 
      }
    });
    return JSON.parse(response.text?.trim() || "[]");
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
      Anda adalah Pelatih AI FitGenius ID. 
      Tugas: Menjawab pertanyaan atau keluhan user tentang diet/latihan hari ini.
      
      Konteks User: ${user.name}, Tujuan: ${user.goal}.
      Rencana Makan Hari Ini: ${JSON.stringify(currentDiet.meals)}
      Latihan Hari Ini: ${currentRoutine.title}
      
      User bertanya: "${userQuestion}"
      
      Aturan Jawaban:
      1. Jika user melakukan kesalahan (misal: makan mi instan, gorengan, dsb), JANGAN MENGHAKIMI. Berikan solusi kompensasi yang logis (misal: tambah aktivitas fisik, kurangi porsi karbo nanti, atau minum lebih banyak air).
      2. Jika bertanya tentang minuman (kopi, teh, dsb), jelaskan pengaruhnya ke tujuan fitness.
      3. Singkat, padat, memotivasi, dan gunakan Bahasa Indonesia yang gaul tapi profesional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Aduh, otak pelatih lagi nge-blank. Tanya lagi ya!";
  });
};
