import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { LIFE_AREAS, getLifeArea } from "@/types";
import { Task, TaskInsert, TaskUpdate } from "@/hooks/useTasks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITY_COLORS = {
  alta: { bg: "#FCEBEB", text: "#A32D2D" },
  media: { bg: "#FDF3DC", text: "#7A5C00" },
  baixa: { bg: "#F1EFE8", text: "#5F5E5A" },
};

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultDate?: string;
  onSave: (data: TaskInsert | TaskUpdate, id?: string) => Promise<void>;
}

export default function TaskModal({ open, onOpenChange, task, defaultDate, onSave }: TaskModalProps) {
  const { goals } = useStore();
  const activeGoals = goals.filter((g) => g.status !== "concluido" && g.status !== "arquivada");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<"alta" | "media" | "baixa">("media");
  const [lifeAreas, setLifeAreas] = useState<string[]>([]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [reward, setReward] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title);
        setDate(task.date);
        setPriority(task.priority);
        setLifeAreas(task.life_areas || []);
        setGoalId(task.goal_id);
        setReward(task.reward || "");
        setNote(task.note || "");
      } else {
        setTitle("");
        setDate(defaultDate || new Date().toISOString().slice(0, 10));
        setPriority("media");
        setLifeAreas([]);
        setGoalId(null);
        setReward("");
        setNote("");
      }
    }
  }, [open, task, defaultDate]);

  const toggleArea = (value: string) => {
    setLifeAreas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data: TaskInsert = {
        title: title.trim(),
        date,
        priority,
        life_areas: lifeAreas.length > 0 ? lifeAreas : null,
        goal_id: goalId,
        reward: reward.trim() || null,
        note: note.trim() || null,
      };
      await onSave(data, task?.id);
      onOpenChange(false);
      toast.success(task ? "Tarefa atualizada!" : "Tarefa criada!");
    } catch {
      toast.error("Erro ao salvar tarefa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label>Título da tarefa</Label>
            <Textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que você precisa fazer?"
              className="rounded-xl min-h-[56px] resize-none"
              rows={2}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="flex gap-2">
              {(["alta", "media", "baixa"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 border-2",
                    priority === p ? "border-current" : "border-transparent"
                  )}
                  style={{
                    backgroundColor: PRIORITY_COLORS[p].bg,
                    color: PRIORITY_COLORS[p].text,
                    borderColor: priority === p ? PRIORITY_COLORS[p].text : "transparent",
                  }}
                >
                  {p === "alta" ? "Alta" : p === "media" ? "Média" : "Baixa"}
                </button>
              ))}
            </div>
          </div>

          {/* Life areas */}
          <div className="space-y-2">
            <Label>Área(s) de vida</Label>
            <div className="flex flex-wrap gap-2">
              {LIFE_AREAS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => toggleArea(a.value)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border-2"
                  )}
                  style={{
                    backgroundColor: a.bgColor,
                    color: a.textColor,
                    borderColor: lifeAreas.includes(a.value) ? a.textColor : "transparent",
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <Label>Meta associada (opcional)</Label>
            <Select value={goalId || "none"} onValueChange={(v) => setGoalId(v === "none" ? null : v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Associar a uma meta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {activeGoals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.icon && <span className="mr-1">{g.icon}</span>}
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reward */}
          <div className="space-y-2">
            <Label>Recompensa (opcional)</Label>
            <Input
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="Ex: Um episódio da série favorita"
              className="rounded-xl"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Nota (opcional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicionar uma nota..."
              className="rounded-xl min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          {/* Buttons */}
          <Button onClick={handleSubmit} disabled={!title.trim() || saving} className="w-full rounded-xl">
            {saving ? "Salvando..." : "Salvar tarefa"}
          </Button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
