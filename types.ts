export enum Gender {
  MALE = 'Laki-laki',
  FEMALE = 'Perempuan'
}

export enum Goal {
  WEIGHT_LOSS = 'Menurunkan Berat Badan',
  MUSCLE_BUILDING = 'Membentuk Otot (Bulking)',
  ABS = 'Membentuk Otot Perut',
  ENDURANCE = 'Meningkatkan Stamina',
  GENERAL_HEALTH = 'Kesehatan Umum'
}

export enum Equipment {
  NONE = 'Tidak ada (Bodyweight)',
  DUMBBELLS = 'Dumbbells/Barbel Kecil',
  FULL_GYM = 'Gym Lengkap',
  RESISTANCE_BANDS = 'Karet Resistensi',
  TREADMILL = 'Treadmill'
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  goal: Goal;
  equipment: Equipment[];
  medicalHistory: string;
  isSmoker: boolean;
  healthCheckStatus: string;
}

export interface WeeklyFeedback {
  weekCompleted: number;
  currentWeight: number;
  difficultyRating: 'Too Easy' | 'Just Right' | 'Too Hard';
  notes: string; // Cedera baru atau keluhan
}

export interface Exercise {
  name: string;
  description: string;
  durationSeconds?: number;
  reps?: number;
  sets?: number;
  restSeconds: number;
  tips: string;
}

export interface DailyRoutine {
  dayNumber: number; // 1 - 7
  title: string; // e.g., "Leg Day" or "Rest Day"
  focusArea: string;
  isRestDay: boolean;
  exercises: Exercise[]; // Empty if rest day
  estimatedDurationMin: number;
  isCompleted?: boolean;
}

export interface Meal {
  time: string; // e.g., "07:00"
  menu: string;
  calories: number;
}

export interface DailyDiet {
  dayNumber: number; // 1 - 7
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
  routines: DailyRoutine[]; // Array of 7 days
  diet: DailyDiet[]; // Array of 7 days
  createdAt: string;
}

export type AppView = 'ONBOARDING' | 'DASHBOARD' | 'WORKOUT_SESSION' | 'WEEKLY_CHECKIN';