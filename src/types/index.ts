export interface Habit {
  id: string;
  name: string;
  color?: string;
  targetType: "check" | "minutes" | "count";
  targetValue?: number;
  active: boolean;
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  date: string; // yyyy-MM-dd
  mood: number; // 1-5, 0 = not set
  sleepHours: number;
  exerciseMinutes: number;
  habitChecks: Record<string, boolean | number>;
  noteFeeling?: string;
  noteProcrastination?: string;
  noteGratitude?: string;
  createdAt: string;
  updatedAt: string;
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
