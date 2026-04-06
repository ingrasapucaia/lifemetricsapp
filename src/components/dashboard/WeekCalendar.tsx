import { useMemo } from "react";
import { format, startOfWeek, addDays, addWeeks, isSameDay, isAfter, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyRecord } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  records: DailyRecord[];
}

const DAY_ABBR = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function WeekCalendar({ selectedDate, onSelectDate, weekOffset, onWeekChange, records }: Props) {
  const today = new Date();

  const weekStart = useMemo(() => {
    const base = weekOffset === 0 ? today : addWeeks(today, weekOffset);
    return startOfWeek(base, { weekStartsOn: 1 });
  }, [weekOffset]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const recordDates = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const hasData = r.mood || r.waterIntake > 0 || r.sleepHours > 0 || Object.keys(r.habitChecks).length > 0;
      if (hasData) set.add(r.date);
    });
    return set;
  }, [records]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onWeekChange(weekOffset - 1)}
        className="p-1.5 rounded-full hover:bg-muted/60 transition-colors shrink-0"
      >
        <ChevronLeft size={18} className="text-muted-foreground" />
      </button>

      <div className="flex-1 flex justify-between gap-1">
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dateStr = format(day, "yyyy-MM-dd");
          const hasRecord = recordDates.has(dateStr);
          const isFuture = isAfter(startOfDay(day), startOfDay(today));

          return (
            <button
              key={i}
              onClick={() => !isFuture && onSelectDate(day)}
              disabled={isFuture}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 min-w-[40px]",
                isFuture && "opacity-40 cursor-not-allowed",
                !isSelected && !isFuture && "hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}>
                {DAY_ABBR[i]}
              </span>
              <span className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "border-2 border-primary text-primary"
                    : "text-foreground"
              )}>
                {format(day, "d")}
              </span>
              {/* Activity indicator */}
              <div className="h-1.5">
                {hasRecord && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onWeekChange(weekOffset + 1)}
        className="p-1.5 rounded-full hover:bg-muted/60 transition-colors shrink-0"
      >
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>
    </div>
  );
}
