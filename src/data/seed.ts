import { Habit, DailyRecord, UserProfile, Achievement, MOOD_OPTIONS } from "@/types";
import { format, subDays } from "date-fns";

export const seedHabits: Habit[] = [
  { id: "h1", name: "Leitura", iconName: "BookOpen", targetType: "check", active: true, order: 0, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h2", name: "Meditação", iconName: "Brain", targetType: "check", active: true, order: 1, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h3", name: "Trabalho", iconName: "Briefcase", targetType: "check", active: true, order: 2, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h4", name: "Estudos", iconName: "GraduationCap", targetType: "check", active: true, order: 3, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h5", name: "Exercício", iconName: "Dumbbell", targetType: "minutes", targetValue: 40, active: true, order: 4, createdAt: "2024-01-01T00:00:00Z" },
];

export const seedProfile: UserProfile = {
  displayName: "Ingra",
  mainGoal: "Melhorar energia e constância",
  focusArea: "saúde",
  preferences: { weekStartsOn: "mon", insightsTone: "gentil" },
};

export const seedAchievements: Achievement[] = [
  { id: "a1", title: "Completei minha primeira semana de meditação", area: "pessoal", feeling: "Orgulho", date: format(subDays(new Date(), 10), "yyyy-MM-dd"), createdAt: subDays(new Date(), 10).toISOString() },
  { id: "a2", title: "Promoção no trabalho", area: "profissional", feeling: "Felicidade e gratidão", date: format(subDays(new Date(), 5), "yyyy-MM-dd"), createdAt: subDays(new Date(), 5).toISOString() },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seeded(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

export function generateSeedRecords(): DailyRecord[] {
  const today = new Date();
  const records: DailyRecord[] = [];
  const moodLabels = MOOD_OPTIONS.map((m) => m.label);

  for (let i = 1; i <= 50; i++) {
    const date = subDays(today, i);
    const ds = format(date, "yyyy-MM-dd");

    if (seeded(ds + "skip", 0, 9) === 0) continue;

    const moodIdx = seeded(ds + "mood", 0, moodLabels.length - 1);
    const moodLabel = moodLabels[moodIdx];
    const moodValue = MOOD_OPTIONS[moodIdx].value;
    const sleepHours = Number((5.5 + seeded(ds + "sleep", 0, 30) / 10).toFixed(1));
    const exerciseMinutes = seeded(ds + "ex", 0, 75);
    const wakeH = seeded(ds + "wh", 5, 9);
    const wakeM = seeded(ds + "wm", 0, 5) * 10;
    const wakeUpTime = `${String(wakeH).padStart(2, "0")}:${String(wakeM).padStart(2, "0")}`;
    const waterIntake = seeded(ds + "water", 1, 5);

    const habitChecks: Record<string, boolean | number> = {};
    seedHabits.forEach((h) => {
      if (h.targetType === "check") {
        habitChecks[h.id] = seeded(ds + h.id, 0, 100) < 75;
      } else {
        habitChecks[h.id] = seeded(ds + h.id, 0, (h.targetValue || 30) + 15);
      }
    });

    const noteTemplates = [
      "Dia produtivo, me senti bem.",
      "Cansada mas consegui manter o foco.",
      "Energia boa pela manhã, caiu à tarde.",
      "Dia difícil, precisei de mais descanso.",
    ];

    records.push({
      id: `r-${ds}`,
      date: ds,
      mood: moodValue,
      moodLabel,
      sleepHours: Math.min(sleepHours, 12),
      wakeUpTime,
      waterIntake,
      exerciseMinutes: Math.min(exerciseMinutes, 240),
      habitChecks,
      noteFeeling: seeded(ds + "nf", 0, 3) === 0 ? noteTemplates[seeded(ds + "nt", 0, 3)] : undefined,
      noteProcrastination: seeded(ds + "np", 0, 5) === 0 ? "Procrastinei nas tarefas de estudo." : undefined,
      noteGratitude: seeded(ds + "ng", 0, 4) === 0 ? "Grata pela saúde e pela família." : undefined,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  }

  return records;
}
