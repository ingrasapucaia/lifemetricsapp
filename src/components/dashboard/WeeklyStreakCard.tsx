import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DailyRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { Target } from "lucide-react";

interface Props {
  records: DailyRecord[];
  objective?: string | null;
}

const TOTAL_DAYS = 183; // ~6 months

function StreakDonut({ value, total, size = 68 }: { value: number; total: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="white"
          stroke="hsl(0 0% 0% / 0.08)"
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
          className="transition-all duration-1000 ease-out"
          style={{
            animation: "donut-fill 1.2s ease-out forwards",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold leading-none" style={{ color: "hsl(var(--foreground))" }}>{value}</span>
        <span className="text-[8px] font-medium text-muted-foreground leading-none mt-0.5">/ {total}</span>
      </div>
      <style>{`
        @keyframes donut-fill {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${offset}; }
        }
      `}</style>
    </div>
  );
}

export default function WeeklyStreakCard({ records, objective }: Props) {
  const streakCount = useMemo(() => {
    const today = new Date();
    const recordDates = new Set<string>();
    records.forEach((r) => {
      const hasData =
        r.mood ||
        r.waterIntake > 0 ||
        r.sleepHours > 0 ||
        Object.keys(r.habitChecks).length > 0;
      if (hasData) recordDates.add(r.date);
    });

    // Count consecutive days ending today (or yesterday)
    let count = 0;
    let checkDate = today;
    // If today has no record yet, start from yesterday
    if (!recordDates.has(format(today, "yyyy-MM-dd"))) {
      checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (recordDates.has(format(checkDate, "yyyy-MM-dd"))) {
      count++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return count;
  }, [records]);

  const navigate = useNavigate();

  return (
    <Card className="border-0 overflow-hidden bg-primary" style={{ borderRadius: 20 }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Target size={13} className="text-primary-foreground/70 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">
                Objetivo atual
              </span>
            </div>
            {objective ? (
              <p className="text-base font-bold text-primary-foreground leading-snug line-clamp-2">
                {objective}
              </p>
            ) : (
              <button
                onClick={() => navigate("/perfil")}
                className="text-sm font-semibold text-primary-foreground/90 hover:text-primary-foreground transition-colors underline underline-offset-2"
              >
                Adicione seu objetivo →
              </button>
            )}
          </div>
          <div className="shrink-0">
            <StreakDonut value={streakCount} total={TOTAL_DAYS} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
