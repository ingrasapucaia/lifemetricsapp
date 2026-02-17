import { useCallback, useRef, useState } from "react";
import { DailyRecord, Habit, MOOD_OPTIONS } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MoodSelector } from "@/components/MoodSelector";
import { WaterDroplets } from "@/components/WaterDroplets";
import { LucideIcon } from "@/components/LucideIcon";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { isHabitCompleted } from "@/lib/metrics";
import { toast } from "sonner";
import { CalendarDays, Smile, Clock, Moon, Droplets, Dumbbell, BookOpen, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  date: string;
  record: DailyRecord | undefined;
  habits: Habit[];
  onUpdate: (u: Partial<DailyRecord>) => void;
  showHeader?: boolean;
  displayName?: string;
}

export default function DayEditor({ date, record, habits, onUpdate, showHeader = true, displayName }: Props) {
  const [saved, setSaved] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const [journalOpen, setJournalOpen] = useState(false);

  const active = habits.filter((h) => h.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const flash = () => {
    setSaved(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setSaved(false), 1500);
  };

  const up = useCallback(
    (u: Partial<DailyRecord>) => {
      onUpdate(u);
      flash();
    },
    [onUpdate]
  );

  const checks = record?.habitChecks || {};
  const d = date ? parseISO(date) : new Date();
  const dayFormatted = format(d, "dd 'de' MMMM", { locale: ptBR });
  const dateDisplay = format(d, "dd/MM/yyyy");

  return (
    <div className="space-y-1">
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Hoje, {dayFormatted}.{" "}
            <span className="text-muted-foreground font-normal">
              Seja bem vinda, {displayName || "você"}.
            </span>
          </h1>
          {saved && <span className="text-xs text-muted-foreground mt-1 inline-block animate-fade-in">✓ Salvo</span>}
        </div>
      )}

      {!showHeader && saved && (
        <span className="text-xs text-muted-foreground mb-2 inline-block">✓ Salvo</span>
      )}

      <div className="divide-y divide-border">
        {/* Date */}
        <PropertyRow icon={<CalendarDays size={16} />} label="Data">
          <span className="text-sm">{dateDisplay}</span>
        </PropertyRow>

        {/* Mood */}
        <PropertyRow icon={<Smile size={16} />} label="Humor">
          <MoodSelector
            value={record?.moodLabel}
            onChange={(label) => {
              const opt = MOOD_OPTIONS.find((m) => m.label === label);
              up({ moodLabel: label, mood: opt?.value ?? 3 });
              toast("Humor registrado");
            }}
          />
        </PropertyRow>

        {/* Wake time */}
        <PropertyRow icon={<Clock size={16} />} label="Acordei às">
          <Input
            type="time"
            value={record?.wakeUpTime || ""}
            onChange={(e) => up({ wakeUpTime: e.target.value })}
            className="w-28 h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </PropertyRow>

        {/* Sleep */}
        <PropertyRow icon={<Moon size={16} />} label="Sono">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              step={0.5}
              min={0}
              max={12}
              value={record?.sleepHours || ""}
              onChange={(e) => up({ sleepHours: Math.min(12, Math.max(0, Number(e.target.value))) })}
              placeholder="0"
              className="w-16 h-8 text-sm border-0 bg-transparent p-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <span className="text-sm text-muted-foreground">h</span>
          </div>
        </PropertyRow>

        {/* Water */}
        <PropertyRow icon={<Droplets size={16} />} label="Água">
          <WaterDroplets
            value={record?.waterIntake ?? 0}
            onChange={(v) => up({ waterIntake: v })}
          />
        </PropertyRow>

        {/* Habits */}
        {active.map((h) => (
          <PropertyRow
            key={h.id}
            icon={h.iconName ? <LucideIcon name={h.iconName} size={16} /> : <BookOpen size={16} />}
            label={h.name}
          >
            {h.targetType === "check" ? (
              <Checkbox
                checked={checks[h.id] === true}
                onCheckedChange={(c) => up({ habitChecks: { ...checks, [h.id]: !!c } })}
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={999}
                  value={typeof checks[h.id] === "number" ? (checks[h.id] as number) : ""}
                  onChange={(e) => up({ habitChecks: { ...checks, [h.id]: Number(e.target.value) } })}
                  className="w-16 h-8 text-sm border-0 bg-transparent p-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0"
                />
                {h.targetValue && (
                  <span className="text-xs text-muted-foreground">
                    /{h.targetValue} {h.targetType === "minutes" ? "min" : "x"}
                  </span>
                )}
              </div>
            )}
          </PropertyRow>
        ))}

        <Separator />

        {/* Exercise */}
        <PropertyRow icon={<Dumbbell size={16} />} label="Exercício">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={240}
              value={record?.exerciseMinutes || ""}
              onChange={(e) => up({ exerciseMinutes: Math.min(240, Math.max(0, Number(e.target.value))) })}
              placeholder="0"
              className="w-16 h-8 text-sm border-0 bg-transparent p-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </div>
        </PropertyRow>
      </div>

      {/* Journal */}
      <Collapsible open={journalOpen} onOpenChange={setJournalOpen} className="mt-4">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full py-2 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <Pencil size={14} /> Diário (opcional)
            </span>
            <ChevronDown size={14} className={cn("transition-transform", journalOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
              placeholder="Liste coisas pelas quais é grata..."
              onSave={(v) => up({ noteGratitude: v })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PropertyRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1 min-h-[44px]">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function JournalBtn({ title, value, placeholder, onSave }: {
  title: string; value?: string; placeholder: string; onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value || "");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setText(value || ""); }}>
      <Button
        variant="outline"
        className="h-auto py-3 flex flex-col items-start text-left border-dashed"
        onClick={() => setOpen(true)}
      >
        <span className="text-sm font-medium flex items-center gap-2">
          <Pencil size={12} />
          {value ? "Editar: " : ""}{title}
        </span>
        {value && (
          <span className="text-xs text-muted-foreground truncate w-full mt-1">
            {value.slice(0, 50)}{value.length > 50 ? "..." : ""}
          </span>
        )}
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={4} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => { onSave(text); setOpen(false); toast("Registro salvo"); }}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
