export interface Habit {
  id: string;
  name: string;
  iconName?: string;
  color?: string;
  targetType: "check" | "minutes" | "count";
  targetValue?: number;
  active: boolean;
  order?: number;
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  date: string; // yyyy-MM-dd
  mood: number; // 1-5, 0 = not set (kept for metrics compat)
  moodLabel?: string; // "produtiva" | "feliz" | "normal" | etc.
  sleepHours: number;
  wakeUpTime?: string; // "07:00"
  waterIntake?: number; // 0-5
  exerciseMinutes: number;
  habitChecks: Record<string, boolean | number>;
  noteFeeling?: string;
  noteProcrastination?: string;
  noteGratitude?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  area: "profissional" | "pessoal" | "saúde";
  feeling?: string;
  date: string;
  createdAt: string;
}

export interface UserProfile {
  displayName: string;
  mainGoal: string;
  focusArea: string;
  preferences: {
    weekStartsOn: "mon" | "sun";
    insightsTone: "direto" | "gentil";
  };
}

export type Period = "7d" | "30d" | "total";

export const MOOD_OPTIONS = [
  { label: "produtiva", value: 5, bg: "bg-purple-100", text: "text-purple-700" },
  { label: "feliz", value: 5, bg: "bg-yellow-100", text: "text-yellow-700" },
  { label: "normal", value: 3, bg: "bg-green-100", text: "text-green-700" },
  { label: "ansiosa", value: 2, bg: "bg-orange-100", text: "text-orange-700" },
  { label: "cansada", value: 2, bg: "bg-red-100", text: "text-red-700" },
  { label: "tpm", value: 2, bg: "bg-pink-100", text: "text-pink-700" },
  { label: "emotiva", value: 2, bg: "bg-rose-100", text: "text-rose-700" },
  { label: "triste", value: 1, bg: "bg-blue-100", text: "text-blue-700" },
] as const;

export const AVAILABLE_ICONS = [
  "BookOpen", "Sun", "Moon", "Dumbbell", "Droplets", "Check",
  "Monitor", "Brain", "Heart", "Star", "Coffee", "Music",
  "Pencil", "Clock", "Flame", "Leaf", "Zap", "Target",
  "Trophy", "Smile", "Apple", "Bike", "GraduationCap", "Briefcase",
  "Pill", "Utensils", "Eye", "Headphones", "ShowerHead", "Dog",
] as const;

export const AREA_OPTIONS = [
  { label: "Profissional", value: "profissional" as const, bg: "bg-blue-100", text: "text-blue-700" },
  { label: "Pessoal", value: "pessoal" as const, bg: "bg-green-100", text: "text-green-700" },
  { label: "Saúde", value: "saúde" as const, bg: "bg-red-100", text: "text-red-700" },
] as const;
