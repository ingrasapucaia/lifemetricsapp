import { useMemo } from "react";
import { DailyRecord, Habit, formatSleepHours } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Moon, Minus } from "lucide-react";
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
    "hsl(160, 50%, 38%)",
    "hsl(270, 55%, 55%)",
    "hsl(220, 70%, 55%)",
    "hsl(340, 65%, 50%)",
    "hsl(35, 80%, 50%)",
    "hsl(190, 60%, 45%)",
  ];
  return palette[index % palette.length];
}

function MiniBarChart({ data, max, color }: { data: number[]; max: number; color: string }) {
  const barHeight = 36;
  return (
    <div className="flex items-end justify-between gap-[3px] w-full" style={{ height: barHeight }}>
      {data.map((v, i) => {
        const h = max > 0 ? Math.max((v / max) * barHeight, 2) : 2;
        const isLast = i === data.length - 1;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-300"
            style={{
              height: h,
              backgroundColor: isLast ? color : `color-mix(in srgb, ${color} 40%, transparent)`,
            }}
          />
        );
      })}
    </div>
  );
}

function CompactMetricCard({ metric }: { metric: MetricItem }) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardContent className="p-3 space-y-2">
        {/* Header: icon + name + trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span style={{ color: metric.color }} className="shrink-0">{metric.icon}</span>
            <span className="text-xs font-semibold text-foreground truncate">{metric.label}</span>
          </div>
          <span
            className={cn(
              "flex items-center gap-0.5 text-[10px] font-medium shrink-0",
              metric.trend === "up" ? "text-primary-dark" : metric.trend === "down" ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {metric.trend === "up" ? <TrendingUp size={10} /> : metric.trend === "down" ? <TrendingDown size={10} /> : <Minus size={10} />}
            {metric.trendLabel}
          </span>
        </div>

        {/* Value */}
        <p className="text-xl font-bold text-foreground leading-none">{metric.value}</p>

        {/* Mini bar chart */}
        <MiniBarChart data={metric.last7} max={metric.max7} color={metric.color} />
      </CardContent>
    </Card>
  );
}

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

    // 1. Sleep card
    const sleep = todayRecord?.sleepHours || 0;
    const ySleep = yesterdayRecord?.sleepHours || 0;
    const sleepLast7 = last7Records.map((r) => r?.sleepHours || 0);
    const sleepDiff = sleep - ySleep;

    items.push({
      icon: <Moon size={14} />,
      value: formatSleepHours(sleep),
      label: "Sono",
      trend: trend(sleep, ySleep),
      trendLabel: sleepDiff === 0 ? "igual" : sleepDiff > 0 ? `+${sleepDiff.toFixed(1)}h` : `${sleepDiff.toFixed(1)}h`,
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
        <span className="text-sm">{habit.icon}</span>
      ) : null;

      const diff = numericToday - numericYesterday;

      items.push({
        icon: habitIcon,
        value: displayValue,
        label: habit.name,
        trend: trend(numericToday, numericYesterday),
        trendLabel: diff === 0 ? "igual" : diff > 0 ? `+${diff}` : `${diff}`,
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
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <CompactMetricCard key={i} metric={m} />
        ))}
      </div>
    </div>
  );
}