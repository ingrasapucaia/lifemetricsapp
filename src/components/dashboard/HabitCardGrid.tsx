import { useState } from "react";
import { Habit } from "@/types";
import { isHabitCompleted } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Minus, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardGridProps {
  habits: Habit[];
  checks: Record<string, boolean | number>;
  onUpdate: (newChecks: Record<string, boolean | number>) => void;
  initialCount?: number;
}

function ProgressCircle({
  value,
  target,
  completed,
  isCheck,
  size = 56,
}: {
  value: number;
  target: number;
  completed: boolean;
  isCheck: boolean;
  size?: number;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = isCheck ? (completed ? 100 : 0) : target > 0 ? Math.min((value / target) * 100, 100) : 0;
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
        {isCheck ? (
          completed ? (
            <Check size={20} className="text-primary" strokeWidth={3} />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )
        ) : (
          <span className="text-xs font-bold text-foreground">
            {value}/{target}
          </span>
        )}
      </div>
    </div>
  );
}

function CompactHabitCard({
  habit,
  checks,
  onUpdate,
}: {
  habit: Habit;
  checks: Record<string, boolean | number>;
  onUpdate: (newChecks: Record<string, boolean | number>) => void;
}) {
  const completed = isHabitCompleted(habit, checks[habit.id]);
  const isCheck = habit.targetType === "check";
  const currentValue = typeof checks[habit.id] === "number" ? (checks[habit.id] as number) : 0;
  const target = habit.targetValue || 1;

  const handleIncrement = () => {
    onUpdate({ ...checks, [habit.id]: currentValue + 1 });
  };

  const handleDecrement = () => {
    if (currentValue > 0) {
      onUpdate({ ...checks, [habit.id]: currentValue - 1 });
    }
  };

  const handleCheckToggle = () => {
    onUpdate({ ...checks, [habit.id]: !checks[habit.id] });
  };

  return (
    <Card className={cn(
      "border-border/60 transition-all duration-200",
      completed && "bg-primary/5 border-primary/20"
    )}>
      <CardContent className="p-3 flex flex-col items-center gap-2">
        {/* Name + icon */}
        <div className="flex items-center gap-1.5 w-full min-w-0">
          {habit.icon && /[^\x00-\x7F]/.test(habit.icon) && (
            <span className="shrink-0 text-lg">{habit.icon}</span>
          )}
          <p className="text-xs font-medium truncate flex-1">{habit.name}</p>
        </div>

        {/* Progress circle */}
        {isCheck ? (
          <button type="button" onClick={handleCheckToggle} className="focus:outline-none">
            <ProgressCircle
              value={0} target={1}
              completed={completed} isCheck
            />
          </button>
        ) : (
          <ProgressCircle
            value={currentValue} target={target}
            completed={completed} isCheck={false}
          />
        )}

        {/* +/- buttons for numeric habits */}
        {!isCheck && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Minus size={14} className="text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-7 h-7 rounded-full border border-primary bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus size={14} className="text-primary" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HabitCardGrid({ habits, checks, onUpdate, initialCount = 4 }: HabitCardGridProps) {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Hábitos do dia
          <span className="font-normal ml-1.5">({done}/{active.length})</span>
        </p>
      </div>

      {active.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhum hábito ativo</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {displayed.map((h) => (
              <CompactHabitCard
                key={h.id}
                habit={h}
                checks={checks}
                onUpdate={onUpdate}
              />
            ))}
          </div>

          {active.length > initialCount && (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Mostrar menos" : `Ver todos os hábitos (${active.length})`}
              <ChevronDown size={16} className={cn("ml-1 transition-transform", showAll && "rotate-180")} />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
