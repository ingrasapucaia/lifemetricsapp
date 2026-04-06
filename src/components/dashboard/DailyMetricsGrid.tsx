import { useMemo } from "react";
import { DailyRecord, Habit, formatSleepHours } from "@/types";
import { isHabitCompleted } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Moon, Droplet, Activity, Minus } from "lucide-react";
import { format, subDays } from "date-fns";

interface Props {
  todayRecord: DailyRecord | undefined;
  records: DailyRecord[];
  habits: Habit[];
  selectedDate: string;
}

interface MetricItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend: "up" | "down" | "same";
  trendLabel: string;
}

export default function DailyMetricsGrid({ todayRecord, records, habits, selectedDate }: Props) {
  const metrics = useMemo((): MetricItem[] => {
    const yesterday = format(subDays(new Date(selectedDate + "T12:00:00"), 1), "yyyy-MM-dd");
    const yesterdayRecord = records.find((r) => r.date === yesterday);

    const activeHabits = habits.filter((h) => h.active);
    const checks = todayRecord?.habitChecks || {};
    const done = activeHabits.filter((h) => isHabitCompleted(h, checks[h.id])).length;
    const total = activeHabits.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const yChecks = yesterdayRecord?.habitChecks || {};
    const yDone = activeHabits.filter((h) => isHabitCompleted(h, yChecks[h.id])).length;
    const yPct = total > 0 ? Math.round((yDone / total) * 100) : 0;

    const sleep = todayRecord?.sleepHours || 0;
    const ySleep = yesterdayRecord?.sleepHours || 0;

    const water = todayRecord?.waterIntake || 0;
    const yWater = yesterdayRecord?.waterIntake || 0;

    const exercise = todayRecord?.exerciseMinutes || 0;
    const yExercise = yesterdayRecord?.exerciseMinutes || 0;

    const trend = (a: number, b: number): "up" | "down" | "same" =>
      a > b ? "up" : a < b ? "down" : "same";

    const trendLabel = (a: number, b: number) =>
      a === b ? "igual" : a > b ? `+${a - b}` : `${a - b}`;

    return [
      {
        icon: <TrendingUp size={18} className="text-primary" />,
        value: `${pct}%`,
        label: "Hábitos",
        trend: trend(pct, yPct),
        trendLabel: trendLabel(pct, yPct),
      },
      {
        icon: <Moon size={18} style={{ color: "hsl(var(--metric-sleep))" }} />,
        value: formatSleepHours(sleep),
        label: "Sono",
        trend: trend(sleep, ySleep),
        trendLabel: sleep > ySleep ? `+${(sleep - ySleep).toFixed(1)}h` : sleep < ySleep ? `${(sleep - ySleep).toFixed(1)}h` : "igual",
      },
      {
        icon: <Droplet size={18} style={{ color: "hsl(var(--metric-water))" }} />,
        value: `${water}/8`,
        label: "Água",
        trend: trend(water, yWater),
        trendLabel: trendLabel(water, yWater),
      },
      {
        icon: <Activity size={18} style={{ color: "hsl(var(--metric-exercise))" }} />,
        value: `${exercise}min`,
        label: "Exercício",
        trend: trend(exercise, yExercise),
        trendLabel: trendLabel(exercise, yExercise),
      },
    ];
  }, [todayRecord, records, habits, selectedDate]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m, i) => (
        <Card key={i} className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              {m.icon}
              <span className={`flex items-center gap-0.5 text-[11px] font-medium ${
                m.trend === "up" ? "text-primary" : m.trend === "down" ? "text-destructive" : "text-muted-foreground"
              }`}>
                {m.trend === "up" ? <TrendingUp size={12} /> : m.trend === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
                {m.trendLabel}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
