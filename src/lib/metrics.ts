import { DailyRecord, Habit, Period, moodToNumber } from "@/types";
import { subDays, parseISO, isAfter, format } from "date-fns";

export function getRecordsForPeriod(records: DailyRecord[], period: Period): DailyRecord[] {
  if (period === "total") return records;
  const days = period === "7d" ? 7 : 30;
  const cutoff = subDays(new Date(), days);
  return records.filter((r) => isAfter(parseISO(r.date), cutoff));
}

export function isHabitCompleted(habit: Habit, value: boolean | number | undefined): boolean {
  if (value === undefined) return false;
  if (habit.targetType === "check") return value === true;
  if (typeof value === "number") {
    return habit.targetValue ? value >= habit.targetValue : value > 0;
  }
  return false;
}

export function calculateDailyAdherence(record: DailyRecord, habits: Habit[]): number {
  const active = habits.filter((h) => h.active);
  if (active.length === 0) return 0;
  const completed = active.filter((h) => isHabitCompleted(h, record.habitChecks[h.id])).length;
  return Math.round((completed / active.length) * 100);
}

export function calculatePeriodMetrics(records: DailyRecord[], habits: Habit[]) {
  if (records.length === 0)
    return { avgAdherence: 0, avgSleep: 0, avgMood: 0, totalExercise: 0, avgExercise: 0 };

  const adherences = records.map((r) => calculateDailyAdherence(r, habits));
  const sleeps = records.filter((r) => r.sleepHours > 0).map((r) => r.sleepHours);
  const moods = records.filter((r) => moodToNumber(r.mood) > 0).map((r) => moodToNumber(r.mood));
  const exercises = records.map((r) => r.exerciseMinutes);

  return {
    avgAdherence: Math.round(adherences.reduce((a, b) => a + b, 0) / adherences.length),
    avgSleep: sleeps.length ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : 0,
    avgMood: moods.length ? +(moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : 0,
    totalExercise: exercises.reduce((a, b) => a + b, 0),
    avgExercise: Math.round(exercises.reduce((a, b) => a + b, 0) / records.length),
  };
}

export function getHabitConsistency(records: DailyRecord[], habits: Habit[]) {
  const active = habits.filter((h) => h.active);
  return active
    .map((h) => {
      const total = records.length;
      const completed = records.filter((r) => isHabitCompleted(h, r.habitChecks[h.id])).length;
      return { habit: h, rate: total ? Math.round((completed / total) * 100) : 0 };
    })
    .sort((a, b) => b.rate - a.rate);
}

export function getChartData(records: DailyRecord[], habits: Habit[]) {
  return [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: format(parseISO(r.date), "dd/MM"),
      adherence: calculateDailyAdherence(r, habits),
      sleep: r.sleepHours,
      mood: moodToNumber(r.mood),
      moodTag: typeof r.mood === "string" ? r.mood : "",
    }));
}
