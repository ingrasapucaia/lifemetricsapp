import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { Period } from "@/types";
import { getRecordsForPeriod, isHabitCompleted } from "@/lib/metrics";
import { format } from "date-fns";
import CheckIn from "@/components/dashboard/CheckIn";
import Metrics from "@/components/dashboard/Metrics";
import Insights from "@/components/dashboard/Insights";
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

function ProgressRing({ value, size = 72, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function Dashboard() {
  const { records, habits, profile } = useStore();
  const [period, setPeriod] = useState<Period>("7d");

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRecord = records.find((r) => r.date === today);
  const periodRecords = useMemo(() => getRecordsForPeriod(records, period), [records, period]);

  const activeHabits = habits.filter((h) => h.active);
  const checks = todayRecord?.habitChecks || {};
  const done = activeHabits.filter((h) => isHabitCompleted(h, checks[h.id])).length;
  const pct = activeHabits.length > 0 ? Math.round((done / activeHabits.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Greeting + Progress Ring */}
      <div className="flex items-center justify-between gap-4">
        <div>
          {profile.displayName ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Olá, {profile.displayName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Acompanhe sua evolução
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Acompanhe sua evolução</p>
            </>
          )}
        </div>

        {/* Daily progress ring */}
        <Card className="bg-metric-habits-bg border-0 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="relative">
              <ProgressRing value={pct} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{pct}%</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-foreground">{done}/{activeHabits.length}</p>
              <p className="text-[10px] text-muted-foreground">hábitos hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CheckIn today={today} record={todayRecord} habits={habits} />

      <Metrics records={periodRecords} habits={habits} period={period} setPeriod={setPeriod} />
      <Insights records={periodRecords} habits={habits} profile={profile} todayRecord={todayRecord} />
    </div>
  );
}
