import { useMemo } from "react";
import { DailyRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfWeek, addDays } from "date-fns";
import { Zap } from "lucide-react";

interface Props {
  records: DailyRecord[];
}

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

function DonutChart({ value, total, size = 64 }: { value: number; total: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? (value / total) * 100 : 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="white"
          stroke="hsl(0 0% 0% / 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="hsl(var(--primary-dark))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none" style={{ color: "hsl(var(--foreground))" }}>{value}</span>
        <span className="text-[9px] font-medium text-muted-foreground leading-none mt-0.5">dias</span>
      </div>
    </div>
  );
}

export default function WeeklyStreakCard({ records }: Props) {
  const { weekDays, streakCount } = useMemo(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

    const recordSet = new Set<string>();
    records.forEach((r) => {
      const hasData =
        r.mood ||
        r.waterIntake > 0 ||
        r.sleepHours > 0 ||
        Object.keys(r.habitChecks).length > 0;
      if (hasData) recordSet.add(r.date);
    });

    const weekDays = days.map((d) => ({
      label: DAY_LABELS[days.indexOf(d)],
      date: d,
      hasRecord: recordSet.has(format(d, "yyyy-MM-dd")),
      isFuture: d > now,
    }));

    const streakCount = weekDays.filter((d) => d.hasRecord).length;

    return { weekDays, streakCount };
  }, [records]);

  return (
    <Card className="border-0 overflow-hidden bg-primary" style={{ borderRadius: 20 }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={14} className="text-primary-foreground/70" fill="currentColor" />
              <span className="text-xs font-medium text-primary-foreground/70">Registro diário</span>
            </div>
            <p className="text-lg font-bold text-primary-foreground leading-tight">
              Seu progresso<br />semanal
            </p>
          </div>
          <DonutChart value={streakCount} total={7} />
        </div>
      </CardContent>
    </Card>
  );
}
