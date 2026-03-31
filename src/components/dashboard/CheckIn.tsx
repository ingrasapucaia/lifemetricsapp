import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DailyRecord, Habit, MOOD_TAGS, getMoodTag, formatSleepHours } from "@/types";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { isHabitCompleted } from "@/lib/metrics";
import {
  Smile, Moon, ChevronDown, Droplet, icons, ClipboardCheck, Plus, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MealsCard from "@/components/dashboard/MealsCard";

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="text-xs text-primary animate-fade-in font-medium">✓ Salvo</span>;
}

function HabitIcon({ name, size = 14 }: { name?: string; size?: number }) {
  // If it's an emoji (non-ASCII), render as text
  if (name && /[^\x00-\x7F]/.test(name)) {
    return <span className="shrink-0" style={{ fontSize: size + 4 }}>{name}</span>;
  }
  if (!name) return null;
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} className="text-muted-foreground shrink-0" />;
}

function WaterDrops({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const max = 8;
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(value === i + 1 ? i : i + 1)}
          className="group transition-all duration-200"
          title={`${i + 1} copo(s)`}
        >
          <Droplet
            size={20}
            className={cn(
              "transition-all duration-200 sm:w-[24px] sm:h-[24px]",
              i < value
                ? "fill-metric-water text-metric-water scale-110"
                : "text-muted-foreground/25 group-hover:text-muted-foreground/50"
            )}
          />
        </button>
      ))}
      <span className="text-xs text-muted-foreground self-center ml-1 font-medium">{value}/8</span>
    </div>
  );
}

