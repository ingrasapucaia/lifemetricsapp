import { useMemo } from "react";
import { DailyRecord, Habit, getMoodTag } from "@/types";
import { calculatePeriodMetrics, getHabitConsistency, getChartData } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { TrendingUp, Moon, Smile, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  records: DailyRecord[];
  habits: Habit[];
}

export default function Metrics({ records, habits }: Props) {
  const m = useMemo(() => calculatePeriodMetrics(records, habits), [records, habits]);
  const consistency = useMemo(() => getHabitConsistency(records, habits), [records, habits]);
  const chart = useMemo(() => getChartData(records, habits), [records, habits]);

  const top3 = consistency.slice(0, 3);
  const bottom3 = consistency.slice(-3).reverse();

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
      <h2 className="text-lg font-semibold">Métricas do período</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={<TrendingUp size={16} />} label="Hábitos concluídos" value={`${m.avgAdherence}%`} />
        <Stat icon={<Moon size={16} />} label="Sono médio" value={`${m.avgSleep}h`} />
        <Stat icon={<Smile size={16} />} label="Humor médio" value={`${m.avgMood}/5`} />
        <Stat icon={<Dumbbell size={16} />} label="Exercício total" value={`${m.totalExercise} min`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <Bar dataKey="adherence" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Concluídos %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.hsl})` }} />
                            Humor: {tag.label}
                          </p>
                        )}
                        {sleepEntry && <p>Sono: {sleepEntry.value}h</p>}
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
                  dot={(props: any) => {
                    const tag = getMoodTag(props.payload?.moodTag);
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={tag ? `hsl(${tag.hsl})` : "hsl(35, 92%, 50%)"}
                        stroke="none"
                      />
                    );
                  }}
                  stroke="hsl(35, 92%, 50%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {consistency.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consistência dos hábitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp size={12} /> Mais consistentes
                </p>
                {top3.map(({ habit, rate }) => (
                  <div key={habit.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{habit.name}</span>
                    <span className={cn("text-sm font-medium", rate >= 70 ? "text-primary" : "text-muted-foreground")}>
                      {rate}%
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Smile size={12} /> Menos consistentes
                </p>
                {bottom3.map(({ habit, rate }) => (
                  <div key={habit.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{habit.name}</span>
                    <span className={cn("text-sm font-medium", rate < 40 ? "text-destructive" : "text-muted-foreground")}>
                      {rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
