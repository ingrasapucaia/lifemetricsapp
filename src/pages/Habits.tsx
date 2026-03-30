import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import {
  Habit, LIFE_AREAS, getLifeArea, HabitMetricType, HabitFrequency, HabitTimeUnit,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LifeAreaCollapsible from "@/components/LifeAreaCollapsible";
import { toast } from "sonner";
import { Plus, MoreVertical, Pencil, Trash2, ToggleLeft, CheckSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const HABIT_EMOJIS = [
  "👟", "💧", "📚", "✏️", "🧘🏽", "💪🏼", "🏋🏽‍♀️", "🥗", "😴", "🎯",
  "💻", "🎨", "💰", "📖", "🌿", "🧃", "🏃", "🎵", "☕", "🍎",
  "🧠", "⭐", "🔥", "💊", "🚴",
];

const METRIC_OPTIONS: { value: HabitMetricType; label: string }[] = [
  { value: "check", label: "Check" },
  { value: "tempo", label: "Tempo" },
  { value: "numero", label: "Número" },
  { value: "km", label: "Quilômetros" },
  { value: "milhas", label: "Milhas" },
  { value: "calorias", label: "Calorias" },
  { value: "litros", label: "Litros" },
  { value: "reais", label: "R$" },
  { value: "dolar", label: "US$" },
  { value: "euro", label: "€" },
  { value: "personalizado", label: "Personalizado" },
];

const FREQ_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "diario", label: "Diário" },
  { value: "dias_uteis", label: "Dias úteis" },
  { value: "semanal", label: "Semanal" },
  { value: "personalizado", label: "Personalizado" },
];

const WEEKDAYS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

function getMetricLabel(h: Habit): string {
  const mt = h.metricType || (h.targetType === "check" ? "check" : h.targetType === "minutes" ? "tempo" : h.targetType === "km" ? "km" : h.targetType === "miles" ? "milhas" : h.targetType === "count" ? "numero" : "check");
  const found = METRIC_OPTIONS.find((o) => o.value === mt);
  if (mt === "personalizado" && h.metricUnit) return h.metricUnit;
  if (mt === "tempo" && h.metricTimeUnit) {
    const units: Record<string, string> = { horas: "Horas", minutos: "Minutos", segundos: "Segundos" };
    return units[h.metricTimeUnit] || "Tempo";
  }
  return found?.label || "Check";
}

function getFreqLabel(h: Habit): string {
  const f = h.frequency || "diario";
  return FREQ_OPTIONS.find((o) => o.value === f)?.label || "Diário";
}

