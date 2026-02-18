export interface Habit {
  id: string;
  name: string;
  icon?: string; // lucide icon name
  color?: string;
  category?: "geral" | "exercicio";
  targetType: "check" | "minutes" | "count" | "hours_minutes";
  targetValue?: number; // for hours_minutes, stored as total minutes
  active: boolean;
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  date: string; // yyyy-MM-dd
  mood: string; // mood tag value (e.g. "feliz", "ansiosa")
  wakeUpTime?: string; // HH:mm
  sleepHours: number;
  waterIntake: number; // 0-8 drops
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
  area: string;
  feeling: string;
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

export const MOOD_TAGS = [
  { value: "feliz", label: "Feliz", hsl: "45 90% 48%", bgHsl: "45 100% 92%" },
  { value: "produtiva", label: "Produtiva", hsl: "270 55% 55%", bgHsl: "270 80% 94%" },
  { value: "normal", label: "Normal", hsl: "145 40% 46%", bgHsl: "145 60% 92%" },
  { value: "ansiosa", label: "Ansiosa", hsl: "25 50% 40%", bgHsl: "30 60% 92%" },
  { value: "cansada", label: "Cansada", hsl: "25 80% 52%", bgHsl: "25 100% 93%" },
  { value: "emotiva", label: "Emotiva", hsl: "330 65% 55%", bgHsl: "330 80% 94%" },
  { value: "triste", label: "Triste", hsl: "200 60% 55%", bgHsl: "200 80% 93%" },
] as const;

export type MoodTagValue = typeof MOOD_TAGS[number]["value"];

export function moodToNumber(mood: string | number): number {
  if (typeof mood === "number") return mood;
  const map: Record<string, number> = {
    feliz: 5, produtiva: 4, normal: 3, emotiva: 3, ansiosa: 2, cansada: 2, triste: 1,
  };
  return map[mood] || 0;
}

export function getMoodTag(value: string | number) {
  if (typeof value === "number") {
    const legacy = ["", "triste", "ansiosa", "normal", "produtiva", "feliz"];
    return MOOD_TAGS.find((t) => t.value === legacy[value]);
  }
  return MOOD_TAGS.find((t) => t.value === value);
}

export const ACHIEVEMENT_AREAS = [
  "Profissional", "Pessoal", "Saúde", "Financeiro", "Relacionamento", "Criatividade",
] as const;

export const HABIT_ICONS = [
  "Book", "Dumbbell", "Droplets", "Apple", "Moon", "Sun", "Coffee", "Heart",
  "Brain", "Target", "Trophy", "Music", "Camera", "Pencil", "Clock", "Zap",
  "Flame", "Star", "Check", "Footprints", "Bike", "Salad", "Pill", "Glasses",
  "Headphones", "Laptop", "Smile", "Shield", "Leaf", "Mountain",
] as const;
