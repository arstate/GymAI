
export enum Gender {
  MALE = 'Laki-laki',
  FEMALE = 'Perempuan'
}

export enum Goal {
  WEIGHT_LOSS = 'Menurunkan Berat Badan',
  MUSCLE_BUILDING = 'Membentuk Otot (Bulking)',
  ABS = 'Membentuk Otot Perut',
  ENDURANCE = 'Meningkatkan Stamina',
  GENERAL_HEALTH = 'Kesehatan Umum',
  CUSTOM = 'Lainnya (Ketik Manual)'
}

export enum Equipment {
  NONE = 'Tidak ada (Bodyweight)',
  DUMBBELLS = 'Dumbbells/Barbel Kecil',
  FULL_GYM = 'Gym Lengkap',
  RESISTANCE_BANDS = 'Karet Resistensi',
  TREADMILL = 'Treadmill'
}

export enum DietBudget {
  CHEAP = 'Murah (Hemat/Anak Kos)',
  MEDIUM = 'Sedang (Wajar/Seimbang)',
  EXPENSIVE = 'Mahal (Premium/High Protein)'
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  targetWeight: number;
  weeklyTargetKg: number;
  goal: Goal | string;
  equipment: Equipment[];
  dietBudget: DietBudget;
  medicalHistory: string;
  isSmoker: boolean;
  healthCheckStatus: string;
}

export interface WeeklyFeedback {
  weekCompleted: number;
  currentWeight: number;
  difficultyRating: 'Too Easy' | 'Just Right' | 'Too Hard';
  notes: string;
}

export interface Exercise {
  name: string;
  description: string;
  imagePrompt: string; // Deskripsi untuk AI menggambar stickman
  durationSeconds?: number;
  reps?: number;
  sets?: number;
  restSeconds: number;
  tips: string;
}

export interface DailyRoutine {
  dayNumber: number;
  title: string;
  focusArea: string;
  isRestDay: boolean;
  exercises: Exercise[];
  estimatedDurationMin: number;
  isCompleted?: boolean;
}

export interface Meal {
  time: string;
  menu: string;
  calories: number;
}

export interface DailyDiet {
  dayNumber: number;
  totalCalories: number;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack1: Meal;
    snack2?: Meal;
  };
}

export interface FitnessPlan {
  weekNumber: number;
  overview: string;
  routines: DailyRoutine[];
  diet: DailyDiet[];
  createdAt: string;
}

export type AppView = 'ONBOARDING' | 'DASHBOARD' | 'WORKOUT_SESSION' | 'WEEKLY_CHECKIN';
