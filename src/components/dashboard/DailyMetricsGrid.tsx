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

type ChartType = "bar" | "line" | "bar-percent" | "dot" | "progress";

interface MetricItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend: "up" | "down" | "same";
  trendLabel: string;
  color: string;
  last7: number[];
  max7: number;
  chartType: ChartType;
  target: number;
  unit: string;
}

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getChartType(habit: Habit): ChartType {
  const mt = habit.metricType;
  if (mt === "tempo" || mt === "km" || mt === "milhas") return "line";
  if (mt === "calorias") return "bar-percent";
  if (mt === "litros" || mt === "numero" || mt === "check") return "dot";
  if (mt === "reais" || mt === "dolar" || mt === "euro") return "progress";
  return "bar";
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

/* ─── Chart Components (pure SVG) ─── */

function MiniBarChart({ data, max, color, startDayIndex }: { data: number[]; max: number; color: string; startDayIndex: number }) {
  const h = 48;
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-[6px]" style={{ height: h }}>
        {data.map((v, i) => {
          const barH = max > 0 ? Math.max((v / max) * h, 3) : 3;
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{
                  height: barH,
                  backgroundColor: isLast ? color : `color-mix(in srgb, ${color} 35%, transparent)`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {data.map((_, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {DAY_LABELS[(startDayIndex + i) % 7]}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniLineChart({ data, max, color, startDayIndex }: { data: number[]; max: number; color: string; startDayIndex: number }) {
  const w = 280;
  const h = 48;
  const pad = 8;
  const effW = w - pad * 2;
  const effH = h - pad * 2;
  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * effW,
    y: pad + effH - (max > 0 ? (v / max) * effH : 0),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, "")})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === data.length - 1 ? 4 : 2.5}
            fill={i === data.length - 1 ? color : "white"} stroke={color} strokeWidth={1.5} />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((_, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {DAY_LABELS[(startDayIndex + i) % 7]}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniBarPercentChart({ data, max, color, target, startDayIndex }: { data: number[]; max: number; color: string; target: number; startDayIndex: number }) {
  const h = 48;
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-[6px]" style={{ height: h + 14 }}>
        {data.map((v, i) => {
          const barH = max > 0 ? Math.max((v / max) * h, 3) : 3;
          const pct = target > 0 ? Math.round((v / target) * 100) : 0;
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span className="text-[8px] font-semibold mb-0.5" style={{ color: isLast ? color : "hsl(var(--muted-foreground))" }}>
                {v > 0 ? `${pct}%` : ""}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{
                  height: barH,
                  backgroundColor: isLast ? color : `color-mix(in srgb, ${color} 35%, transparent)`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {data.map((_, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {DAY_LABELS[(startDayIndex + i) % 7]}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniDotChart({ data, max, color, startDayIndex }: { data: number[]; max: number; color: string; startDayIndex: number }) {
  const maxR = 12;
  const minR = 4;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-2" style={{ minHeight: 48 }}>
        {data.map((v, i) => {
          const r = max > 0 ? minR + ((v / max) * (maxR - minR)) : minR;
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex justify-center">
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: v > 0 ? r * 2 : 6,
                  height: v > 0 ? r * 2 : 6,
                  backgroundColor: v > 0
                    ? isLast ? color : `color-mix(in srgb, ${color} 40%, transparent)`
                    : "hsl(var(--muted))",
                  border: v === 0 ? `1.5px dashed hsl(var(--muted-foreground) / 0.3)` : "none",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        {data.map((_, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {DAY_LABELS[(startDayIndex + i) % 7]}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="w-full space-y-1 py-2">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>{target}</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-center text-[10px] font-semibold" style={{ color }}>
        {Math.round(pct)}%
      </p>
    </div>
  );
}

/* ─── Metric Card ─── */

function MetricCard({ metric, startDayIndex }: { metric: MetricItem; startDayIndex: number }) {
  return (
    <Card className="border-border/40 shadow-sm rounded-2xl">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span style={{ color: metric.color }} className="shrink-0">{metric.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{metric.label}</p>
              <p className="text-[10px] text-muted-foreground">Últimos 7 dias</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-foreground leading-none">{metric.value}</p>
            <span
              className={cn(
                "flex items-center justify-end gap-0.5 text-[10px] font-medium mt-0.5",
                metric.trend === "up" ? "text-emerald-600" : metric.trend === "down" ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {metric.trend === "up" ? <TrendingUp size={10} /> : metric.trend === "down" ? <TrendingDown size={10} /> : <Minus size={10} />}
              {metric.trendLabel}
            </span>
          </div>
        </div>

        {/* Chart */}
        {metric.chartType === "line" && (
          <MiniLineChart data={metric.last7} max={metric.max7} color={metric.color} startDayIndex={startDayIndex} />
        )}
        {metric.chartType === "bar" && (
          <MiniBarChart data={metric.last7} max={metric.max7} color={metric.color} startDayIndex={startDayIndex} />
        )}
        {metric.chartType === "bar-percent" && (
          <MiniBarPercentChart data={metric.last7} max={metric.max7} color={metric.color} target={metric.target} startDayIndex={startDayIndex} />
        )}
        {metric.chartType === "dot" && (
          <MiniDotChart data={metric.last7} max={metric.max7} color={metric.color} startDayIndex={startDayIndex} />
        )}
        {metric.chartType === "progress" && (
          <MiniProgressBar value={metric.last7[metric.last7.length - 1] || 0} target={metric.target} color={metric.color} />
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Grid ─── */

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

    // Sleep
    const sleep = todayRecord?.sleepHours || 0;
    const ySleep = yesterdayRecord?.sleepHours || 0;
    const sleepLast7 = last7Records.map((r) => r?.sleepHours || 0);
    const sleepDiff = sleep - ySleep;

    items.push({
      icon: <Moon size={16} />,
      value: formatSleepHours(sleep),
      label: "Sono",
      trend: trend(sleep, ySleep),
      trendLabel: sleepDiff === 0 ? "igual" : sleepDiff > 0 ? `+${sleepDiff.toFixed(1)}h` : `${sleepDiff.toFixed(1)}h`,
      color: "hsl(250, 55%, 55%)",
      last7: sleepLast7,
      max7: safeMax(sleepLast7),
      chartType: "bar",
      target: 8,
      unit: "h",
    });

    // Dynamic habit cards
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

      const habitIcon = habit.icon ? <span className="text-base">{habit.icon}</span> : null;
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
        chartType: getChartType(habit),
        target,
        unit,
      });
    });

    return items;
  }, [todayRecord, records, habits, selectedDate]);

  // Calculate start day index for labels
  const startDayIndex = useMemo(() => {
    const d = subDays(new Date(selectedDate + "T12:00:00"), 6);
    return d.getDay();
  }, [selectedDate]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Métricas do dia
      </p>
      <div className="flex flex-col gap-3">
        {metrics.map((m, i) => (
          <MetricCard key={i} metric={m} startDayIndex={startDayIndex} />
        ))}
      </div>
    </div>
  );
}