function TimeSelect({ hours, minutes, onChangeHours, onChangeMinutes }: {
  hours: number;
  minutes: number;
  onChangeHours: (h: number) => void;
  onChangeMinutes: (m: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={String(hours)} onValueChange={(v) => onChangeHours(Number(v))}>
        <SelectTrigger className="w-[72px] rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 24 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}h</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(minutes)} onValueChange={(v) => onChangeMinutes(Number(v))}>
        <SelectTrigger className="w-[80px] rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 60 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}min</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function calculateSleepDuration(sleepTime: string, wakeTime: string): number {
  if (!sleepTime || !wakeTime) return 0;
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let sleepMins = sh * 60 + sm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= sleepMins) wakeMins += 24 * 60;
  const diff = wakeMins - sleepMins;
  return +(diff / 60).toFixed(2);
}

interface Props {
  today: string;
  record: DailyRecord | undefined;
  habits: Habit[];
}

export default function CheckIn({ today, record, habits }: Props) {
  const { upsertRecord } = useStore();
  const [saved, setSaved] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  const active = habits.filter((h) => h.active);

  const flash = () => {
    setSaved(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setSaved(false), 1500);
  };

  const up = useCallback(
    (u: Partial<DailyRecord>) => {
      upsertRecord({ date: today, ...u });
      flash();
    },
    [today, upsertRecord]
  );

  const mood = record?.mood || "";
  const water = record?.waterIntake || 0;
  const sleepTime = record?.sleepTime || "";
  const wakeUp = record?.wakeUpTime || "";
  const checks = record?.habitChecks || {};
  const done = active.filter((h) => isHabitCompleted(h, checks[h.id])).length;
  

  const moodTag = getMoodTag(mood);

  const [sleepH, sleepM] = sleepTime ? sleepTime.split(":").map(Number) : [23, 0];
  const [wakeH, wakeM] = wakeUp ? wakeUp.split(":").map(Number) : [7, 0];

  const calculatedSleep = calculateSleepDuration(sleepTime, wakeUp);

  const defaultSleepTime = "23:00";
  const defaultWakeTime = "07:00";

  const updateSleepTime = (h: number, m: number) => {
    const newSleepTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const effectiveWake = wakeUp || defaultWakeTime;
    const newSleep = calculateSleepDuration(newSleepTime, effectiveWake);
    up({ sleepTime: newSleepTime, wakeUpTime: effectiveWake, sleepHours: newSleep });
  };

  const updateWakeTime = (h: number, m: number) => {
    const newWakeTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const effectiveSleep = sleepTime || defaultSleepTime;
    const newSleep = calculateSleepDuration(effectiveSleep, newWakeTime);
    up({ sleepTime: effectiveSleep, wakeUpTime: newWakeTime, sleepHours: newSleep });
  };

  const [checkInOpen, setCheckInOpen] = useState(() => {
    const stored = localStorage.getItem("checkin-section-open");
    return stored !== null ? stored === "true" : true;
  });

  const handleCheckInToggle = (val: boolean) => {
    setCheckInOpen(val);
    localStorage.setItem("checkin-section-open", String(val));
  };

  return (
    <section className="space-y-4">
      <Collapsible open={checkInOpen} onOpenChange={handleCheckInToggle}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 group">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardCheck size={18} className="text-primary" />
              Check-in do dia
            </h2>
            <ChevronDown
              size={16}
              className={cn(
                "text-muted-foreground transition-transform duration-200",
                checkInOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <Saved show={saved} />
        </div>

        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mood */}
            <Card className="bg-metric-mood-bg border-0">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-metric-mood/10 flex items-center justify-center">
                    <Smile size={14} className="text-metric-mood" />
                  </div>
                  Humor
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-3">
                <Select
                  value={mood}
                  onValueChange={(v) => {
                    up({ mood: v });
                    toast("Humor registrado");
                  }}
                >
                  <SelectTrigger className="rounded-xl bg-card/80">
                    <SelectValue placeholder="Selecione seu humor">
                      {moodTag && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
                          style={{ backgroundColor: `hsl(${moodTag.bgHsl})` }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${moodTag.hsl})` }}
                          />
                          {moodTag.label}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_TAGS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
                          style={{ backgroundColor: `hsl(${m.bgHsl})` }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${m.hsl})` }}
                          />
                          {m.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Sleep */}
            <Card className="bg-metric-sleep-bg border-0">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-metric-sleep/10 flex items-center justify-center">
                    <Moon size={14} className="text-metric-sleep" />
                  </div>
                  Sono
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 px-4 pb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dormi às</p>
                  <TimeSelect
                    hours={sleepH}
                    minutes={sleepM}
                    onChangeHours={(h) => updateSleepTime(h, sleepM)}
                    onChangeMinutes={(m) => updateSleepTime(sleepH, m)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Acordei às</p>
                  <TimeSelect
                    hours={wakeH}
                    minutes={wakeM}
                    onChangeHours={(h) => updateWakeTime(h, wakeM)}
                    onChangeMinutes={(m) => updateWakeTime(wakeH, m)}
                  />
                </div>
                {(sleepTime || wakeUp) && (
                  <p className="text-sm font-semibold text-metric-sleep">
                    Dormiu {formatSleepHours(calculatedSleep)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Water */}
            <Card className="bg-metric-water-bg border-0">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-metric-water/10 flex items-center justify-center">
                    <Droplet size={14} className="text-metric-water" />
                  </div>
                  Água
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-3">
                <WaterDrops value={water} onChange={(v) => up({ waterIntake: v })} />
              </CardContent>
            </Card>

            {/* Meals */}
            <MealsCard selectedDate={today} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Habits - collapsible compact layout */}
      <HabitsSection
        active={active}
        checks={checks}
        done={done}
        onUpdate={(newChecks) => up({ habitChecks: newChecks })}
        onNavigate={() => navigate("/habitos")}
      />
    </section>
  );
}

function HabitCard({
  habit,
  checks,
  onUpdate,
}: {
  habit: Habit;
  checks: Record<string, boolean | number>;
  onUpdate: (newChecks: Record<string, boolean | number>) => void;
}) {
  const h = habit;
  const completed = isHabitCompleted(h, checks[h.id]);

  const unitLabel =
    h.targetType === "km" ? "km" :
    h.targetType === "miles" ? "mi" :
    h.targetType === "minutes" ? "min" :
    h.targetType === "hours_minutes" ? "" : "x";

  return (
    <Card className={cn(
      "border-border/60 transition-all duration-200",
      completed && "opacity-60"
    )}>
      <CardContent className="flex items-center gap-2 py-2 px-3" style={{ minHeight: 44, maxHeight: 44 }}>
        {/* Emoji icon - compact */}
        {h.icon && /[^\x00-\x7F]/.test(h.icon) && (
          <span className="shrink-0 text-center" style={{ fontSize: 18, width: 22 }}>{h.icon}</span>
        )}

        {/* Name only - no life area badge */}
        <p className="flex-1 min-w-0 truncate font-medium" style={{ fontSize: 13 }}>{h.name}</p>

        {/* Check or numeric input */}
        {h.targetType === "check" ? (
          <button
            type="button"
            onClick={() => onUpdate({ ...checks, [h.id]: !checks[h.id] })}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
              completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 text-transparent hover:border-primary/50"
            )}
          >
            <Check size={12} strokeWidth={3} />
          </button>
        ) : h.targetType === "hours_minutes" ? (
          <div className="flex items-center gap-1 shrink-0">
            <Input
              type="number"
              min={0}
              max={23}
              value={typeof checks[h.id] === "number" ? Math.floor((checks[h.id] as number) / 60) : ""}
              onChange={(e) => {
                const hrs = Number(e.target.value);
                const mins = typeof checks[h.id] === "number" ? (checks[h.id] as number) % 60 : 0;
                onUpdate({ ...checks, [h.id]: hrs * 60 + mins });
              }}
              className="w-10 h-7 text-xs rounded-lg text-center p-0"
              placeholder="0"
            />
            <span className="text-[10px] text-muted-foreground">h</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={typeof checks[h.id] === "number" ? (checks[h.id] as number) % 60 : ""}
              onChange={(e) => {
                const mins = Number(e.target.value);
                const hrs = typeof checks[h.id] === "number" ? Math.floor((checks[h.id] as number) / 60) : 0;
                onUpdate({ ...checks, [h.id]: hrs * 60 + mins });
              }}
              className="w-10 h-7 text-xs rounded-lg text-center p-0"
              placeholder="0"
            />
            <span className="text-[10px] text-muted-foreground">min</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <Input
              type="number"
              min={0}
              max={999}
              step={h.targetType === "km" || h.targetType === "miles" ? 0.1 : 1}
              value={typeof checks[h.id] === "number" ? (checks[h.id] as number) : ""}
              onChange={(e) => onUpdate({ ...checks, [h.id]: Number(e.target.value) })}
              className="w-12 h-7 text-xs rounded-lg text-center p-0"
              placeholder="0"
            />
            <span className="text-[10px] text-muted-foreground">{unitLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HabitsSection({
  active,
  checks,
  done,
  onUpdate,
  onNavigate,
}: {
  active: Habit[];
  checks: Record<string, boolean | number>;
  done: number;
  onUpdate: (newChecks: Record<string, boolean | number>) => void;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(() => {
    const stored = localStorage.getItem("habits-section-open");
    return stored !== null ? stored === "true" : true;
  });

  const handleToggle = (val: boolean) => {
    setOpen(val);
    localStorage.setItem("habits-section-open", String(val));
  };

  const sortedHabits = [...active].sort((a, b) => {
    const aDone = isHabitCompleted(a, checks[a.id]);
    const bDone = isHabitCompleted(b, checks[b.id]);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return 0;
  });

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-2 group">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            HÁBITOS
            <span className="font-normal ml-1.5">({done}/{active.length})</span>
          </p>
          <ChevronDown
            size={14}
            className={cn(
              "text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <Button
          size="icon"
          className="h-7 w-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onNavigate}
        >
          <Plus size={14} />
        </Button>
      </div>

      <CollapsibleContent className="mt-2 space-y-1">
        {active.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="py-6 text-center">
              <p className="text-[13px] text-muted-foreground mb-2">Nenhum hábito ativo</p>
              <Button variant="outline" className="rounded-xl text-[13px]" onClick={onNavigate}>
                + Criar meu primeiro hábito
              </Button>
            </CardContent>
          </Card>
        )}

        {sortedHabits.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            checks={checks}
            onUpdate={onUpdate}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
