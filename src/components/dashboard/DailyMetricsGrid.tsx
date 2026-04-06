import { useMemo, useState } from "react";
import { DailyRecord, Habit, formatSleepHours } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, ChevronUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  todayRecord: DailyRecord | undefined;
  records: DailyRecord[];
  habits: Habit[];
  selectedDate: string;
}

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

const HABIT_COLORS = [
  "hsl(168 60% 50%)",
  "hsl(270 55% 60%)",
  "hsl(38 80% 55%)",
  "hsl(330 55% 60%)",
  "hsl(200 60% 55%)",
  "hsl(142 50% 50%)",
  "hsl(25 70% 55%)",
  "hsl(45 80% 50%)",
];

function getHabitDisplayValue(habit: Habit, val: boolean | number | undefined): string {
  if (habit.targetType === "check" || habit.metricType === "check") {
    return val === true ? "✓" : "—";
  }
  const num = typeof val === "number" ? val : 0;
  const unit = habit.metricUnit || getDefaultUnit(habit);
  const goal = habit.dailyGoal || habit.targetValue;
  if (goal) return `${num}/${goal}${unit ? " " + unit : ""}`;
  return `${num}${unit ? " " + unit : ""}`;
}

function getDefaultUnit(habit: Habit): string {
  if (habit.metricType === "km" || habit.targetType === "km") return "km";
  if (habit.metricType === "milhas" || habit.targetType === "miles") return "mi";
  if (habit.metricType === "tempo" || habit.targetType === "minutes") return "min";
  if (habit.targetType === "hours_minutes") return "min";
  if (habit.metricType === "calorias") return "cal";
  if (habit.metricType === "litros") return "L";
  if (habit.metricType === "numero" || habit.targetType === "count") return "";
  return "";
}

function isHabitDone(habit: Habit, val: boolean | number | undefined): boolean {
  if (val === undefined) return false;
  if (habit.targetType === "check" || habit.metricType === "check") return val === true;
  if (typeof val === "number") {
    const goal = habit.dailyGoal || habit.targetValue;
    return goal ? val >= goal : val > 0;
  }
  return false;
}

function getHabitNumericValue(habit: Habit, val: boolean | number | undefined): number {
  if (habit.targetType === "check" || habit.metricType === "check") return val === true ? 1 : 0;
  return typeof val === "number" ? val : 0;
}

function getHabitIcon(habit: Habit): string {
  return habit.icon || "📊";
}

export default function DailyMetricsGrid({ todayRecord, records, habits, selectedDate }: Props) {
  const last7Dates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) =>
      format(subDays(new Date(selectedDate + "T12:00:00"), 6 - i), "yyyy-MM-dd")
    ), [selectedDate]);

  const last7Records = useMemo(() =>
    last7Dates.map((d) => records.find((r) => r.date === d)),
    [last7Dates, records]);

  const activeHabits = useMemo(() => habits.filter((h) => h.active), [habits]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Métricas do dia
      </p>
      <div className="space-y-3">
        {/* Sleep card */}
        <SleepMetricCard
          todayRecord={todayRecord}
          last7Records={last7Records}
        />

        {/* Dynamic habit cards */}
        {activeHabits.map((habit, idx) => (
          <HabitMetricCard
            key={habit.id}
            habit={habit}
            todayRecord={todayRecord}
            last7Records={last7Records}
            color={HABIT_COLORS[idx % HABIT_COLORS.length]}
          />
        ))}
      </div>
    </div>
  );
}

function SleepMetricCard({
  todayRecord,
  last7Records,
}: {
  todayRecord: DailyRecord | undefined;
  last7Records: (DailyRecord | undefined)[];
}) {
  const [expanded, setExpanded] = useState(true);
  const sleep = todayRecord?.sleepHours || 0;
  const goal = 8;
  const progress = Math.min((sleep / goal) * 100, 100);
  const color = "hsl(var(--metric-sleep))";

  return (
    <Card className="border-border/40 shadow-sm">
      <CardContent className="p-5">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌙</span>
            <div className="text-left">
              <span className="text-sm font-semibold text-foreground">Sono</span>
              <span className="text-xs text-muted-foreground ml-2">Últimos 7 dias</span>
            </div>
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
          <div className="mt-4 space-y-4">
            {/* Today value + progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Hoje</span>
                <span className="text-sm font-bold text-foreground">
                  {formatSleepHours(sleep)}/{goal}h
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>
            </div>

            {/* 7-day circles */}
            <div className="flex justify-between items-center">
              {last7Records.map((r, i) => {
                const val = r?.sleepHours || 0;
                const done = val >= 6;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: done ? color : "transparent",
                        border: done ? "none" : `2px solid color-mix(in srgb, ${color} 30%, transparent)`,
                      }}
                    >
                      {done && (
                        <Moon size={12} className="text-primary-foreground" style={{ color: "white" }} />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {DAY_LABELS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HabitMetricCard({
  habit,
  todayRecord,
  last7Records,
  color,
}: {
  habit: Habit;
  todayRecord: DailyRecord | undefined;
  last7Records: (DailyRecord | undefined)[];
  color: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const checks = todayRecord?.habitChecks || {};
  const todayVal = checks[habit.id];
  const displayValue = getHabitDisplayValue(habit, todayVal);

  const goal = habit.dailyGoal || habit.targetValue || 0;
  const numericVal = getHabitNumericValue(habit, todayVal);
  const isCheck = habit.targetType === "check" || habit.metricType === "check";
  const progress = isCheck
    ? (todayVal === true ? 100 : 0)
    : (goal > 0 ? Math.min((numericVal / goal) * 100, 100) : (numericVal > 0 ? 100 : 0));

  return (
    <Card className="border-border/40 shadow-sm">
      <CardContent className="p-5">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{getHabitIcon(habit)}</span>
            <div className="text-left">
              <span className="text-sm font-semibold text-foreground">{habit.name}</span>
              <span className="text-xs text-muted-foreground ml-2">Últimos 7 dias</span>
            </div>
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
          <div className="mt-4 space-y-4">
            {/* Today value + progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Hoje</span>
                <span className="text-sm font-bold text-foreground">{displayValue}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>
            </div>

            {/* 7-day circles */}
            <div className="flex justify-between items-center">
              {last7Records.map((r, i) => {
                const val = r?.habitChecks?.[habit.id];
                const done = isHabitDone(habit, val);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: done ? color : "transparent",
                        border: done ? "none" : `2px solid color-mix(in srgb, ${color} 30%, transparent)`,
                      }}
                    >
                      {done && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {DAY_LABELS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
