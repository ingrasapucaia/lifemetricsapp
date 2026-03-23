import { useState, useRef, useCallback } from "react";
import { DailyRecord, Habit, MOOD_TAGS, getMoodTag, formatSleepHours, getLifeArea } from "@/types";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { isHabitCompleted } from "@/lib/metrics";
import {
  Smile, Moon, Dumbbell, BookOpen, Pencil, ChevronDown, Droplet, icons, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [journalOpen, setJournalOpen] = useState(false);

  const active = habits.filter((h) => h.active);
  const generalHabits = active.filter((h) => h.category !== "exercicio");
  const exerciseHabits = active.filter((h) => h.category === "exercicio");

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
  const pct = active.length > 0 ? (done / active.length) * 100 : 0;

  const moodTag = getMoodTag(mood);

  const [sleepH, sleepM] = sleepTime ? sleepTime.split(":").map(Number) : [23, 0];
  const [wakeH, wakeM] = wakeUp ? wakeUp.split(":").map(Number) : [7, 0];

  const calculatedSleep = calculateSleepDuration(sleepTime, wakeUp);

  const updateSleepTime = (h: number, m: number) => {
    const newSleepTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const newSleep = calculateSleepDuration(newSleepTime, wakeUp);
    up({ sleepTime: newSleepTime, sleepHours: newSleep });
  };

  const updateWakeTime = (h: number, m: number) => {
    const newWakeTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const newSleep = calculateSleepDuration(sleepTime, newWakeTime);
    up({ wakeUpTime: newWakeTime, sleepHours: newSleep });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck size={18} className="text-primary" />
          Check-in do dia
        </h2>
        <Saved show={saved} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood */}
        <Card className="bg-metric-mood-bg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-metric-mood/10 flex items-center justify-center">
                <Smile size={14} className="text-metric-mood" />
              </div>
              Humor
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-metric-sleep/10 flex items-center justify-center">
                <Moon size={14} className="text-metric-sleep" />
              </div>
              Sono
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-metric-water/10 flex items-center justify-center">
                <Droplet size={14} className="text-metric-water" />
              </div>
              Água
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WaterDrops value={water} onChange={(v) => up({ waterIntake: v })} />
          </CardContent>
        </Card>

        {/* Habits */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-metric-habits-bg flex items-center justify-center">
                  <ClipboardCheck size={14} className="text-metric-habits" />
                </div>
                Hábitos do dia
                <span className="text-xs text-muted-foreground font-normal ml-1">({done}/{active.length})</span>
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-xl"
                  onClick={() => {
                    const all: Record<string, boolean | number> = {};
                    active.forEach((h) => {
                      all[h.id] = h.targetType === "check" ? true : h.targetValue || 30;
                    });
                    up({ habitChecks: all });
                  }}
                >
                  Marcar tudo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs rounded-xl"
                  onClick={() => up({ habitChecks: {} })}
                >
                  Limpar
                </Button>
              </div>
            </div>
            <Progress value={pct} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {generalHabits.length > 0 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {generalHabits.map((h) => (
                    <HabitRow key={h.id} habit={h} checks={checks} onUpdate={(newChecks) => up({ habitChecks: newChecks })} />
                  ))}
                </div>
              </div>
            )}

            {exerciseHabits.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Dumbbell size={12} /> Exercício
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {exerciseHabits.map((h) => (
                    <HabitRow key={h.id} habit={h} checks={checks} onUpdate={(newChecks) => up({ habitChecks: newChecks })} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Journal */}
      <Collapsible open={journalOpen} onOpenChange={setJournalOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between rounded-xl">
            <span className="flex items-center gap-2">
              <BookOpen size={16} /> Diário (opcional)
            </span>
            <ChevronDown
              size={16}
              className={cn("transition-transform duration-200", journalOpen && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <JournalBtn
              title="Como se sentiu?"
              value={record?.noteFeeling}
              placeholder="Descreva como foi seu dia..."
              onSave={(v) => up({ noteFeeling: v })}
            />
            <JournalBtn
              title="Procrastinação"
              value={record?.noteProcrastination}
              placeholder="Procrastinou algo? O que e por quê?"
              onSave={(v) => up({ noteProcrastination: v })}
            />
            <JournalBtn
              title="Gratidão"
              value={record?.noteGratitude}
              placeholder="Liste coisas pelas quais é grato..."
              onSave={(v) => up({ noteGratitude: v })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

function HabitRow({
  habit,
  checks,
  onUpdate,
}: {
  habit: Habit;
  checks: Record<string, boolean | number>;
  onUpdate: (newChecks: Record<string, boolean | number>) => void;
}) {
  const h = habit;
  const unitLabel = h.targetType === "km" ? "km" : h.targetType === "miles" ? "mi" : h.targetType === "minutes" ? "min" : "x";

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all duration-200">
      <HabitIcon name={h.icon} />
      {h.targetType === "check" ? (
        <Checkbox
          checked={checks[h.id] === true}
          onCheckedChange={(c) => onUpdate({ ...checks, [h.id]: !!c })}
        />
      ) : h.targetType === "hours_minutes" ? (
        <div className="flex items-center gap-1">
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
            className="w-14 h-8 text-sm rounded-lg"
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">h</span>
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
            className="w-14 h-8 text-sm rounded-lg"
            placeholder="0"
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      ) : (
        <Input
          type="number"
          min={0}
          max={999}
          step={h.targetType === "km" || h.targetType === "miles" ? 0.1 : 1}
          value={typeof checks[h.id] === "number" ? (checks[h.id] as number) : ""}
          onChange={(e) => onUpdate({ ...checks, [h.id]: Number(e.target.value) })}
          className="w-20 h-8 text-sm rounded-lg"
          placeholder="0"
        />
      )}
      <span className="text-sm flex-1">{h.name}</span>
      {h.targetType !== "check" && h.targetValue && (
        <span className="text-xs text-muted-foreground">
          {h.targetType === "hours_minutes"
            ? `${Math.floor((typeof checks[h.id] === "number" ? (checks[h.id] as number) : 0) / 60)}h${(typeof checks[h.id] === "number" ? (checks[h.id] as number) : 0) % 60}m / ${Math.floor(h.targetValue / 60)}h${h.targetValue % 60}m`
            : `${typeof checks[h.id] === "number" ? checks[h.id] : 0}/${h.targetValue} ${unitLabel}`}
        </span>
      )}
    </div>
  );
}

function JournalBtn({
  title,
  value,
  placeholder,
  onSave,
}: {
  title: string;
  value?: string;
  placeholder: string;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value || "");
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setText(value || "");
      }}
    >
      <Button
        variant="outline"
        className="h-auto py-3 flex flex-col items-start text-left rounded-xl"
        onClick={() => setOpen(true)}
      >
        <span className="text-sm font-medium flex items-center gap-2">
          <Pencil size={14} />
          {value ? "Editar: " : ""}
          {title}
        </span>
        {value && (
          <span className="text-xs text-muted-foreground truncate w-full mt-1">
            {value.slice(0, 50)}
            {value.length > 50 ? "..." : ""}
          </span>
        )}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={placeholder}
          className="rounded-xl"
        />
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(text);
              setOpen(false);
            }}
            className="rounded-xl"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
