import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { useMeals } from "@/hooks/useMeals";
import {
  Habit, DailyRecord, Goal, LIFE_AREAS, getLifeArea, getGoalStatus,
  Period, getMoodTag, formatSleepHours, moodToNumber, HABIT_PASTEL_COLORS,
} from "@/types";
import { getRecordsForPeriod, isHabitCompleted, calculateDailyAdherence, getHabitConsistency } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LifeAreaBadge } from "@/components/LifeAreaBadge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Target, Flame, Moon, CalendarIcon, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, subDays, isAfter, isBefore, startOfDay, eachDayOfInterval, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getPeriodCutoff } from "@/lib/metrics";

type ExtPeriod = "7d" | "30d" | "total" | "custom";

const AREA_TEXT_COLORS: Record<string, string> = {
  saude: "#9FE1CB", profissional: "#B5D4F4", financeiro: "#C0DD97",
  estudos: "#CECBF6", autocuidado: "#F4C0D1", espiritualidade: "#FAC775",
  familia: "#F5C4B3", relacionamentos: "#FCDDE8", esportes: "#7BE3E6",
  hobbie: "#D4B8F0", contribuicao_social: "#D3D1C7",
};

export default function MetricsPage() {
  const { habits, records, goals } = useStore();
  
  const { meals } = useMeals();

  const [period, setPeriod] = useState<ExtPeriod>("7d");
  const [areaFilter, setAreaFilter] = useState<string>("todas");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  // Filter records by period
  const filteredRecords = useMemo(() => {
    if (period === "total") return records;
    if (period === "custom" && customStart && customEnd) {
      const s = startOfDay(customStart);
      const e = startOfDay(customEnd);
      return records.filter((r) => {
        const d = startOfDay(parseISO(r.date));
        return (isAfter(d, s) || d.getTime() === s.getTime()) &&
               (isBefore(d, e) || d.getTime() === e.getTime());
      });
    }
    const cutoff = getPeriodCutoff(period as "7d" | "30d");
    return records.filter((r) => isAfter(parseISO(r.date), subDays(cutoff, 1)));
  }, [records, period, customStart, customEnd]);

  // Active habits filtered by area
  const activeHabits = useMemo(() => {
    const active = habits.filter((h) => h.active);
    if (areaFilter === "todas") return active;
    return active.filter((h) => h.lifeArea === areaFilter);
  }, [habits, areaFilter]);

  // All active habits (unfiltered) for general metrics
  const allActiveHabits = useMemo(() => habits.filter((h) => h.active), [habits]);

  // Goals filtered by area
  const filteredGoals = useMemo(() => {
    if (areaFilter === "todas") return goals;
    return goals.filter((g) => g.lifeArea === areaFilter);
  }, [goals, areaFilter]);


  // Completed goals in period
  const completedGoals = useMemo(() => {
    return filteredGoals.filter((g) => {
      if (g.status !== "concluido" || !g.completedAt) return false;
      if (period === "total") return true;
      const d = parseISO(g.completedAt);
      if (period === "custom" && customStart && customEnd) {
        return (isAfter(d, startOfDay(customStart)) || d.getTime() === startOfDay(customStart).getTime()) &&
               (isBefore(d, startOfDay(customEnd)) || d.getTime() === startOfDay(customEnd).getTime());
      }
      const days = period === "7d" ? 7 : 30;
      return isAfter(d, subDays(new Date(), days));
    });
  }, [filteredGoals, period, customStart, customEnd]);

  // Habit adherence
  const habitRate = useMemo(() => {
    if (filteredRecords.length === 0 || activeHabits.length === 0) return 0;
    const total = filteredRecords.length * activeHabits.length;
    const done = filteredRecords.reduce((sum, r) => {
      return sum + activeHabits.filter((h) => isHabitCompleted(h, r.habitChecks[h.id])).length;
    }, 0);
    return Math.round((done / total) * 100);
  }, [filteredRecords, activeHabits]);

  // Streak
  const streak = useMemo(() => {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    for (const r of sorted) {
      const done = allActiveHabits.some((h) => isHabitCompleted(h, r.habitChecks[h.id]));
      if (done) count++;
      else break;
    }
    return count;
  }, [records, allActiveHabits]);

  // Sleep avg
  const avgSleep = useMemo(() => {
    const sleeps = filteredRecords.filter((r) => r.sleepHours > 0).map((r) => r.sleepHours);
    if (sleeps.length === 0) return 0;
    return +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1);
  }, [filteredRecords]);


  // Chart: habits per day
  const habitChartData = useMemo(() => {
    const days = getDaysInPeriod(period, customStart, customEnd, records);
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const r = filteredRecords.find((rec) => rec.date === dateStr);
      const done = r ? activeHabits.filter((h) => isHabitCompleted(h, r.habitChecks[h.id])).length : 0;
      const weekday = format(day, "EEE", { locale: ptBR });
      return { date: format(day, "dd/MM"), fullDate: `${weekday}, ${format(day, "dd/MM")}`, count: done };
    });
  }, [filteredRecords, activeHabits, period, customStart, customEnd, records]);


  // Sleep & Mood chart
  const sleepMoodChart = useMemo(() => {
    const days = getDaysInPeriod(period, customStart, customEnd, records);
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const r = filteredRecords.find((rec) => rec.date === dateStr);
      const weekday = format(day, "EEE", { locale: ptBR });
      return {
        date: format(day, "dd/MM"),
        fullDate: `${weekday}, ${format(day, "dd/MM")}`,
        sleep: r?.sleepHours || 0,
        mood: r ? moodToNumber(r.mood) : 0,
        moodTag: r?.mood || "",
      };
    });
  }, [filteredRecords, period, customStart, customEnd, records]);

  // Habit consistency
  const consistency = useMemo(() => getHabitConsistency(filteredRecords, activeHabits.length > 0 ? activeHabits : []), [filteredRecords, activeHabits]);

  // Per-habit stats
  const habitStats = useMemo(() => {
    return activeHabits.map((h) => {
      const total = filteredRecords.length;
      const completed = filteredRecords.filter((r) => isHabitCompleted(h, r.habitChecks[h.id])).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { habit: h, completed, total, rate };
    });
  }, [activeHabits, filteredRecords]);

  // Nutrition chart data
  const nutritionChartData = useMemo(() => {
    const days = getDaysInPeriod(period, customStart, customEnd, records);
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayMeals = meals.filter((m) => m.date === dateStr);
      const weekday = format(day, "EEE", { locale: ptBR });
      return {
        date: format(day, "dd/MM"),
        fullDate: `${weekday}, ${format(day, "dd/MM")}`,
        kcal: dayMeals.reduce((s, m) => s + (m.kcal || 0), 0),
        carbs: dayMeals.reduce((s, m) => s + (m.carbs_g || 0), 0),
        protein: dayMeals.reduce((s, m) => s + (m.protein_g || 0), 0),
        fat: dayMeals.reduce((s, m) => s + (m.fat_g || 0), 0),
      };
    });
  }, [meals, period, customStart, customEnd, records]);

  const avgKcal = useMemo(() => {
    const withData = nutritionChartData.filter((d) => d.kcal > 0);
    if (withData.length === 0) return 0;
    return Math.round(withData.reduce((s, d) => s + d.kcal, 0) / withData.length);
  }, [nutritionChartData]);

  const chartBarColor = areaFilter !== "todas" ? (AREA_TEXT_COLORS[areaFilter] || "hsl(168, 64%, 38%)") : "hsl(168, 64%, 38%)";
  

  const sortedRecordsForConsistency = useMemo(() => [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date)), [filteredRecords]);

  const periods: { value: ExtPeriod; label: string }[] = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "total", label: "Total" },
    { value: "custom", label: "Personalizado" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Métricas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Acompanhe sua evolução</p>
      </div>

      {/* Period filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-sm font-medium border transition-all duration-200",
                period === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border/60 hover:bg-muted/50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex gap-3 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2 text-sm">
                  <CalendarIcon size={14} />
                  {customStart ? format(customStart, "dd/MM/yyyy") : "Início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customStart} onSelect={setCustomStart} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2 text-sm">
                  <CalendarIcon size={14} />
                  {customEnd ? format(customEnd, "dd/MM/yyyy") : "Fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Area filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setAreaFilter("todas")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap shrink-0 transition-all duration-200",
              areaFilter === "todas"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border/60 hover:bg-muted/50"
            )}
          >
            Todas as áreas
          </button>
          {LIFE_AREAS.map((a) => (
            <button
              key={a.value}
              onClick={() => setAreaFilter(a.value)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-200 border",
                areaFilter === a.value
                  ? "border-transparent"
                  : "border-transparent hover:opacity-80"
              )}
              style={
                areaFilter === a.value
                  ? { backgroundColor: a.textColor, color: "#fff" }
                  : { backgroundColor: a.bgColor, color: a.textColor }
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard icon={<TrendingUp size={24} />} label="Hábitos concluídos" value={`${habitRate}%`} bgColor="hsl(168, 60%, 94%)" iconColor="hsl(168, 64%, 38%)" />
        <SummaryCard icon={<Target size={24} />} label="Metas concluídas" value={String(completedGoals.length)} bgColor="hsl(200, 60%, 94%)" iconColor="hsl(200, 60%, 50%)" />
        <SummaryCard icon={<Flame size={24} />} label="Dias consecutivos" value={String(streak)} bgColor="hsl(45, 80%, 93%)" iconColor="hsl(45, 80%, 45%)" />
        <SummaryCard icon={<Flame size={24} />} label="Dias consecutivos" value={String(streak)} bgColor="hsl(45, 80%, 93%)" iconColor="hsl(45, 80%, 45%)" />
        <SummaryCard icon={<Moon size={24} />} label="Sono médio" value={formatSleepHours(avgSleep)} bgColor="hsl(270, 60%, 95%)" iconColor="hsl(270, 50%, 58%)" />
      </div>

      {/* Habits section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Hábitos</h2>

        {habitStats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {habitStats.map(({ habit: h, completed, total, rate }) => {
              const area = getLifeArea(h.lifeArea);
              const barColor = area ? AREA_TEXT_COLORS[h.lifeArea || ""] || "hsl(168, 64%, 38%)" : "hsl(168, 64%, 38%)";
              return (
                <Card key={h.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {h.icon && /[^\x00-\x7F]/.test(h.icon) && <span className="text-2xl shrink-0">{h.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{h.name}</p>
                        {area && <LifeAreaBadge value={h.lifeArea} size="sm" className="mt-0.5" />}
                      </div>
                      <span className="text-xl font-bold shrink-0">{rate}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{completed}/{total} dias concluídos</p>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${rate}%`, backgroundColor: barColor }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhum hábito ativo{areaFilter !== "todas" ? " nesta área" : ""}</p>
            </CardContent>
          </Card>
        )}

        {/* Habits chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hábitos concluídos por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={habitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
                        <p className="font-medium capitalize">{d.fullDate}</p>
                        <p>{d.count} hábitos concluídos</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Concluídos" fill={chartBarColor} animationDuration={500} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Goals section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Metas</h2>
        {filteredGoals.length > 0 ? (
          areaFilter === "todas" ? (
            <GoalsGroupedByArea goals={filteredGoals} />
          ) : (
            <div className="space-y-2">
              {filteredGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma meta{areaFilter !== "todas" ? " nesta área" : ""}</p>
            </CardContent>
          </Card>
        )}
      </section>


      {/* Sleep & Mood */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Sono & Humor</h2>
        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sleepMoodChart}>
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
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: `hsl(${tag.bgHsl})` }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.hsl})` }} />
                            {tag.label}
                          </span>
                        )}
                        {sleepEntry && <p>Sono: {formatSleepHours(Number(sleepEntry.value))}</p>}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line yAxisId="sleep" type="monotone" dataKey="sleep" stroke="hsl(var(--metric-sleep))" name="Sono (h)" strokeWidth={2.5} dot={false} animationDuration={500} animationEasing="ease-out" activeDot={{ r: 6, strokeWidth: 2 }} />
                <Line
                  yAxisId="mood" type="monotone" dataKey="mood" name="Humor" strokeWidth={2.5} animationDuration={500} animationEasing="ease-out"
                  stroke="hsl(var(--metric-mood))"
                  dot={(props: any) => {
                    const tag = getMoodTag(props.payload?.moodTag);
                    return <circle cx={props.cx} cy={props.cy} r={4} fill={tag ? `hsl(${tag.hsl})` : "hsl(var(--metric-mood))"} stroke="none" />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Nutrition */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Nutrição</h2>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0" style={{ backgroundColor: "hsl(145, 50%, 93%)" }}>
            <CardContent className="p-4 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 mx-auto" style={{ color: "hsl(145, 50%, 35%)" }}>
                <UtensilsCrossed size={22} />
              </div>
              <p className="text-2xl font-bold">{avgKcal}</p>
              <p className="text-xs text-muted-foreground mt-1">Média kcal/dia</p>
            </CardContent>
          </Card>
          <Card className="border-0" style={{ backgroundColor: "hsl(145, 50%, 93%)" }}>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center gap-3 mb-2 mt-1">
                <span className="flex items-center gap-1 text-[11px]"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />Carb</span>
                <span className="flex items-center gap-1 text-[11px]"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f97316" }} />Prot</span>
                <span className="flex items-center gap-1 text-[11px]"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />Gord</span>
              </div>
              <div className="text-sm font-semibold space-x-3">
                <span style={{ color: "#22c55e" }}>{nutritionChartData.reduce((s, d) => s + d.carbs, 0)}g</span>
                <span style={{ color: "#f97316" }}>{nutritionChartData.reduce((s, d) => s + d.protein, 0)}g</span>
                <span style={{ color: "#3b82f6" }}>{nutritionChartData.reduce((s, d) => s + d.fat, 0)}g</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total macros no período</p>
            </CardContent>
          </Card>
        </div>

        {/* Kcal chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Calorias por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={nutritionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
                        <p className="font-medium capitalize">{d.fullDate}</p>
                        <p>{d.kcal} kcal</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="kcal" radius={[6, 6, 0, 0]} name="Calorias" fill="hsl(145, 50%, 45%)" animationDuration={500} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Macros chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Macronutrientes por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={nutritionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm space-y-1">
                        <p className="font-medium capitalize">{d.fullDate}</p>
                        <p><span style={{ color: "#22c55e" }}>Carb: {d.carbs}g</span></p>
                        <p><span style={{ color: "#f97316" }}>Prot: {d.protein}g</span></p>
                        <p><span style={{ color: "#3b82f6" }}>Gord: {d.fat}g</span></p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="carbs" stroke="#22c55e" strokeWidth={2.5} name="Carb (g)" dot={false} animationDuration={500} animationEasing="ease-out" activeDot={{ r: 6, strokeWidth: 2 }} />
                <Line type="monotone" dataKey="protein" stroke="#f97316" strokeWidth={2.5} name="Proteína (g)" dot={false} animationDuration={500} animationEasing="ease-out" activeDot={{ r: 6, strokeWidth: 2 }} />
                <Line type="monotone" dataKey="fat" stroke="#3b82f6" strokeWidth={2.5} name="Gordura (g)" dot={false} animationDuration={500} animationEasing="ease-out" activeDot={{ r: 6, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Consistência dos hábitos</h2>
        <Card>
          <CardContent className="pt-6">
            {consistency.length > 0 ? (
              <div className="space-y-4">
                {consistency.map(({ habit, rate }, idx) => {
                  const area = getLifeArea(habit.lifeArea);
                  const barColor = area ? (AREA_TEXT_COLORS[habit.lifeArea || ""] || HABIT_PASTEL_COLORS[idx % HABIT_PASTEL_COLORS.length]) : HABIT_PASTEL_COLORS[idx % HABIT_PASTEL_COLORS.length];
                  return (
                    <div key={habit.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {habit.icon && /[^\x00-\x7F]/.test(habit.icon) && <span className="text-base shrink-0">{habit.icon}</span>}
                          <span className="text-xs font-medium truncate max-w-[140px]">{habit.name}</span>
                        </div>
                        <span className={cn("text-xs font-semibold", rate >= 70 ? "text-primary" : "text-muted-foreground")}>{rate}%</span>
                      </div>
                      <div className="flex gap-[3px] flex-wrap">
                        {sortedRecordsForConsistency.map((r) => {
                          const val = r.habitChecks[habit.id];
                          const done = habit.targetType === "check" ? val === true : typeof val === "number" && (habit.targetValue ? val >= habit.targetValue : val > 0);
                          return (
                            <div
                              key={r.date}
                              className="w-3.5 h-3.5 rounded-[3px] transition-colors duration-200"
                              style={{ backgroundColor: done ? barColor : "hsl(var(--muted))" }}
                              title={`${format(parseISO(r.date), "dd/MM")} — ${done ? "✓" : "✗"}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito ativo{areaFilter !== "todas" ? " nesta área" : ""}</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ─── Helpers ────────────────────────────────