export default function Habits() {
  const { habits, addHabit, updateHabit, deleteHabit } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [delTarget, setDelTarget] = useState<string | null>(null);

  // Group habits by life area
  const grouped = habits.reduce<Record<string, Habit[]>>((acc, h) => {
    const area = h.lifeArea || "_sem_area";
    if (!acc[area]) acc[area] = [];
    acc[area].push(h);
    return acc;
  }, {});

  const areaOrder = LIFE_AREAS.map((a) => a.value);
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "_sem_area") return 1;
    if (b === "_sem_area") return -1;
    return areaOrder.indexOf(a) - areaOrder.indexOf(b);
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (h: Habit) => { setEditing(h); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Controle de hábitos</h1>
        </div>
        <Button onClick={openCreate} className="rounded-xl gap-2">
          <Plus size={16} /> Criar novo hábito
        </Button>
      </div>

      {habits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare size={40} className="text-muted-foreground/40 mb-4" />
            <p className="text-base font-medium text-foreground">Nenhum hábito criado ainda</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Comece criando seu primeiro hábito para acompanhar sua rotina.
            </p>
            <Button onClick={openCreate} className="rounded-xl gap-2">
              <Plus size={16} /> Criar meu primeiro hábito
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedKeys.map((areaKey) => {
            const area = getLifeArea(areaKey);
            const areaLabel = area?.label || "Sem área";
            return (
              <div key={areaKey}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                  {areaLabel}
                </p>
                <div className="space-y-2">
                  {grouped[areaKey].map((h) => (
                    <HabitCard
                      key={h.id}
                      habit={h}
                      onEdit={() => openEdit(h)}
                      onToggle={() => {
                        updateHabit(h.id, { active: !h.active });
                        toast(h.active ? "Hábito desativado" : "Hábito ativado");
                      }}
                      onDelete={() => setDelTarget(h.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HabitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSave={(data) => {
          if (editing) {
            updateHabit(editing.id, data);
            toast("Hábito atualizado");
          } else {
            addHabit(data);
            toast("Hábito criado");
          }
          setModalOpen(false);
        }}
      />

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar hábito?</AlertDialogTitle>
            <AlertDialogDescription>O hábito será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteHabit(delTarget!); setDelTarget(null); toast("Hábito deletado"); }}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function HabitCard({ habit: h, onEdit, onToggle, onDelete }: {
  habit: Habit;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const area = getLifeArea(h.lifeArea);
  return (
    <Card className={cn("transition-opacity duration-200", !h.active && "opacity-50")}>
      <CardContent className="p-4 flex items-center gap-3">
        {h.icon && /[^\x00-\x7F]/.test(h.icon) && <span className="text-[28px] leading-none shrink-0">{h.icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-medium truncate">{h.name}</span>
            {!h.active && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                Inativo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {area && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: area.bgColor, color: area.textColor }}
              >
                {area.label}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">{getFreqLabel(h)}</span>
            <span className="text-[11px] text-muted-foreground">• {getMetricLabel(h)}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil size={14} className="mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              <ToggleLeft size={14} className="mr-2" /> {h.active ? "Desativar" : "Ativar"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 size={14} className="mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

function HabitModal({ open, onClose, editing, onSave }: {
  open: boolean;
  onClose: () => void;
  editing: Habit | null;
  onSave: (data: Omit<Habit, "id" | "createdAt">) => void;
}) {
  const [icon, setIcon] = useState("");
  const [name, setName] = useState("");
  const [metricType, setMetricType] = useState<HabitMetricType>("check");
  const [metricUnit, setMetricUnit] = useState("");
  const [metricTimeUnit, setMetricTimeUnit] = useState<HabitTimeUnit>("minutos");
  const [dailyGoal, setDailyGoal] = useState<number | "">("");
  const [lifeArea, setLifeArea] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("diario");
  const [frequencyDays, setFrequencyDays] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Map old targetType to new metricType
  const mapOldType = (h: Habit): HabitMetricType => {
    if (h.metricType) return h.metricType;
    const map: Record<string, HabitMetricType> = {
      check: "check", minutes: "tempo", count: "numero", hours_minutes: "tempo", km: "km", miles: "milhas",
    };
    return map[h.targetType] || "check";
  };

  // Reset on open
  const resetForm = () => {
    if (editing) {
      setIcon(editing.icon || "✅");
      setName(editing.name);
      setMetricType(mapOldType(editing));
      setMetricUnit(editing.metricUnit || "");
      setMetricTimeUnit(editing.metricTimeUnit || "minutos");
      setDailyGoal(editing.dailyGoal ?? editing.targetValue ?? "");
      setLifeArea(editing.lifeArea || "");
      setFrequency(editing.frequency || "diario");
      setFrequencyDays(editing.frequencyDays || []);
      setReminderTime(editing.reminderTime || "");
    } else {
      setIcon("✅");
      setName("");
      setMetricType("check");
      setMetricUnit("");
      setMetricTimeUnit("minutos");
      setDailyGoal("");
      setLifeArea("");
      setFrequency("diario");
      setFrequencyDays([]);
      setReminderTime("");
    }
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open, editing]);

  // Reset when editing changes or modal opens
  const handleOpenChange = (o: boolean) => {
    if (o) resetForm();
    else onClose();
  };

  // Map new metricType back to legacy targetType for compat
  const mapToTargetType = (): Habit["targetType"] => {
    const map: Record<HabitMetricType, Habit["targetType"]> = {
      check: "check", tempo: "hours_minutes", numero: "count", km: "km",
      milhas: "miles", calorias: "count", litros: "count", reais: "count",
      dolar: "count", euro: "count", personalizado: "count",
    };
    return map[metricType] || "check";
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    onSave({
      name: name.trim(),
      icon,
      targetType: mapToTargetType(),
      targetValue: dailyGoal ? Number(dailyGoal) : undefined,
      active: editing?.active ?? true,
      showOnDashboard: editing?.showOnDashboard ?? true,
      lifeArea: lifeArea || undefined,
      frequency,
      frequencyDays: (frequency === "semanal" || frequency === "personalizado") ? frequencyDays : undefined,
      metricType,
      metricUnit: metricType === "personalizado" ? metricUnit : undefined,
      metricTimeUnit: metricType === "tempo" ? metricTimeUnit : undefined,
      dailyGoal: dailyGoal ? Number(dailyGoal) : undefined,
      reminderTime: reminderTime || undefined,
    });
  };

  const showDailyGoal = metricType !== "check";
  const showTimeUnit = metricType === "tempo";
  const showCustomUnit = metricType === "personalizado";
  const showDaySelector = frequency === "semanal" || frequency === "personalizado";

  const unitSuffix = (): string => {
    const map: Record<string, string> = {
      numero: "", km: "km", milhas: "mi", calorias: "cal", litros: "L", reais: "R$", dolar: "US$", euro: "€",
    };
    if (metricType === "tempo") {
      return metricTimeUnit === "horas" ? "h" : metricTimeUnit === "segundos" ? "s" : "min";
    }
    if (metricType === "personalizado") return metricUnit || "";
    return map[metricType] || "";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar hábito" : "Criar hábito"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Icon + Title */}
          <div className="flex gap-3 items-start">
            <div>
              <button
                type="button"
                onClick={() => setEmojiOpen(!emojiOpen)}
                className="w-12 h-12 rounded-xl border border-input bg-background flex items-center justify-center text-2xl hover:bg-muted/50 transition-colors"
              >
                {icon}
              </button>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Título</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do hábito" />
            </div>
          </div>

          {emojiOpen && (
            <div className="grid grid-cols-8 gap-2 p-3 rounded-xl border border-input bg-background">
              {HABIT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setIcon(e); setEmojiOpen(false); }}
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-muted transition-colors",
                    icon === e && "bg-primary/10 ring-2 ring-primary"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Metric Type */}
          <div className="space-y-2">
            <Label>Como medir?</Label>
            <div className="flex flex-wrap gap-2">
              {METRIC_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setMetricType(o.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200",
                    metricType === o.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted/50"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {showTimeUnit && (
            <div className="space-y-2">
              <Label>Unidade de tempo</Label>
              <div className="flex gap-2">
                {(["horas", "minutos", "segundos"] as HabitTimeUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setMetricTimeUnit(u)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 capitalize",
                      metricTimeUnit === u
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-muted/50"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showCustomUnit && (
            <div className="space-y-1.5">
              <Label>Nome da unidade</Label>
              <Input value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)} placeholder="Ex: páginas, copos, sessões..." />
            </div>
          )}

          {showDailyGoal && (
            <div className="space-y-1.5">
              <Label>Meta diária (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step={metricType === "km" || metricType === "milhas" ? 0.1 : 1}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ex: 2"
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">{unitSuffix()}</span>
              </div>
            </div>
          )}

          {/* Life Area */}
          <div className="space-y-2">
            <Label>Área de vida</Label>
            <LifeAreaCollapsible value={lifeArea} onValueChange={setLifeArea} />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <div className="flex flex-wrap gap-2">
              {FREQ_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setFrequency(o.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200",
                    frequency === o.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted/50"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {showDaySelector && (
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    setFrequencyDays((prev) =>
                      prev.includes(d.value) ? prev.filter((v) => v !== d.value) : [...prev, d.value]
                    );
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200",
                    frequencyDays.includes(d.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted/50"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Reminder */}
          <div className="space-y-1.5">
            <Label>Lembrete (opcional)</Label>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-muted-foreground" />
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-32"
                placeholder="--:--"
              />
            </div>
          </div>

          {/* Buttons */}
          <Button onClick={handleSave} className="w-full rounded-xl">
            Salvar hábito
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
