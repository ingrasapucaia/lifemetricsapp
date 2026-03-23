import { useMemo } from "react";
import { DailyRecord, Habit, Period, getMoodTag, formatSleepHours, HABIT_PASTEL_COLORS } from "@/types";
import { calculatePeriodMetrics, getHabitConsistency, getChartData } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { TrendingUp, Moon, Dumbbell } from "lucide-react";
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

  const activeHabits = habits.filter((h) => h.active);
  const visibleHabits = activeHabits.filter((h) => h.showOnDashboard !== false);
  const sortedRecords = useMemo(() => [...records].sort((a, b) => a.date.localeCompare(b.date)), [records]);

  // No empty state — always show cards/charts with zeroed values

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Métricas de vida</h2>
        <div className="flex bg-muted rounded-xl p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-all duration-200",
                period === p.value
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Hábitos concluídos"
          value={`${m.avgAdherence}%`}
          bgColor="hsl(var(--metric-habits-bg))"
          iconColor="hsl(var(--metric-habits))"
          sparkData={chart.map((c) => c.adherence)}
        />
        <MetricCard
          icon={<Moon size={18} />}
          label="Sono médio"
          value={formatSleepHours(m.avgSleep)}
          bgColor="hsl(var(--metric-sleep-bg))"
          iconColor="hsl(var(--metric-sleep))"
          sparkData={chart.map((c) => c.sleep)}
        />
      </div>

      {/* Dynamic exercise/habit metric cards */}
      {(() => {
        const exerciseHabits = visibleHabits.filter((h) => h.category === "exercicio");
        const cards: React.ReactNode[] = [];
        exerciseHabits.forEach((h) => {
          if (h.targetType === "minutes" || h.targetType === "hours_minutes") {
            const total = records.reduce((sum, r) => {
              const val = r.habitChecks[h.id];
              return sum + (typeof val === "number" ? val : 0);
            }, 0);
            const sparkData = sortedRecords.map((r) => typeof r.habitChecks[h.id] === "number" ? (r.habitChecks[h.id] as number) : 0);
            cards.push(
              <MetricCard
                key={h.id}
                icon={<Dumbbell size={18} />}
                label={h.name}
                value={h.targetType === "hours_minutes" ? `${Math.floor(total / 60)}h ${total % 60}min` : `${total}min`}
                bgColor="hsl(var(--metric-exercise-bg))"
                iconColor="hsl(var(--metric-exercise))"
                sparkData={sparkData}
              />
            );
          } else if (h.targetType === "km" || h.targetType === "miles") {
            const total = records.reduce((sum, r) => {
              const val = r.habitChecks[h.id];
              return sum + (typeof val === "number" ? val : 0);
            }, 0);
            const unit = h.targetType === "km" ? "km" : "mi";
            const sparkData = sortedRecords.map((r) => typeof r.habitChecks[h.id] === "number" ? (r.habitChecks[h.id] as number) : 0);
            cards.push(
              <MetricCard
                key={h.id}
                icon={<Dumbbell size={18} />}
                label={h.name}
                value={`${+total.toFixed(1)}${unit}`}
                bgColor="hsl(var(--metric-exercise-bg))"
                iconColor="hsl(var(--metric-exercise))"
                sparkData={sparkData}
              />
            );
          }
        });
        if (cards.length > 0) {
          return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{cards}</div>;
        }
        return null;
      })()}

      {/* Habit metrics cards */}
      {visibleHabits.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleHabits.map((h, idx) => {
            const color = HABIT_PASTEL_COLORS[idx % HABIT_PASTEL_COLORS.length];

            if ((h.targetType === "minutes" || h.targetType === "hours_minutes") && h.category !== "exercicio") {
              const total = records.reduce((sum, r) => {
                const val = r.habitChecks[h.id];
                return sum + (typeof val === "number" ? val : 0);
              }, 0);
              const display = h.targetType === "hours_minutes" ? `${Math.floor(total / 60)}h ${total % 60}min` : `${total}min`;
              return (
                <Card key={h.id} className="overflow-hidden border-0" style={{ backgroundColor: `${color}15` }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted-foreground truncate">{h.name}</span>
                    </div>
                    <p className="text-xl font-bold">{display}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">total no período</p>
                  </CardContent>
                </Card>
              );
            }

            if ((h.targetType === "km" || h.targetType === "miles") && h.category !== "exercicio") {
              const total = records.reduce((sum, r) => {
                const val = r.habitChecks[h.id];
                return sum + (typeof val === "number" ? val : 0);
              }, 0);
              const unit = h.targetType === "km" ? "km" : "mi";
              return (
                <Card key={h.id} className="overflow-hidden border-0" style={{ backgroundColor: `${color}15` }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted-foreground truncate">{h.name}</span>
                    </div>
                    <p className="text-xl font-bold">{+total.toFixed(1)}{unit}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">total no período</p>
                  </CardContent>
                </Card>
              );
            }

            const completedDays = records.filter((r) => {
              const val = r.habitChecks[h.id];
              if (h.targetType === "check") return val === true;
              if (typeof val === "number") return h.targetValue ? val >= h.targetValue : val > 0;
              return false;
            }).length;
            const rate = records.length > 0 ? Math.round((completedDays / records.length) * 100) : 0;

            return (
              <Card key={h.id} className="overflow-hidden border-0" style={{ backgroundColor: `${color}15` }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-muted-foreground truncate">{h.name}</span>
                  </div>
                  <p className="text-xl font-bold">{rate}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{completedDays}/{records.length} dias</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Habits bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hábitos concluídos por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="adherence" radius={[6, 6, 0, 0]} name="Concluídos %">
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="sleep" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 12]} />
                <YAxis yAxisId="mood" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 5]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const moodEntry = payload.find((p) => p.dataKey === "mood");
                    const sleepEntry = payload.find((p) => p.dataKey === "sleep");
                    const moodTagVal = (moodEntry?.payload as any)?.moodTag;
                    const tag = moodTagVal ? getMoodTag(moodTagVal) : null;
                    return (
                      <div className="bg-card border border-border rounded-xl p-3 shadow-card text-sm space-y-1.5">
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
                <Line yAxisId="sleep" type="monotone" dataKey="sleep" stroke="hsl(var(--metric-sleep))" name="Sono (h)" strokeWidth={2.5} dot={false} />
                <Line
                  yAxisId="mood"
                  type="monotone"
                  dataKey="mood"
                  name="Humor"
                  strokeWidth={2.5}
                  stroke="hsl(var(--metric-mood))"
                  dot={(props: any) => {
                    const tag = getMoodTag(props.payload?.moodTag);
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={tag ? `hsl(${tag.hsl})` : "hsl(var(--metric-mood))"}
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
            <div className="space-y-4">
              {consistency.map(({ habit, rate }, idx) => {
                const color = HABIT_PASTEL_COLORS[idx % HABIT_PASTEL_COLORS.length];
                return (
                  <div key={habit.id} className="space-y-1.5">
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
                            className="w-3.5 h-3.5 rounded-[3px] transition-colors duration-200"
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
    const x = (i / Math.max(sparkData.length - 1, 1)) * 64;
    const y = 22 - (v / max) * 20;
    return `${x},${y}`;
  }).join(" ");

  return (
    <Card className="overflow-hidden border-0" style={{ backgroundColor: bgColor }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
            >
              {icon}
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
          {sparkData.length > 1 && (
            <svg width="68" height="26" className="mt-3 opacity-60">
              <polyline
                points={points}
                fill="none"
                stroke={iconColor}
                strokeWidth="2"
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
