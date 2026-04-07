import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { DailyRecord, Habit, formatSleepHours } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Moon, Minus, ArrowUpDown, ChevronUp, ChevronDown, Check } from "lucide-react";
import { format, subDays, isAfter, parseISO, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type MetricPeriod = "7d" | "30d" | "total";

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
  periodLabel: string;
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

/* ─── Tooltip helpers ─── */

function useChartTooltip() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeIdx === null) return;
    const handler = (e: TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveIdx(null);
      }
    };
    document.addEventListener("touchstart", handler);
    return () => document.removeEventListener("touchstart", handler);
  }, [activeIdx]);

  return { activeIdx, setActiveIdx, containerRef };
}

function formatTooltipDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEE, dd/MM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatTooltipValue(value: number, unit: string): string {
  if (unit === "h") {
    const h = Math.floor(value);
    const m = Math.round((value - h) * 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  if (unit === "min") {
    const h = Math.floor(value / 60);
    const m = Math.round(value % 60);
    return h > 0 ? `${h}h ${m}min` : `${value}min`;
  }
  const formatted = value % 1 === 0 ? String(value) : value.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}

function MiniChartTooltip({ dateStr, value, unit, style }: { dateStr: string; value: number; unit: string; style?: React.CSSProperties }) {
  return (
    <div
      className="absolute z-50 pointer-events-none px-2 py-1 rounded-lg bg-popover border border-border shadow-md text-xs text-popover-foreground whitespace-nowrap"
      style={{ transform: "translateX(-50%)", bottom: "100%", marginBottom: 6, ...style }}
    >
      <span className="font-medium">{formatTooltipDate(dateStr)}</span>
      <span className="mx-1">—</span>
      <span className="font-bold">{formatTooltipValue(value, unit)}</span>
    </div>
  );
}

/* ─── Chart Components (with tooltips) ─── */

function sparseLabels(data: any[], startDayIndex: number) {
  const len = data.length;
  if (len <= 7) return data.map((_, i) => DAY_LABELS[(startDayIndex + i) % 7]);
  const step = Math.max(Math.ceil(len / 6), 2);
  return data.map((_, i) => (i % step === 0 || i === len - 1) ? DAY_LABELS[(startDayIndex + i) % 7] : "");
}

function MiniBarChart({ data, max, color, startDayIndex, dates, unit }: { data: number[]; max: number; color: string; startDayIndex: number; dates: string[]; unit: string }) {
  const h = 48;
  const gapClass = data.length > 15 ? "gap-px" : data.length > 7 ? "gap-[2px]" : "gap-[6px]";
  const labels = sparseLabels(data, startDayIndex);
  const { activeIdx, setActiveIdx, containerRef } = useChartTooltip();
  return (
    <div className="w-full overflow-hidden" ref={containerRef} onMouseLeave={() => setActiveIdx(null)}>
      <div className={cn("flex items-end justify-between", gapClass)} style={{ height: h }}>
        {data.map((v, i) => {
          const barH = max > 0 ? Math.max((v / max) * h, 3) : 3;
          const isLast = i === data.length - 1;
          const isActive = activeIdx === i;
          return (
            <div
              key={i}
              className="flex-1 min-w-0 flex flex-col items-center gap-1 relative cursor-pointer"
              onMouseEnter={() => setActiveIdx(i)}
              onTouchStart={() => setActiveIdx(i)}
            >
              {isActive && dates[i] && (
                <MiniChartTooltip dateStr={dates[i]} value={v} unit={unit} style={{ left: "50%" }} />
              )}
              <div
                className="w-full rounded-t-md transition-opacity duration-150"
                style={{
                  height: barH,
                  backgroundColor: isActive || isLast ? color : `color-mix(in srgb, ${color} 35%, transparent)`,
                  transformOrigin: "bottom",
                  animation: `grow-bar 400ms ease-out ${i * (data.length > 15 ? 15 : 40)}ms both`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniLineChart({ data, max, color, startDayIndex, dates, unit }: { data: number[]; max: number; color: string; startDayIndex: number; dates: string[]; unit: string }) {
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

  const pathRef = useRef<SVGPathElement>(null);
  const [lineLength, setLineLength] = useState(0);
  const { activeIdx, setActiveIdx, containerRef } = useChartTooltip();

  useEffect(() => {
    if (pathRef.current) {
      setLineLength(pathRef.current.getTotalLength());
    }
  }, [data]);

  return (
    <div className="w-full relative" ref={containerRef} onMouseLeave={() => setActiveIdx(null)}>
      {activeIdx !== null && dates[activeIdx] && (
        <MiniChartTooltip
          dateStr={dates[activeIdx]}
          value={data[activeIdx]}
          unit={unit}
          style={{
            left: `${(points[activeIdx].x / w) * 100}%`,
            bottom: "auto",
            top: -6,
            position: "absolute",
            marginBottom: 0,
          }}
        />
      )}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 80 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, "")})`} />
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={lineLength > 0 ? {
            strokeDasharray: lineLength,
            strokeDashoffset: lineLength,
            animation: `draw-line 500ms ease-out forwards`,
            ["--line-length" as any]: lineLength,
          } : undefined}
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={activeIdx === i ? 5 : i === data.length - 1 ? 4 : 2.5}
              fill={activeIdx === i || i === data.length - 1 ? color : "white"} stroke={color} strokeWidth={1.5}
              style={{ transformOrigin: `${p.x}px ${p.y}px`, animation: `dot-pop 300ms ease-out ${200 + i * 50}ms both` }}
            />
            {/* Invisible hit area */}
            <circle cx={p.x} cy={p.y} r={12} fill="transparent" className="cursor-pointer"
              onMouseEnter={() => setActiveIdx(i)}
              onTouchStart={() => setActiveIdx(i)}
            />
          </g>
        ))}
      </svg>
      {(() => { const labels = sparseLabels(data, startDayIndex); return (
      <div className="flex justify-between mt-1">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {l}
          </span>
        ))}
      </div>
      ); })()}
    </div>
  );
}

function MiniBarPercentChart({ data, max, color, target, startDayIndex, dates, unit }: { data: number[]; max: number; color: string; target: number; startDayIndex: number; dates: string[]; unit: string }) {
  const h = 48;
  const showLabels = data.length <= 10;
  const gapClass = data.length > 15 ? "gap-px" : data.length > 7 ? "gap-[2px]" : "gap-[6px]";
  const labels = sparseLabels(data, startDayIndex);
  const { activeIdx, setActiveIdx, containerRef } = useChartTooltip();
  return (
    <div className="w-full overflow-hidden" ref={containerRef} onMouseLeave={() => setActiveIdx(null)}>
      <div className={cn("flex items-end justify-between", gapClass)} style={{ height: h + (showLabels ? 14 : 0) }}>
        {data.map((v, i) => {
          const barH = max > 0 ? Math.max((v / max) * h, 3) : 3;
          const pct = target > 0 ? Math.round((v / target) * 100) : 0;
          const isLast = i === data.length - 1;
          const isActive = activeIdx === i;
          return (
            <div
              key={i}
              className="flex-1 min-w-0 flex flex-col items-center relative cursor-pointer"
              onMouseEnter={() => setActiveIdx(i)}
              onTouchStart={() => setActiveIdx(i)}
            >
              {isActive && dates[i] && (
                <MiniChartTooltip dateStr={dates[i]} value={v} unit={unit} style={{ left: "50%" }} />
              )}
              {showLabels && (
                <span className="text-[8px] font-semibold mb-0.5" style={{ color: isLast ? color : "hsl(var(--muted-foreground))" }}>
                  {v > 0 ? `${pct}%` : ""}
                </span>
              )}
              <div
                className="w-full rounded-t-md transition-opacity duration-150"
                style={{
                  height: barH,
                  backgroundColor: isActive || isLast ? color : `color-mix(in srgb, ${color} 35%, transparent)`,
                  transformOrigin: "bottom",
                  animation: `grow-bar 400ms ease-out ${i * (data.length > 15 ? 15 : 40)}ms both`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniDotChart({ data, max, color, startDayIndex, dates, unit }: { data: number[]; max: number; color: string; startDayIndex: number; dates: string[]; unit: string }) {
  const cappedMaxR = data.length > 15 ? 6 : data.length > 7 ? 8 : 12;
  const minR = data.length > 15 ? 2 : 4;
  const labels = sparseLabels(data, startDayIndex);
  const { activeIdx, setActiveIdx, containerRef } = useChartTooltip();
  return (
    <div className="w-full overflow-hidden" ref={containerRef} onMouseLeave={() => setActiveIdx(null)}>
      <div className="flex items-center justify-between py-2" style={{ minHeight: 48 }}>
        {data.map((v, i) => {
          const r = max > 0 ? minR + ((v / max) * (cappedMaxR - minR)) : minR;
          const isLast = i === data.length - 1;
          const isActive = activeIdx === i;
          const emptySize = data.length > 15 ? 4 : 6;
          return (
            <div
              key={i}
              className="flex-1 min-w-0 flex justify-center relative cursor-pointer"
              onMouseEnter={() => setActiveIdx(i)}
              onTouchStart={() => setActiveIdx(i)}
            >
              {isActive && dates[i] && (
                <MiniChartTooltip dateStr={dates[i]} value={v} unit={unit} style={{ left: "50%" }} />
              )}
              <div
                className="rounded-full shrink-0 transition-all duration-150"
                style={{
                  width: v > 0 ? (isActive ? (r + 2) * 2 : r * 2) : emptySize,
                  height: v > 0 ? (isActive ? (r + 2) * 2 : r * 2) : emptySize,
                  backgroundColor: v > 0
                    ? isActive || isLast ? color : `color-mix(in srgb, ${color} 40%, transparent)`
                    : "hsl(var(--muted))",
                  border: v === 0 ? `1.5px dashed hsl(var(--muted-foreground) / 0.3)` : "none",
                  animation: `dot-pop 300ms ease-out ${i * (data.length > 15 ? 20 : 60)}ms both`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">
            {l}
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

/* ─── Metric Card (with optional reorder controls) ─── */

function MetricCard({ metric, startDayIndex, reordering, onMoveUp, onMoveDown, isFirst, isLast: isLastItem }: {
  metric: MetricItem;
  startDayIndex: number;
  reordering?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <Card className="border-border/40 shadow-sm rounded-2xl">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {reordering && (
              <div className="flex flex-col gap-0.5 shrink-0 mr-1">
                <button
                  onClick={onMoveUp}
                  disabled={isFirst}
                  className={cn(
                    "p-0.5 rounded transition-colors",
                    isFirst ? "text-muted-foreground/30" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={onMoveDown}
                  disabled={isLastItem}
                  className={cn(
                    "p-0.5 rounded transition-colors",
                    isLastItem ? "text-muted-foreground/30" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
            <span style={{ color: metric.color }} className="shrink-0">{metric.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{metric.label}</p>
              <p className="text-[10px] text-muted-foreground">{metric.periodLabel}</p>
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

/* ─── Period filter helpers ─── */

const PERIOD_OPTIONS: { value: MetricPeriod; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "total", label: "Total" },
];

function getRecordSlice(records: DailyRecord[], period: MetricPeriod): DailyRecord[] {
  if (period === "total") return records;
  const today = new Date();
  const cutoff = period === "7d" ? subDays(today, 6) : subDays(today, 29);
  return records.filter((r) => isAfter(parseISO(r.date), subDays(cutoff, 1)));
}

function getChartDates(selectedDate: string, period: MetricPeriod, records?: DailyRecord[]): string[] {
  const today = new Date(selectedDate + "T12:00:00");

  if (period === "total") {
    if (records && records.length > 0) {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      const firstDate = parseISO(sorted[0].date);
      return eachDayOfInterval({ start: firstDate, end: today }).map((d) => format(d, "yyyy-MM-dd"));
    }
    return Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), "yyyy-MM-dd"));
  }

  const numDays = period === "7d" ? 6 : 29;
  const start = subDays(today, numDays);
  return eachDayOfInterval({ start, end: today }).map((d) => format(d, "yyyy-MM-dd"));
}

function getPeriodLabel(period: MetricPeriod): string {
  if (period === "7d") return "Últimos 7 dias";
  if (period === "30d") return "Últimos 30 dias";
  return "Todo o período";
}

const STORAGE_KEY = "metrics-order";

function loadOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveOrder(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/* ─── Main Grid ─── */

export default function DailyMetricsGrid({ todayRecord, records, habits, selectedDate }: Props) {
  const [period, setPeriod] = useState<MetricPeriod>("7d");
  const [reordering, setReordering] = useState(false);
  const [customOrder, setCustomOrder] = useState<string[] | null>(() => loadOrder());

  // Save order on change
  useEffect(() => {
    if (customOrder) saveOrder(customOrder);
  }, [customOrder]);

  const filteredRecords = useMemo(() => getRecordSlice(records, period), [records, period]);
  const chartDates = useMemo(() => getChartDates(selectedDate, period, records), [selectedDate, period, records]);
  const periodLabel = getPeriodLabel(period);

  const metrics = useMemo((): (MetricItem & { id: string })[] => {
    const chartRecords = chartDates.map((d) => filteredRecords.find((r) => r.date === d));

    const trend = (a: number, b: number): "up" | "down" | "same" =>
      a > b ? "up" : a < b ? "down" : "same";
    const safeMax = (arr: number[]) => Math.max(...arr, 1);

    const items: (MetricItem & { id: string })[] = [];

    // Helper: compute previous period records for trend comparison
    const periodDays = chartDates.length;
    const todayDate = new Date(selectedDate + "T12:00:00");
    const prevStart = subDays(todayDate, periodDays * 2 - 1);
    const prevEnd = subDays(todayDate, periodDays);
    const prevRecords = records.filter((r) => {
      const d = parseISO(r.date);
      return isAfter(d, subDays(prevStart, 1)) && !isAfter(d, prevEnd);
    });

    // Sleep — show average across period
    const sleepChart = chartRecords.map((r) => r?.sleepHours || 0);
    const sleepValues = filteredRecords.filter((r) => r.sleepHours > 0).map((r) => r.sleepHours);
    const avgSleep = sleepValues.length > 0 ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length : 0;
    const prevSleepValues = prevRecords.filter((r) => r.sleepHours > 0).map((r) => r.sleepHours);
    const prevAvgSleep = prevSleepValues.length > 0 ? prevSleepValues.reduce((a, b) => a + b, 0) / prevSleepValues.length : 0;
    const sleepDiff = avgSleep - prevAvgSleep;

    items.push({
      id: "__sleep__",
      icon: <Moon size={16} />,
      value: formatSleepHours(avgSleep),
      label: "Sono",
      trend: trend(avgSleep, prevAvgSleep),
      trendLabel: sleepDiff === 0 ? "igual" : sleepDiff > 0 ? `+${sleepDiff.toFixed(1)}h` : `${sleepDiff.toFixed(1)}h`,
      color: "hsl(250, 55%, 55%)",
      last7: sleepChart,
      max7: safeMax(sleepChart),
      chartType: "bar",
      target: 8,
      unit: "h",
      periodLabel: period === "total" ? "Média geral" : `Média ${periodLabel.toLowerCase()}`,
    });

    // Dynamic habit cards
    const activeHabits = habits.filter((h) => h.active);
    activeHabits.forEach((habit, idx) => {
      const isCheck = habit.targetType === "check" && (!habit.metricType || habit.metricType === "check");
      const unit = getHabitUnit(habit);
      const target = habit.dailyGoal || habit.targetValue || 0;
      const color = getHabitColor(habit, idx);

      const chartData = chartRecords.map((r) => {
        const v = r?.habitChecks?.[habit.id];
        if (isCheck) return v === true ? 1 : 0;
        return typeof v === "number" ? v : 0;
      });

      let displayValue: string;
      let currentAggregate: number;
      let prevAggregate: number;
      let trendLabelText: string;

      if (isCheck) {
        // Count completed days / total days with records
        const completedDays = filteredRecords.filter((r) => r.habitChecks?.[habit.id] === true).length;
        const totalDays = filteredRecords.length;
        const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        displayValue = `${completedDays}/${totalDays} dias`;
        currentAggregate = pct;

        const prevCompleted = prevRecords.filter((r) => r.habitChecks?.[habit.id] === true).length;
        const prevTotal = prevRecords.length;
        prevAggregate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;
        trendLabelText = currentAggregate === prevAggregate ? "igual" : `${currentAggregate}%`;
      } else {
        // Sum total accumulated in period
        const total = filteredRecords.reduce((sum, r) => {
          const v = r.habitChecks?.[habit.id];
          return sum + (typeof v === "number" ? v : 0);
        }, 0);
        currentAggregate = total;

        const prevTotal = prevRecords.reduce((sum, r) => {
          const v = r.habitChecks?.[habit.id];
          return sum + (typeof v === "number" ? v : 0);
        }, 0);
        prevAggregate = prevTotal;

        // Format display value
        if (unit === "h" || habit.metricTimeUnit === "horas") {
          const h = Math.floor(total);
          const m = Math.round((total - h) * 60);
          displayValue = m > 0 ? `${h}h ${m}min` : `${h}h`;
        } else if (unit === "min" || habit.metricTimeUnit === "minutos") {
          const h = Math.floor(total / 60);
          const m = Math.round(total % 60);
          displayValue = h > 0 ? `${h}h ${m}min` : `${total} min`;
        } else {
          displayValue = `${total % 1 === 0 ? total : total.toFixed(1)} ${unit}`.trim();
        }
        const diff = total - prevTotal;
        trendLabelText = diff === 0 ? "igual" : diff > 0 ? `+${diff % 1 === 0 ? diff : diff.toFixed(1)}` : `${diff % 1 === 0 ? diff : diff.toFixed(1)}`;
      }

      const habitIcon = habit.icon ? <span className="text-base">{habit.icon}</span> : null;

      items.push({
        id: habit.id,
        icon: habitIcon,
        value: displayValue,
        label: habit.name,
        trend: trend(currentAggregate, prevAggregate),
        trendLabel: trendLabelText,
        color,
        last7: chartData,
        max7: safeMax(chartData),
        chartType: getChartType(habit),
        target,
        unit,
        periodLabel: period === "total" ? "Acumulado geral" : `Acumulado ${periodLabel.toLowerCase()}`,
      });
    });

    return items;
  }, [todayRecord, filteredRecords, chartDates, habits, selectedDate, periodLabel, period, records]);

  // Apply custom order
  const orderedMetrics = useMemo(() => {
    if (!customOrder) return metrics;
    const map = new Map(metrics.map((m) => [m.id, m]));
    const ordered: typeof metrics = [];
    customOrder.forEach((id) => {
      const item = map.get(id);
      if (item) {
        ordered.push(item);
        map.delete(id);
      }
    });
    // Append any new metrics not in saved order
    map.forEach((item) => ordered.push(item));
    return ordered;
  }, [metrics, customOrder]);

  const startDayIndex = useMemo(() => {
    if (chartDates.length > 0) {
      const d = new Date(chartDates[0] + "T12:00:00");
      return d.getDay();
    }
    return 1; // Monday
  }, [chartDates]);

  const moveMetric = useCallback((fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= orderedMetrics.length) return;
    const ids = orderedMetrics.map((m) => m.id);
    [ids[fromIdx], ids[toIdx]] = [ids[toIdx], ids[fromIdx]];
    setCustomOrder(ids);
  }, [orderedMetrics]);

  return (
    <div className="space-y-3">
      {/* Title row with filters and reorder */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
          Métricas de vida
        </p>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-xl p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  "px-2.5 py-1 text-[11px] rounded-lg transition-all duration-200",
                  period === opt.value
                    ? "bg-card text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setReordering((v) => !v)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              reordering
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Reordenar métricas"
          >
            {reordering ? <Check size={14} /> : <ArrowUpDown size={14} />}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {orderedMetrics.map((m, i) => (
          <MetricCard
            key={m.id}
            metric={m}
            startDayIndex={startDayIndex}
            reordering={reordering}
            onMoveUp={() => moveMetric(i, -1)}
            onMoveDown={() => moveMetric(i, 1)}
            isFirst={i === 0}
            isLast={i === orderedMetrics.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
