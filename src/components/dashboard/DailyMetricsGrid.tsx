import { useMemo, useState } from "react";
import { DailyRecord, Habit, formatSleepHours } from "@/types";
import { isHabitCompleted } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Moon, Droplet, Activity, Minus, CheckSquare, ChevronUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

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
  subtitle: string;
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
        icon: <CheckSquare size={18} />,
        value: `${pct}%`,
        label: "Hábitos",
        subtitle: "Últimos 7 dias",
        trend: trend(pct, yPct),
        trendLabel: trendLabel(pct, yPct),
        color: "hsl(var(--metric-habits))",
        last7: habitLast7,
        max7: safeMax(habitLast7),
      },
      {
        icon: <Moon size={18} />,
        value: formatSleepHours(sleep),
        label: "Sono",
        subtitle: "Últimos 7 dias",
        trend: trend(sleep, ySleep),
        trendLabel:
          sleep > ySleep ? `+${(sleep - ySleep).toFixed(1)}h` : sleep < ySleep ? `${(sleep - ySleep).toFixed(1)}h` : "igual",
        color: "hsl(var(--metric-sleep))",
        last7: sleepLast7,
        max7: safeMax(sleepLast7),
      },
      {
        icon: <Droplet size={18} />,
        value: `${water}/8`,
        label: "Água",
        subtitle: "Últimos 7 dias",
        trend: trend(water, yWater),
        trendLabel: trendLabel(water, yWater),
        color: "hsl(var(--metric-water))",
        last7: waterLast7,
        max7: safeMax(waterLast7),
      },
      {
        icon: <Activity size={18} />,
        value: `${exercise}min`,
        label: "Exercício",
        subtitle: "Últimos 7 dias",
        trend: trend(exercise, yExercise),
        trendLabel: trendLabel(exercise, yExercise),
        color: "hsl(var(--metric-exercise))",
        last7: exerciseLast7,
        max7: safeMax(exerciseLast7),
      },
    ];
  }, [todayRecord, records, habits, selectedDate]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Métricas do dia
      </p>
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <ExpandableMetricCard key={i} metric={m} />
        ))}
      </div>
    </div>
  );
}

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

function BarChart({ data, max, color }: { data: number[]; max: number; color: string }) {
  const barHeight = 48;
  return (
    <div className="flex items-end justify-between gap-1 w-full" style={{ height: barHeight }}>
      {data.map((v, i) => {
        const h = max > 0 ? Math.max((v / max) * barHeight, 3) : 3;
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full max-w-[28px] rounded-md transition-all duration-300 mx-auto"
              style={{
                height: h,
                backgroundColor: isLast ? color : `color-mix(in srgb, ${color} 35%, transparent)`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ExpandableMetricCard({ metric }: { metric: MetricItem }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        {/* Header row */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span style={{ color: metric.color }}>{metric.icon}</span>
            <span className="text-sm font-semibold text-foreground">{metric.label}</span>
            <span className="text-xs text-muted-foreground">{metric.subtitle}</span>
          </div>
          <ChevronUp
            size={16}
            className={cn(
              "text-muted-foreground transition-transform duration-200",
              !expanded && "rotate-180"
            )}
          />
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Today value + trend */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Hoje</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{metric.value}</span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    metric.trend === "up" ? "text-primary-dark" : metric.trend === "down" ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {metric.trend === "up" ? <TrendingUp size={12} /> : metric.trend === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
                  {metric.trendLabel}
                </span>
              </div>
            </div>

            {/* Bar chart */}
            <BarChart data={metric.last7} max={metric.max7} color={metric.color} />
            <div className="flex justify-between">
              {DAY_LABELS.map((l, i) => (
                <span key={i} className="text-[10px] text-muted-foreground font-medium flex-1 text-center">{l}</span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
