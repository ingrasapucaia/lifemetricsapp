import { useState, useRef, useCallback } from "react";
import { DailyRecord, Habit, MOOD_TAGS, getMoodTag } from "@/types";
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
  Moon, Dumbbell, BookOpen, Pencil, ChevronDown, Clock, Droplet, icons,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="text-xs text-primary animate-fade-in">✓ Salvo</span>;
}

function HabitIcon({ name, size = 14 }: { name?: string; size?: number }) {
  if (!name) return null;
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} className="text-muted-foreground shrink-0" />;
}

function WaterDrops({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const max = 8;
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(value === i + 1 ? i : i + 1)}
          className="group transition-all"
          title={`${i + 1} copo(s)`}
        >
          <Droplet
            size={22}
            className={cn(
              "transition-colors",
              i < value
                ? "fill-primary/70 text-primary"
                : "text-muted-foreground/30 group-hover:text-muted-foreground/50"
            )}
          />
        </button>
      ))}
      <span className="text-xs text-muted-foreground self-center ml-1">{value}/8</span>
    </div>
  );
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
  const sleep = record?.sleepHours || 0;
  const exercise = record?.exerciseMinutes || 0;
  const water = record?.waterIntake || 0;
  const wakeUp = record?.wakeUpTime || "";
  const checks = record?.habitChecks || {};
  const done = active.filter((h) => isHabitCompleted(h, checks[h.id])).length;
  const pct = active.length > 0 ? (done / active.length) * 100 : 0;

  const moodTag = getMoodTag(mood);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Check-in do dia</h2>
        <Saved show={saved} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon size={16} /> Humor
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
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu humor">
                  {moodTag && (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
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
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
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

        {/* Wake up time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock size={16} /> Acordei às
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="time"
              value={wakeUp}
              onChange={(e) => up({ wakeUpTime: e.target.value })}
              className="w-32"
            />
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon size={16} /> Sono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step={0.5}
                min={0}
                max={12}
                value={sleep || ""}
                onChange={(e) =>
                  up({ sleepHours: Math.min(12, Math.max(0, Number(e.target.value))) })
                }
                placeholder="7.5"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
          </CardContent>
        </Card>

        {/* Water */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Droplet size={16} /> Água
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WaterDrops value={water} onChange={(v) => up({ waterIntake: v })} />
          </CardContent>
        </Card>

        {/* General Habits */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Hábitos do dia ({done}/{active.length})
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
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
                  className="text-xs"
                  onClick={() => up({ habitChecks: {} })}
                >
                  Limpar
                </Button>
              </div>
            </div>
            <Progress value={pct} className="h-2 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            {generalHabits.length > 0 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exerciseHabits.map((h) => (
                    <HabitRow key={h.id} habit={h} checks={checks} onUpdate={(newChecks) => up({ habitChecks: newChecks })} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise minutes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Dumbbell size={16} /> Exercício geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={240}
                value={exercise || ""}
                onChange={(e) =>
                  up({ exerciseMinutes: Math.min(240, Math.max(0, Number(e.target.value))) })
                }
                placeholder="0"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journal */}
      <Collapsible open={journalOpen} onOpenChange={setJournalOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <BookOpen size={16} /> Diário (opcional)
            </span>
            <ChevronDown
              size={16}
              className={cn("transition-transform", journalOpen && "rotate-180")}
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
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <HabitIcon name={h.icon} />
      {h.targetType === "check" ? (
        <Checkbox
          checked={checks[h.id] === true}
          onCheckedChange={(c) => onUpdate({ ...checks, [h.id]: !!c })}
        />
      ) : (
        <>
          {h.targetType === "hours_minutes" ? (
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
                className="w-14 h-8 text-sm"
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
                className="w-14 h-8 text-sm"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          ) : (
            <Input
              type="number"
              min={0}
              max={999}
              value={typeof checks[h.id] === "number" ? (checks[h.id] as number) : ""}
              onChange={(e) => onUpdate({ ...checks, [h.id]: Number(e.target.value) })}
              className="w-20 h-8 text-sm"
              placeholder="0"
            />
          )}
        </>
      )}
      <span className="text-sm flex-1">{h.name}</span>
      {h.targetType !== "check" && h.targetValue && (
        <span className="text-xs text-muted-foreground">
          {h.targetType === "hours_minutes"
            ? `${Math.floor((typeof checks[h.id] === "number" ? (checks[h.id] as number) : 0) / 60)}h${(typeof checks[h.id] === "number" ? (checks[h.id] as number) : 0) % 60}m / ${Math.floor(h.targetValue / 60)}h${h.targetValue % 60}m`
            : `${typeof checks[h.id] === "number" ? checks[h.id] : 0}/${h.targetValue} ${h.targetType === "minutes" ? "min" : "x"}`}
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
        className="h-auto py-3 flex flex-col items-start text-left"
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
          placeholder={placeholder}
          rows={4}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(text);
              setOpen(false);
              toast("Registro salvo");
            }}
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
