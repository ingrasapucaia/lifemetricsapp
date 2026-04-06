import { useMemo, useState } from "react";
import { DailyRecord, Habit, formatSleepHours } from "@/types";
import { isHabitCompleted } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Moon, Minus, ChevronUp } from "lucide-react";
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

function getHabitUnit(habit: Habit): string {
  if (habit.metricUnit) return habit.metricUnit;
  switch (habit.metricType) {
    case "tempo": return habit.metricTimeUnit === "horas" ? "h" : "min";
    case "km": return "km";
    case "milhas": return "mi";
    case "calorias": return "kcal";
    case "litros": return "L";
    case "reais": return "R$";
    case "dolar": return "$";
    case "euro": return "€";
    default: break;
  }
  switch (habit.targetType) {
    case "minutes": return "min";
    case "hours_minutes": return "h";
    case "km": return "km";
    case "miles": return "mi";
    default: return "";
  }
}

function getHabitColor(habit: Habit, index: number): string {
  if (habit.color) return habit.color;
  const palette = [
    "hsl(var(--metric-sleep))",
    "hsl(160, 50%, 38%)",
    "hsl(220, 70%, 55%)",
    "hsl(340, 65%, 50%)",
    "hsl(35, 80%, 50%)",
    "hsl(270, 55%, 55%)",
  ];
  return palette[index % palette.length];
}

const HABIT_ICONS: Record<string, string> = {};

export default function DailyMetricsGrid({ todayRecord, records, habits, selectedDate }: Props) {
  const metrics = useMemo((): MetricItem[] => {
    const yesterday = format(subDays(new Date(selectedDate + "T12:00:00"), 1), "yyyy-MM-dd");
    const yesterdayRecord = records.find((r) => r.date === yesterday);

    const last7Dates = Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(selectedDate + "T12:00:00"), 6 - i), "yyyy-MM-dd")
    );
    const last7Records = last7Dates.map((d) => records.find((r) => r.date === d));

    const trend = (a: number, b: number): "up" | "down" | "same" =>
      a > b ? "up" : a < b ? "down" : "same";

    const safeMax = (arr: number[]) => Math.max(...arr, 1);

    const items: MetricItem[] = [];

    // 1. Sleep card (from daily records)
    const sleep = todayRecord?.sleepHours || 0;
    const ySleep = yesterdayRecord?.sleepHours || 0;
    const sleepLast7 = last7Records.map((r) => r?.sleepHours || 0);

    items.push({
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
    });

    // 2. Dynamic cards per active habit
    const activeHabits = habits.filter((h) => h.active);
    activeHabits.forEach((habit, idx) => {
      const todayVal = todayRecord?.habitChecks?.[habit.id];
      const yVal = yesterdayRecord?.habitChecks?.[habit.id];

      const isCheck = habit.targetType === "check" && (!habit.metricType || habit.metricType === "check");
      const unit = getHabitUnit(habit);
      const target = habit.dailyGoal || habit.targetValue || 0;
      const color = getHabitColor(habit, idx);

      let displayValue: string;
      let numericToday: number;
      let numericYesterday: number;

      if (isCheck) {
        numericToday = todayVal === true ? 1 : 0;
        numericYesterday = yVal === true ? 1 : 0;
        displayValue = numericToday ? "✓" : "—";
      } else {
        numericToday = typeof todayVal === "number" ? todayVal : 0;
        numericYesterday = typeof yVal === "number" ? yVal : 0;
        displayValue = target > 0 ? `${numericToday}/${target} ${unit}`.trim() : `${numericToday} ${unit}`.trim();
      }

      const last7 = last7Records.map((r) => {
        const v = r?.habitChecks?.[habit.id];
        if (isCheck) return v === true ? 1 : 0;
        return typeof v === "number" ? v : 0;
      });

      const habitIcon = habit.icon ? (
        <span className="text-base">{habit.icon}</span>
      ) : null;

      items.push({
        icon: habitIcon,
        value: displayValue,
        label: habit.name,
        subtitle: "Últimos 7 dias",
        trend: trend(numericToday, numericYesterday),
        trendLabel:
          numericToday === numericYesterday
            ? "igual"
            : numericToday > numericYesterday
            ? `+${numericToday - numericYesterday}`
            : `${numericToday - numericYesterday}`,
        color,
        last7,
        max7: safeMax(last7),
      });
    });

    return items;
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
