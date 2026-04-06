import { useMemo } from "react";
import { DailyRecord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfWeek, addDays } from "date-fns";
import { Zap } from "lucide-react";

interface Props {
  records: DailyRecord[];
}

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

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
    <Card className="border-0 overflow-hidden" style={{ backgroundColor: "#43A047" }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-base font-bold text-white">Seu progresso da semana</p>
            <p className="text-xs text-white/70 mt-0.5">Dias com registro completo</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={20} className="text-yellow-300" fill="currentColor" />
            <span className="text-2xl font-bold text-white">{streakCount}</span>
            <span className="text-sm text-white/80 font-medium">dias</span>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          {weekDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-white/70 uppercase">
                {d.label}
              </span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  d.hasRecord
                    ? "bg-white shadow-md"
                    : d.isFuture
                      ? "border-2 border-white/20"
                      : "border-2 border-white/50"
                }`}
              >
                {d.hasRecord && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="#43A047"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
