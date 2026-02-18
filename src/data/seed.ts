import { Habit, DailyRecord, UserProfile, MOOD_TAGS } from "@/types";
import { format, subDays } from "date-fns";

export const seedHabits: Habit[] = [
  { id: "h1", name: "Hidratação", icon: "Droplets", category: "geral", targetType: "check", active: true, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h2", name: "Treino", icon: "Dumbbell", category: "exercicio", targetType: "minutes", targetValue: 40, active: true, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h3", name: "Leitura", icon: "Book", category: "geral", targetType: "minutes", targetValue: 20, active: true, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h4", name: "Proteína no almoço", icon: "Apple", category: "geral", targetType: "check", active: true, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h5", name: "8k passos", icon: "Footprints", category: "exercicio", targetType: "check", active: true, createdAt: "2024-01-01T00:00:00Z" },
  { id: "h6", name: "Dormir antes de 23h", icon: "Moon", category: "geral", targetType: "check", active: true, createdAt: "2024-01-01T00:00:00Z" },
];

export const seedProfile: UserProfile = {
  displayName: "Você",
  mainGoal: "Melhorar energia e constância",
  focusArea: "saúde",
  preferences: { weekStartsOn: "mon", insightsTone: "direto" },
};

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

const moodValues = MOOD_TAGS.map((t) => t.value);

export function generateSeedRecords(): DailyRecord[] {
  const today = new Date();
  const records: DailyRecord[] = [];

  for (let i = 1; i <= 50; i++) {
    const date = subDays(today, i);
    const ds = format(date, "yyyy-MM-dd");

    if (seeded(ds + "skip", 0, 9) === 0) continue;

    const moodIdx = seeded(ds + "mood", 0, moodValues.length - 1);
    const mood = moodValues[moodIdx];
    const sleepHours = Number((5.5 + seeded(ds + "sleep", 0, 30) / 10).toFixed(1));
    const exerciseMinutes = seeded(ds + "ex", 0, 75);
    const waterIntake = seeded(ds + "water", 2, 8);
    const wakeHour = seeded(ds + "wakeh", 5, 9);
    const wakeMin = seeded(ds + "wakem", 0, 3) * 15;
    const wakeUpTime = `${String(wakeHour).padStart(2, "0")}:${String(wakeMin).padStart(2, "0")}`;

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
      "Cansado mas consegui manter o foco.",
      "Energia boa pela manhã, caiu à tarde.",
      "Dia difícil, precisei de mais descanso.",
    ];

    records.push({
      id: `r-${ds}`,
      date: ds,
      mood,
      wakeUpTime,
      sleepHours: Math.min(sleepHours, 12),
      waterIntake,
      exerciseMinutes: Math.min(exerciseMinutes, 240),
      habitChecks,
      noteFeeling: seeded(ds + "nf", 0, 3) === 0 ? noteTemplates[seeded(ds + "nt", 0, 3)] : undefined,
      noteProcrastination: seeded(ds + "np", 0, 5) === 0 ? "Procrastinei nas tarefas de estudo." : undefined,
      noteGratitude: seeded(ds + "ng", 0, 4) === 0 ? "Grato pela saúde e pela família." : undefined,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  }

  return records;
}
