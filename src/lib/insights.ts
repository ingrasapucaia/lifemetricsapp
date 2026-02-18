import { DailyRecord, Habit, UserProfile, moodToNumber } from "@/types";
import { calculateDailyAdherence, isHabitCompleted, getHabitConsistency } from "./metrics";

export function generateDaySummary(
  today: DailyRecord | undefined,
  habits: Habit[],
  avgSleep: number,
  avgMood: number,
  tone: "direto" | "gentil"
): string[] {
  if (!today) return ["Nenhum registro para hoje ainda. Faça seu check-in!"];

  const bullets: string[] = [];
  const p = tone === "gentil" ? "✨ " : "• ";
  const moodNum = moodToNumber(today.mood);

  if (moodNum > 0) {
    if (moodNum >= 4) bullets.push(p + "Humor acima da média — bom sinal!");
    else if (moodNum <= 2) bullets.push(p + "Humor baixo hoje. Cuide-se.");
    else bullets.push(p + "Humor dentro do normal.");
  }

  if (today.sleepHours > 0) {
    if (today.sleepHours < avgSleep - 0.5) bullets.push(p + `Sono abaixo da sua média (${avgSleep}h).`);
    else if (today.sleepHours > avgSleep + 0.5) bullets.push(p + "Dormiu mais que o habitual — ótimo!");
    else bullets.push(p + "Sono dentro da média.");
  }

  const adh = calculateDailyAdherence(today, habits);
  if (adh >= 80) bullets.push(p + "Taxa alta de hábitos concluídos hoje!");
  else if (adh >= 50) bullets.push(p + "Hábitos concluídos parcialmente — alguns ficaram de fora.");
  else if (adh > 0) bullets.push(p + "Poucos hábitos concluídos hoje.");

  if (today.exerciseMinutes > 30) bullets.push(p + `${today.exerciseMinutes} min de exercício — excelente!`);
  else if (today.exerciseMinutes > 0) bullets.push(p + `${today.exerciseMinutes} min de exercício hoje.`);

  return bullets.length > 0 ? bullets : [p + "Complete seu check-in para ver o resumo."];
}

export function generateMicroOrientations(
  records: DailyRecord[],
  habits: Habit[],
  profile: UserProfile
): string[] {
  const suggestions: string[] = [];
  const t = profile.preferences.insightsTone;
  const recent = records.slice(0, 5);

  const lowSleep = recent.filter((r) => r.sleepHours > 0 && r.sleepHours < 6.5);
  if (lowSleep.length >= 2) {
    suggestions.push(
      t === "gentil"
        ? "Seu sono tem ficado curto. Que tal definir um alarme para começar a desligar às 22h?"
        : "Sono abaixo de 6.5h por 2+ dias. Defina horário-alvo de dormir."
    );
  }

  const lowMoodNoEx = recent.filter((r) => moodToNumber(r.mood) > 0 && moodToNumber(r.mood) <= 2 && r.exerciseMinutes === 0);
  if (lowMoodNoEx.length >= 1) {
    suggestions.push(
      t === "gentil"
        ? "Nos dias de humor mais baixo, uma caminhada curta pode ajudar bastante."
        : "Humor baixo sem exercício. Tente 15 min de caminhada amanhã."
    );
  }

  const consistency = getHabitConsistency(records, habits);
  if (consistency.length > 0) {
    const weakest = consistency[consistency.length - 1];
    if (weakest.rate < 40) {
      suggestions.push(
        t === "gentil"
          ? `"${weakest.habit.name}" está difícil? Tente uma versão mínima amanhã.`
          : `"${weakest.habit.name}" com ${weakest.rate}%. Reduza a meta para versão mínima.`
      );
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(
      t === "gentil"
        ? "Tudo parece bem! Continue mantendo sua rotina."
        : "Sem alertas. Mantenha o ritmo atual."
    );
  }

  return suggestions.slice(0, 3);
}

export function generatePeriodPatterns(records: DailyRecord[], habits: Habit[]): string[] {
  if (records.length < 5) return ["Registre mais dias para ver padrões."];

  const patterns: string[] = [];

  const goodSleep = records.filter((r) => r.sleepHours >= 7 && moodToNumber(r.mood) > 0);
  const badSleep = records.filter((r) => r.sleepHours > 0 && r.sleepHours < 7 && moodToNumber(r.mood) > 0);

  if (goodSleep.length > 2 && badSleep.length > 2) {
    const avgGood = goodSleep.reduce((a, r) => a + moodToNumber(r.mood), 0) / goodSleep.length;
    const avgBad = badSleep.reduce((a, r) => a + moodToNumber(r.mood), 0) / badSleep.length;
    if (avgGood - avgBad > 0.3) {
      patterns.push(
        `Nos dias com 7h+ de sono, seu humor sobe ${(avgGood - avgBad).toFixed(1)} pontos em média.`
      );
    }
  }

  const withEx = records.filter((r) => r.exerciseMinutes >= 20);
  const noEx = records.filter((r) => r.exerciseMinutes < 20);

  if (withEx.length > 2 && noEx.length > 2) {
    const adhEx =
      withEx.map((r) => calculateDailyAdherence(r, habits)).reduce((a, b) => a + b, 0) / withEx.length;
    const adhNoEx =
      noEx.map((r) => calculateDailyAdherence(r, habits)).reduce((a, b) => a + b, 0) / noEx.length;
    if (adhEx - adhNoEx > 10) {
      patterns.push(`Dias com exercício têm ${Math.round(adhEx - adhNoEx)}% mais hábitos concluídos.`);
    }
  }

  if (patterns.length === 0) {
    patterns.push("Continue registrando para detectar mais padrões.");
  }

  return patterns.slice(0, 2);
}
