import { useMemo } from "react";
import { DailyRecord, Habit, formatSleepHours } from "@/types";
import { isHabitCompleted } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Moon, Droplet, Activity, Minus, CheckSquare } from "lucide-react";
import { format, subDays } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  color: string;
  last7: number[];
  max7: number;
}

export default function DailyMetricsGrid({ todayRecord, records, habits, selectedDate }: Props) {
  const metrics = useMemo((): MetricItem[] => {
    const yesterday = format(subDays(new Date(selectedDate + "T12:00:00"), 1), "yyyy-MM-dd");
    const yesterdayRecord = records.find((r) => r.date === yesterday);

    // Build last 7 days data
    const last7Dates = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(selectedDate + "T12:00:00"), 6 - i), "yyyy-MM-dd")
    );
    const last7Records = last7Dates.map((d) => records.find((r) => r.date === d));

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

    // Last 7 day values per metric
    const habitLast7 = last7Records.map((r) => {
      if (!r || total === 0) return 0;
      const c = r.habitChecks || {};
      return Math.round(
        (activeHabits.filter((h) => isHabitCompleted(h, c[h.id])).length / total) * 100
      );
    });
    const sleepLast7 = last7Records.map((r) => r?.sleepHours || 0);
    const waterLast7 = last7Records.map((r) => r?.waterIntake || 0);
    const exerciseLast7 = last7Records.map((r) => r?.exerciseMinutes || 0);

    const safeMax = (arr: number[]) => Math.max(...arr, 1);

    return [
      {
        icon: <CheckSquare size={16} />,
        value: `${pct}%`,
        label: "Hábitos",
        trend: trend(pct, yPct),
        trendLabel: trendLabel(pct, yPct),
        color: "hsl(var(--primary))",
        last7: habitLast7,
        max7: safeMax(habitLast7),
      },
      {
        icon: <Moon size={16} />,
        value: formatSleepHours(sleep),
        label: "Sono",
        trend: trend(sleep, ySleep),
        trendLabel:
          sleep > ySleep
            ? `+${(sleep - ySleep).toFixed(1)}h`
            : sleep < ySleep
              ? `${(sleep - ySleep).toFixed(1)}h`
              : "igual",
        color: "hsl(var(--metric-sleep))",
        last7: sleepLast7,
        max7: safeMax(sleepLast7),
      },
      {
        icon: <Droplet size={16} />,
        value: `${water}/8`,
        label: "Água",
        trend: trend(water, yWater),
        trendLabel: trendLabel(water, yWater),
        color: "hsl(var(--metric-water))",
        last7: waterLast7,
        max7: safeMax(waterLast7),
      },
      {
        icon: <Activity size={16} />,
        value: `${exercise}min`,
        label: "Exercício",
        trend: trend(exercise, yExercise),
        trendLabel: trendLabel(exercise, yExercise),
        color: "hsl(var(--metric-exercise))",
        last7: exerciseLast7,
        max7: safeMax(exerciseLast7),
      },
    ];
  }, [todayRecord, records, habits, selectedDate]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Métricas do dia
      </p>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
          {metrics.map((m, i) => (
            <MetricCard key={i} metric={m} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function MiniBarChart({ data, max, color }: { data: number[]; max: number; color: string }) {
  const barHeight = 32;
  return (
    <div className="flex items-end gap-[3px]" style={{ height: barHeight }}>
      {data.map((v, i) => {
        const h = max > 0 ? Math.max((v / max) * barHeight, 2) : 2;
        const isLast = i === data.length - 1;
        return (
          <div
            key={i}
            className="rounded-sm transition-all duration-300"
            style={{
              width: 6,
              height: h,
              backgroundColor: isLast ? color : `color-mix(in srgb, ${color} 40%, transparent)`,
            }}
          />
        );
      })}
    </div>
  );
}

function MetricCard({ metric }: { metric: MetricItem }) {
  return (
    <Card className="border-border/60 min-w-[150px] w-[150px] shrink-0">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ color: metric.color }}>{metric.icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
          <span
            className={`ml-auto flex items-center gap-0.5 text-[10px] font-medium ${
              metric.trend === "up"
                ? "text-primary"
                : metric.trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {metric.trend === "up" ? (
              <TrendingUp size={10} />
            ) : metric.trend === "down" ? (
              <TrendingDown size={10} />
            ) : (
              <Minus size={10} />
            )}
            {metric.trendLabel}
          </span>
        </div>
        <p className="text-xl font-bold tracking-tight mb-2">{metric.value}</p>
        <MiniBarChart data={metric.last7} max={metric.max7} color={metric.color} />
      </CardContent>
    </Card>
  );
}
