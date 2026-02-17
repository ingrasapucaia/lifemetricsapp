import { useMemo } from "react";
import { DailyRecord, Habit } from "@/types";
import { calculatePeriodMetrics, getHabitConsistency, getChartData } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<TrendingUp size={16} />} label="Aderência" value={`${m.avgAdherence}%`} />
        <Stat icon={<Moon size={16} />} label="Sono médio" value={`${m.avgSleep}h`} />
        <Stat icon={<Smile size={16} />} label="Humor médio" value={`${m.avgMood}/5`} />
        <Stat icon={<Dumbbell size={16} />} label="Exercício total" value={`${m.totalExercise} min`} />
      </div>

      {/* Sleep & Mood Area Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sono & Humor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(220, 70%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(35, 92%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(35, 92%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(0, 0%, 64%)" />
              <YAxis yAxisId="sleep" tick={{ fontSize: 11 }} domain={[0, 12]} stroke="hsl(0, 0%, 64%)" />
              <YAxis yAxisId="mood" orientation="right" tick={{ fontSize: 11 }} domain={[0, 5]} stroke="hsl(0, 0%, 64%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(0, 0%, 91%)",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Area yAxisId="sleep" type="monotone" dataKey="sleep" stroke="hsl(220, 70%, 50%)" fill="url(#sleepGrad)" name="Sono (h)" strokeWidth={2} />
              <Area yAxisId="mood" type="monotone" dataKey="mood" stroke="hsl(35, 92%, 50%)" fill="url(#moodGrad)" name="Humor" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {consistency.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consistência dos hábitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Mais consistentes</p>
                {top3.map(({ habit, rate }) => (
                  <div key={habit.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{habit.name}</span>
                    <span className={cn("text-sm font-medium", rate >= 70 ? "text-foreground" : "text-muted-foreground")}>
                      {rate}%
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Menos consistentes</p>
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
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
