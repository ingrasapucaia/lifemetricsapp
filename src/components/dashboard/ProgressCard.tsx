import { useMemo } from "react";
import { DailyRecord, Habit } from "@/types";
import { isHabitCompleted } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

interface Props {
  records: DailyRecord[];
  habits: Habit[];
  todayRecord: DailyRecord | undefined;
}

export default function ProgressCard({ records, habits, todayRecord }: Props) {
  const { pct, done, total, bestMonthPct } = useMemo(() => {
    const activeHabits = habits.filter((h) => h.active);
    const total = activeHabits.length;
    const checks = todayRecord?.habitChecks || {};
    const done = activeHabits.filter((h) => isHabitCompleted(h, checks[h.id])).length;

    // Calculate current month adherence
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: now });
    
    let currentMonthTotal = 0;
    let currentMonthDone = 0;
    daysInMonth.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const rec = records.find((r) => r.date === dateStr);
      if (rec && total > 0) {
        currentMonthTotal += total;
        currentMonthDone += activeHabits.filter((h) => isHabitCompleted(h, rec.habitChecks[h.id])).length;
      }
    });

    // Find best month historically
    const monthMap = new Map<string, { done: number; total: number }>();
    records.forEach((r) => {
      const monthKey = r.date.slice(0, 7);
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { done: 0, total: 0 });
      const entry = monthMap.get(monthKey)!;
      entry.total += total;
      entry.done += activeHabits.filter((h) => isHabitCompleted(h, r.habitChecks[h.id])).length;
    });

    let bestPct = 0;
    monthMap.forEach((v) => {
      if (v.total > 0) {
        const p = Math.round((v.done / v.total) * 100);
        if (p > bestPct) bestPct = p;
      }
    });

    const currentPct = currentMonthTotal > 0 ? Math.round((currentMonthDone / currentMonthTotal) * 100) : 0;
    const relPct = bestPct > 0 ? Math.min(Math.round((currentPct / bestPct) * 100), 100) : currentPct;

    return { pct: relPct, done, total, bestMonthPct: bestPct };
  }, [records, habits, todayRecord]);

  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card className="border-0 bg-primary/8 overflow-hidden">
      <CardContent className="p-5 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{pct}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">Você está em</p>
          <p className="text-lg font-bold text-foreground">{pct}% do seu melhor mês</p>
          <p className="text-sm text-muted-foreground mt-1">
            {done} hábitos concluídos hoje de {total}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
