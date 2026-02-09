import { useState, useRef, useCallback } from "react";
import { DailyRecord, Habit } from "@/types";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { isHabitCompleted } from "@/lib/metrics";
import { Moon, Dumbbell, BookOpen, Pencil, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const moods = [
  { v: 1, emoji: "😞", label: "Muito baixo" },
  { v: 2, emoji: "😕", label: "Baixo" },
  { v: 3, emoji: "😐", label: "Normal" },
  { v: 4, emoji: "🙂", label: "Bom" },
  { v: 5, emoji: "😄", label: "Ótimo" },
];

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="text-xs text-primary animate-fade-in">✓ Salvo</span>;
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

  const mood = record?.mood || 0;
  const sleep = record?.sleepHours || 0;
  const exercise = record?.exerciseMinutes || 0;
  const checks = record?.habitChecks || {};
  const done = active.filter((h) => isHabitCompleted(h, checks[h.id])).length;
  const pct = active.length > 0 ? (done / active.length) * 100 : 0;

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
            <CardTitle className="text-sm font-medium">Humor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {moods.map((m) => (
                <button
                  key={m.v}
                  onClick={() => {
                    up({ mood: m.v });
                    toast("Humor registrado");
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-sm transition-all",
                    mood === m.v ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
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

        {/* Habits */}
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
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {active.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {h.targetType === "check" ? (
                    <Checkbox
                      checked={checks[h.id] === true}
                      onCheckedChange={(c) =>
                        up({ habitChecks: { ...checks, [h.id]: !!c } })
                      }
                    />
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={typeof checks[h.id] === "number" ? (checks[h.id] as number) : ""}
                      onChange={(e) =>
                        up({ habitChecks: { ...checks, [h.id]: Number(e.target.value) } })
                      }
                      className="w-20 h-8 text-sm"
                      placeholder="0"
                    />
                  )}
                  <span className="text-sm flex-1">{h.name}</span>
                  {h.targetType !== "check" && h.targetValue && (
                    <span className="text-xs text-muted-foreground">
                      {typeof checks[h.id] === "number" ? checks[h.id] : 0}/{h.targetValue}{" "}
                      {h.targetType === "minutes" ? "min" : "x"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exercise */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Dumbbell size={16} /> Exercício
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
