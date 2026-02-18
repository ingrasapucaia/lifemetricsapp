import { useMemo } from "react";
import { DailyRecord, Habit, Period, getMoodTag, formatSleepHours, HABIT_PASTEL_COLORS } from "@/types";
import { calculatePeriodMetrics, getHabitConsistency, getChartData } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { TrendingUp, Moon, Dumbbell, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const PASTEL_BAR_COLORS = [
  "hsl(168 60% 70%)", "hsl(270 60% 75%)", "hsl(38 80% 72%)", "hsl(330 60% 75%)",
  "hsl(200 60% 72%)", "hsl(142 50% 68%)", "hsl(25 70% 72%)", "hsl(45 80% 70%)",
];

interface Props {
  records: DailyRecord[];
  habits: Habit[];
  period: Period;
  setPeriod: (p: Period) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "total", label: "Total" },
];

export default function Metrics({ records, habits, period, setPeriod }: Props) {
  const m = useMemo(() => calculatePeriodMetrics(records, habits), [records, habits]);
  const consistency = useMemo(() => getHabitConsistency(records, habits), [records, habits]);
  const chart = useMemo(() => getChartData(records, habits), [records, habits]);

  // Build habit daily data for pixel tracker
  const activeHabits = habits.filter((h) => h.active);
  const visibleHabits = activeHabits.filter((h) => h.showOnDashboard !== false);
  const sortedRecords = useMemo(() => [...records].sort((a, b) => a.date.localeCompare(b.date)), [records]);

  if (records.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-muted-foreground">Sem registros neste período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Métricas de vida</h2>
        <div className="flex bg-muted rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                period === p.value
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards - colorful pastel design */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Hábitos concluídos"
          value={`${m.avgAdherence}%`}
          bgColor="hsl(168 70% 92%)"
          iconColor="hsl(168 64% 38%)"
          sparkData={chart.map((c) => c.adherence)}
        />
        <MetricCard
          icon={<Moon size={18} />}
          label="Sono médio"
          value={formatSleepHours(m.avgSleep)}
          bgColor="hsl(270 80% 94%)"
          iconColor="hsl(270 55% 55%)"
          sparkData={chart.map((c) => c.sleep)}
        />
        <MetricCard
          icon={<Dumbbell size={18} />}
          label="Exercício total"
          value={`${m.totalExercise} min`}
          bgColor="hsl(38 100% 92%)"
          iconColor="hsl(38 90% 50%)"
          sparkData={chart.map((c) => {
            const rec = records.find((r) => format(parseISO(r.date), "dd/MM") === c.date);
            return rec?.exerciseMinutes || 0;
          })}
        />
      </div>

      {/* Habit metrics cards */}
      {visibleHabits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleHabits.map((h, idx) => {
            const color = HABIT_PASTEL_COLORS[idx % HABIT_PASTEL_COLORS.length];
            const completedDays = records.filter((r) => {
              const val = r.habitChecks[h.id];
              if (h.targetType === "check") return val === true;
              if (typeof val === "number") return h.targetValue ? val >= h.targetValue : val > 0;
              return false;
            }).length;
            const rate = records.length > 0 ? Math.round((completedDays / records.length) * 100) : 0;

            return (
              <Card key={h.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{h.name}</span>
                  </div>
                  <p className="text-lg font-bold">{rate}%</p>
                  <p className="text-[10px] text-muted-foreground">{completedDays}/{records.length} dias</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Habits bar chart with pastel colors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hábitos concluídos por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="adherence" radius={[4, 4, 0, 0]} name="Concluídos %">
                  {chart.map((_, idx) => (
                    <Cell key={idx} fill={PASTEL_BAR_COLORS[idx % PASTEL_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sleep & Mood chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sono & Humor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="sleep" tick={{ fontSize: 11 }} domain={[0, 12]} />
                <YAxis yAxisId="mood" orientation="right" tick={{ fontSize: 11 }} domain={[0, 5]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const moodEntry = payload.find((p) => p.dataKey === "mood");
                    const sleepEntry = payload.find((p) => p.dataKey === "sleep");
                    const moodTagVal = (moodEntry?.payload as any)?.moodTag;
                    const tag = moodTagVal ? getMoodTag(moodTagVal) : null;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-md text-sm space-y-1">
                        <p className="font-medium">{label}</p>
                        {tag && (
                          <p className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                              style={{ backgroundColor: `hsl(${tag.bgHsl})` }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.hsl})` }} />
                              {tag.label}
                            </span>
                          </p>
                        )}
                        {sleepEntry && <p>Sono: {formatSleepHours(Number(sleepEntry.value))}</p>}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line yAxisId="sleep" type="monotone" dataKey="sleep" stroke="hsl(220, 70%, 50%)" name="Sono (h)" strokeWidth={2} dot={false} />
                <Line
                  yAxisId="mood"
                  type="monotone"
                  dataKey="mood"
                  name="Humor"
                  strokeWidth={2}
                  stroke="hsl(270, 80%, 75%)"
                  dot={(props: any) => {
                    const tag = getMoodTag(props.payload?.moodTag);
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={tag ? `hsl(${tag.hsl})` : "hsl(270, 80%, 75%)"}
                        stroke="none"
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pixel habit tracker */}
      {consistency.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consistência dos hábitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consistency.map(({ habit, rate }, idx) => {
                const color = HABIT_PASTEL_COLORS[idx % HABIT_PASTEL_COLORS.length];
                return (
                  <div key={habit.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate max-w-[140px]">{habit.name}</span>
                      <span className={cn("text-xs font-semibold", rate >= 70 ? "text-primary" : "text-muted-foreground")}>
                        {rate}%
                      </span>
                    </div>
                    <div className="flex gap-[3px] flex-wrap">
                      {sortedRecords.map((r) => {
                        const val = r.habitChecks[habit.id];
                        const done = habit.targetType === "check"
                          ? val === true
                          : typeof val === "number" && (habit.targetValue ? val >= habit.targetValue : val > 0);
                        return (
                          <div
                            key={r.date}
                            className="w-3 h-3 rounded-[2px] transition-colors"
                            style={{
                              backgroundColor: done ? color : "hsl(var(--muted))",
                            }}
                            title={`${format(parseISO(r.date), "dd/MM")} — ${done ? "✓" : "✗"}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  bgColor,
  iconColor,
  sparkData,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  iconColor: string;
  sparkData: number[];
}) {
  const max = Math.max(...sparkData, 1);
  const points = sparkData.map((v, i) => {
    const x = (i / Math.max(sparkData.length - 1, 1)) * 60;
    const y = 20 - (v / max) * 18;
    return `${x},${y}`;
  }).join(" ");

  return (
    <Card className="overflow-hidden" style={{ backgroundColor: bgColor }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2" style={{ color: iconColor }}>
              {icon}
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
          {sparkData.length > 1 && (
            <svg width="64" height="24" className="opacity-50 mt-2">
              <polyline
                points={points}
                fill="none"
                stroke={iconColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