function getDaysInPeriod(period: ExtPeriod, customStart?: Date, customEnd?: Date, records?: DailyRecord[]): Date[] {
  const today = new Date();
  if (period === "custom" && customStart && customEnd) {
    return eachDayOfInterval({ start: customStart, end: customEnd });
  }
  if (period === "total") {
    if (records && records.length > 0) {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      return eachDayOfInterval({ start: parseISO(sorted[0].date), end: today });
    }
    return eachDayOfInterval({ start: subDays(today, 30), end: today });
  }
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const start = period === "7d" ? monday : subDays(monday, 21);
  return eachDayOfInterval({ start, end: today });
}

function SummaryCard({ icon, label, value, bgColor, iconColor }: {
  icon: React.ReactNode; label: string; value: string; bgColor: string; iconColor: string;
}) {
  return (
    <Card className="overflow-hidden border-0" style={{ backgroundColor: bgColor }}>
      <CardContent className="p-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 opacity-90" style={{ color: iconColor }}>
          {icon}
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function GoalCard({ goal: g }: { goal: Goal }) {
  const area = getLifeArea(g.lifeArea);
  const status = getGoalStatus(g.status);
  const totalActions = g.actions.length;
  const doneActions = g.actions.filter((a) => a.completed).length;
  const progress = totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">{g.icon || "🎯"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{g.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {area && <LifeAreaBadge value={g.lifeArea} size="sm" />}
              {status && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: status.bgColor, color: status.textColor }}>
                  {status.label}
                </span>
              )}
            </div>
          </div>
          <span className="text-sm font-semibold shrink-0">{progress}%</span>
        </div>
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {g.deadline && (
          <p className="text-[10px] text-muted-foreground mt-1.5">Prazo: {format(parseISO(g.deadline), "dd/MM/yyyy")}</p>
        )}
      </CardContent>
    </Card>
  );
}

function GoalsGroupedByArea({ goals }: { goals: Goal[] }) {
  const grouped = goals.reduce<Record<string, Goal[]>>((acc, g) => {
    const key = g.lifeArea || "_sem_area";
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const areaOrder = LIFE_AREAS.map((a) => a.value);
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "_sem_area") return 1;
    if (b === "_sem_area") return -1;
    return areaOrder.indexOf(a) - areaOrder.indexOf(b);
  });

  return (
    <div className="space-y-5">
      {sortedKeys.map((key) => {
        const area = getLifeArea(key);
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              {area && <LifeAreaBadge value={key} size="sm" />}
              {!area && <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sem área</span>}
            </div>
            <div className="space-y-2">
              {grouped[key].map((g) => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
