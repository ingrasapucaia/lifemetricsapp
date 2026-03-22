export interface Habit {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  category?: "geral" | "exercicio";
  targetType: "check" | "minutes" | "count" | "hours_minutes" | "km" | "miles";
  targetValue?: number;
  active: boolean;
  showOnDashboard?: boolean;
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  date: string;
  mood: string;
  wakeUpTime?: string;
  sleepTime?: string;
  sleepHours: number;
  waterIntake: number;
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
  icon?: string;
  date: string;
  createdAt: string;
  goalId?: string;
  origin?: "meta" | "manual";
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

export interface GoalAction {
  id: string;
  title: string;
  completed: boolean;
  priority?: "importante" | "urgente" | "atrasado" | "proximo";
  createdAt: string;
}

export type GoalStatus = "nao_comecei" | "em_progresso" | "pausado" | "atrasado" | "concluido" | "arquivada";

export interface Goal {
  id: string;
  title: string;
  icon?: string;
  type: "meta" | "projeto";
  status: GoalStatus;
  lifeArea?: string;
  reward?: string;
  alignedWithGoal: boolean;
  completedAt?: string;
  actions: GoalAction[];
  createdAt: string;
  deadline?: string;
}

// ──────────────── Life Areas ────────────────

export interface LifeArea {
  value: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export const LIFE_AREAS: LifeArea[] = [
  { value: "saude", label: "Saúde", bgColor: "#D1F0E0", textColor: "#0F6E56" },
  { value: "profissional", label: "Profissional", bgColor: "#D6E8FA", textColor: "#185FA5" },
  { value: "financeiro", label: "Financeiro", bgColor: "#D4EDDA", textColor: "#3B6D11" },
  { value: "estudos", label: "Estudos", bgColor: "#E8E4FB", textColor: "#4A3F9F" },
  { value: "autocuidado", label: "Autocuidado", bgColor: "#FAE0EC", textColor: "#99335A" },
  { value: "espiritualidade", label: "Espiritualidade", bgColor: "#FDF3DC", textColor: "#7A5C00" },
  { value: "familia", label: "Família", bgColor: "#FFE8D6", textColor: "#8B3A0F" },
  { value: "relacionamentos", label: "Relacionamentos", bgColor: "#FCDDE8", textColor: "#8C2E52" },
  { value: "esportes", label: "Esportes", bgColor: "#D0F0F5", textColor: "#0A6B7C" },
  { value: "hobbie", label: "Hobbie", bgColor: "#EDE4FB", textColor: "#5B3BA0" },
  { value: "contribuicao_social", label: "Contribuição social", bgColor: "#E8E5E0", textColor: "#5A5550" },
];

export function getLifeArea(value?: string): LifeArea | undefined {
  return LIFE_AREAS.find((a) => a.value === value);
}

// ──────────────── Goal Status ────────────────

export interface GoalStatusConfig {
  value: GoalStatus;
  label: string;
  bgColor: string;
  textColor: string;
}

export const GOAL_STATUSES: GoalStatusConfig[] = [
  { value: "nao_comecei", label: "Não comecei", bgColor: "#F1EFE8", textColor: "#5F5E5A" },
  { value: "em_progresso", label: "Em progresso", bgColor: "#D6E8FA", textColor: "#185FA5" },
  { value: "pausado", label: "Pausado", bgColor: "#FDF3DC", textColor: "#7A5C00" },
  { value: "atrasado", label: "Atrasado", bgColor: "#FCEBEB", textColor: "#A32D2D" },
  { value: "concluido", label: "Concluído", bgColor: "#D1F0E0", textColor: "#0F6E56" },
];

export function getGoalStatus(value?: GoalStatus): GoalStatusConfig | undefined {
  return GOAL_STATUSES.find((s) => s.value === value);
}

// Status sort order for grouping
export const STATUS_SORT_ORDER: GoalStatus[] = [
  "em_progresso", "nao_comecei", "pausado", "atrasado", "concluido",
];

// ──────────────── Action Priority ────────────────

export const GOAL_PRIORITY_COLORS: Record<string, { hsl: string; bgHsl: string }> = {
  importante: { hsl: "142 50% 45%", bgHsl: "142 60% 90%" },
  urgente: { hsl: "25 80% 50%", bgHsl: "25 70% 90%" },
  atrasado: { hsl: "0 60% 50%", bgHsl: "0 60% 90%" },
  proximo: { hsl: "45 80% 45%", bgHsl: "45 80% 90%" },
};

// Legacy compat - kept for old references
export const GOAL_STATUS_COLORS: Record<string, { hsl: string; bgHsl: string }> = {
  "começar": { hsl: "200 60% 50%", bgHsl: "200 60% 92%" },
  "em progresso": { hsl: "45 80% 45%", bgHsl: "45 80% 90%" },
  "concluída": { hsl: "142 50% 45%", bgHsl: "142 60% 90%" },
  "arquivada": { hsl: "0 0% 50%", bgHsl: "0 0% 92%" },
};

// ──────────────── Mood & Achievements ────────────────

export type Period = "7d" | "30d" | "total";

export const MOOD_TAGS = [
  { value: "feliz", label: "Feliz", hsl: "45 90% 48%", bgHsl: "45 100% 92%" },
  { value: "produtiva", label: "Produtividade", hsl: "270 55% 55%", bgHsl: "270 80% 94%" },
  { value: "normal", label: "Normal", hsl: "145 40% 46%", bgHsl: "145 60% 92%" },
  { value: "ansiosa", label: "Ansiedade", hsl: "25 50% 40%", bgHsl: "30 60% 92%" },
  { value: "cansada", label: "Cansaço", hsl: "25 80% 52%", bgHsl: "25 100% 93%" },
  { value: "emotiva", label: "Emocional", hsl: "330 65% 55%", bgHsl: "330 80% 94%" },
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

export const ACHIEVEMENT_AREA_COLORS: Record<string, { hsl: string; bgHsl: string }> = {
  "Profissional": { hsl: "217 70% 50%", bgHsl: "217 80% 93%" },
  "Pessoal": { hsl: "142 60% 45%", bgHsl: "142 70% 92%" },
  "Saúde": { hsl: "168 64% 38%", bgHsl: "168 70% 92%" },
  "Financeiro": { hsl: "38 90% 50%", bgHsl: "38 100% 92%" },
  "Relacionamento": { hsl: "330 65% 55%", bgHsl: "330 80% 93%" },
  "Criatividade": { hsl: "270 50% 55%", bgHsl: "270 70% 93%" },
};

export const HABIT_ICONS = [
  "Book", "Dumbbell", "Droplets", "Apple", "Moon", "Sun", "Coffee", "Heart",
  "Brain", "Target", "Trophy", "Music", "Camera", "Pencil", "Clock", "Zap",
  "Flame", "Star", "Check", "Footprints", "Bike", "Salad", "Pill", "Glasses",
  "Headphones", "Laptop", "Smile", "Shield", "Leaf", "Mountain",
] as const;

export const HABIT_PASTEL_COLORS = [
  "hsl(168 60% 70%)", "hsl(270 60% 75%)", "hsl(38 80% 72%)", "hsl(330 60% 75%)",
  "hsl(200 60% 72%)", "hsl(142 50% 68%)", "hsl(25 70% 72%)", "hsl(45 80% 70%)",
  "hsl(217 60% 72%)", "hsl(0 60% 75%)",
];

export function formatSleepHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
