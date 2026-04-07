import { useState, useRef } from "react";
import { Habit } from "@/types";
import { isHabitCompleted } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Minus, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HabitCardGridProps {
  habits: Habit[];
  checks: Record<string, boolean | number>;
  onUpdate: (newChecks: Record<string, boolean | number>) => void;
  initialCount?: number;
}

function getHabitUnit(habit: Habit): string {
  if (habit.metricUnit) return habit.metricUnit;
  switch (habit.metricType) {
    case "tempo": return habit.metricTimeUnit === "horas" ? "h" : habit.metricTimeUnit === "segundos" ? "s" : "min";
    case "km": return "km";
    case "milhas": return "mi";
    case "calorias": return "kcal";
    case "litros": return "L";
    case "reais": return "R$";
    case "dolar": return "$";
    case "euro": return "€";
    default: break;
  }
  switch (habit.targetType) {
    case "minutes": return "min";
    case "hours_minutes": return "h";
    case "km": return "km";
    case "miles": return "mi";
    default: return "";
  }
}

function ProgressRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min((done / total) * 100, 100) : 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-foreground">{done}/{total}</span>
      </div>
    </div>
  );
}

function CheckToggle({ completed, onToggle }: { completed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0",
        completed
          ? "bg-primary border-primary"
          : "border-muted-foreground/30 hover:border-primary/50"
      )}
    >
      {completed && <Check size={14} className="text-primary-foreground" strokeWidth={3} />}
    </button>
  );
}

function NumericControls({
  value,
  target,
  unit,
  onChange,
}: {
  value: number;
  target: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const useLargeInput = target > 10;

  if (useLargeInput) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          inputMode="numeric"
          value={value || ""}
          placeholder="0"
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(isNaN(v) ? 0 : v);
          }}
          className="w-12 h-7 text-center text-xs font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-muted-foreground">/{target}{unit && ` ${unit}`}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => value > 0 && onChange(value - 1)}
        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors active:scale-90"
      >
        <Minus size={12} className="text-muted-foreground" />
      </button>
      <span className="text-xs font-semibold text-foreground min-w-[2.5rem] text-center">
        {value}/{target}{unit && <span className="text-muted-foreground font-normal ml-0.5">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors active:scale-90"
      >
        <Plus size={12} className="text-primary" />
      </button>
    </div>
  );
}

function HabitRow({
  habit,
  checks,
  onUpdate,
  isLast,
}: {
  habit: Habit;
  checks: Record<string, boolean | number>;
  onUpdate: (newChecks: Record<string, boolean | number>) => void;
  isLast: boolean;
}) {
  const completed = isHabitCompleted(habit, checks[habit.id]);
  const isCheck = habit.targetType === "check";
  const currentValue = typeof checks[habit.id] === "number" ? (checks[habit.id] as number) : 0;
  const target = habit.targetValue || 1;
  const unit = getHabitUnit(habit);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors duration-200",
        completed && "bg-primary/5",
        !isLast && "border-b border-border/40"
      )}
    >
      {/* Icon + Name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {habit.icon && /[^\x00-\x7F]/.test(habit.icon) && (
          <span className="text-base shrink-0">{habit.icon}</span>
        )}
        <span className={cn(
          "text-sm truncate transition-colors",
          completed ? "text-muted-foreground" : "text-foreground"
        )}>
          {habit.name}
        </span>
      </div>

      {/* Controls */}
      {isCheck ? (
        <CheckToggle
          completed={completed}
          onToggle={() => onUpdate({ ...checks, [habit.id]: !checks[habit.id] })}
        />
      ) : (
        <NumericControls
          value={currentValue}
          target={target}
          unit={unit}
          onChange={(v) => onUpdate({ ...checks, [habit.id]: v })}
        />
      )}
    </div>
  );
}

export default function HabitCardGrid({ habits, checks, onUpdate, initialCount = 6 }: HabitCardGridProps) {
  const [showAll, setShowAll] = useState(false);

  const active = habits.filter((h) => h.active);
  const sortedHabits = [...active].sort((a, b) => {
    const aDone = isHabitCompleted(a, checks[a.id]);
    const bDone = isHabitCompleted(b, checks[b.id]);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return 0;
  });

  const displayed = showAll ? sortedHabits : sortedHabits.slice(0, initialCount);
  const done = active.filter((h) => isHabitCompleted(h, checks[h.id])).length;
  const todayFormatted = format(new Date(), "dd 'de' MMMM", { locale: ptBR });

  if (active.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">Nenhum hábito ativo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-base font-semibold text-foreground">Hábitos do dia</p>
          <p className="text-xs text-muted-foreground capitalize">{todayFormatted}</p>
        </div>
        <ProgressRing done={done} total={active.length} />
      </div>

      {/* Habit list */}
      <div>
        {displayed.map((h, i) => (
          <HabitRow
            key={h.id}
            habit={h}
            checks={checks}
            onUpdate={onUpdate}
            isLast={i === displayed.length - 1 && !(active.length > initialCount)}
          />
        ))}
      </div>

      {/* Expand button */}
      {active.length > initialCount && (
        <div className="px-4 py-3 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground h-8"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Mostrar menos" : `Ver todos (${active.length})`}
            <ChevronDown size={14} className={cn("ml-1 transition-transform", showAll && "rotate-180")} />
          </Button>
        </div>
      )}
    </Card>
  );
}
