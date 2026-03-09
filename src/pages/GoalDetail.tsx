import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { GOAL_PRIORITY_COLORS, GOAL_STATUS_COLORS, GoalAction } from "@/types";
import { ArrowLeft, Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

const PRIORITIES = ["importante", "urgente", "atrasado", "proximo"] as const;

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, updateGoal, deleteGoal, addGoalAction, updateGoalAction, deleteGoalAction, toggleGoalAction } = useStore();

  const goal = goals.find((g) => g.id === id);

  const [actionTitle, setActionTitle] = useState("");
  const [actionPriority, setActionPriority] = useState<GoalAction["priority"]>(undefined);
  const [editingAction, setEditingAction] = useState<GoalAction | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<GoalAction["priority"]>(undefined);
  const [editDeadlineOpen, setEditDeadlineOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);

  if (!goal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Meta não encontrada.</p>
        <Button variant="ghost" className="mt-4 rounded-xl" onClick={() => navigate("/metas")}>Voltar</Button>
      </div>
    );
  }

  const progress = goal.actions.length === 0 ? 0 : Math.round((goal.actions.filter((a) => a.completed).length / goal.actions.length) * 100);

  function handleAddAction() {
    if (!actionTitle.trim()) return;
    if (goal!.actions.length >= 30) {
      toast.error("Limite de 30 ações atingido.");
      return;
    }
    addGoalAction(goal!.id, { title: actionTitle.trim(), priority: actionPriority });
    setActionTitle("");
    setActionPriority(undefined);
  }

  function handleSaveEdit() {
    if (!editingAction || !editTitle.trim()) return;
    updateGoalAction(goal!.id, editingAction.id, { title: editTitle.trim(), priority: editPriority });
    setEditingAction(null);
  }

  function handleStatusChange(status: string) {
    updateGoal(goal!.id, { status: status as any });
    setStatusOpen(false);
    if (status === "concluída") toast.success("Meta concluída! Adicionada às conquistas. 🎉");
    if (status === "arquivada") {
      toast("Meta arquivada.");
      navigate("/metas");
    }
  }

  function handleSaveDeadline() {
    updateGoal(goal!.id, { deadline: newDeadline || undefined });
    setEditDeadlineOpen(false);
  }

  const statusColor = GOAL_STATUS_COLORS[goal.status];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 rounded-xl" onClick={() => navigate("/metas")}>
        <ArrowLeft size={16} /> Voltar
      </Button>

      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 rounded-full"
            style={{
              background: `hsl(${goal.type === "meta" ? "270 60% 92%" : "200 60% 92%"})`,
              color: `hsl(${goal.type === "meta" ? "270 50% 40%" : "200 50% 35%"})`,
            }}
          >
            {goal.type}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 cursor-pointer rounded-full"
            onClick={() => setStatusOpen(true)}
            style={{
              background: statusColor ? `hsl(${statusColor.bgHsl})` : undefined,
              color: statusColor ? `hsl(${statusColor.hsl})` : undefined,
            }}
          >
            {goal.status} ▾
          </Badge>
        </div>
        <h1 className="text-xl font-bold text-foreground">{goal.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Criada em {format(new Date(goal.createdAt), "dd MMM yyyy", { locale: pt })}</span>
          {goal.deadline ? (
            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => { setNewDeadline(goal.deadline || ""); setEditDeadlineOpen(true); }}>
              Prazo: {format(new Date(goal.deadline + "T12:00:00"), "dd MMM yyyy", { locale: pt })} ✎
            </span>
          ) : (
            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => { setNewDeadline(""); setEditDeadlineOpen(true); }}>
              + Adicionar prazo
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-3 flex-1" />
        <span className="text-sm font-bold text-foreground">{progress}%</span>
      </div>

      {/* Add action */}
      <Card className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Nova ação ({goal.actions.length}/30)
        </p>
        <div className="flex gap-2">
          <Input
            value={actionTitle}
            onChange={(e) => setActionTitle(e.target.value)}
            placeholder="Título da ação"
            className="flex-1 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
          />
          <Select value={actionPriority || ""} onValueChange={(v) => setActionPriority(v as any || undefined)}>
            <SelectTrigger className="w-32 rounded-xl">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: `hsl(${GOAL_PRIORITY_COLORS[p].hsl})` }} />
                    {p}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" className="rounded-xl" onClick={handleAddAction} disabled={!actionTitle.trim() || goal.actions.length >= 30}>
            <Plus size={16} />
          </Button>
        </div>
      </Card>

      {/* Actions list */}
      <div className="space-y-2">
        {goal.actions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma ação adicionada.</p>
        )}
        {goal.actions.map((action) => {
          const pColor = action.priority ? GOAL_PRIORITY_COLORS[action.priority] : null;
          return (
            <Card key={action.id} className="p-4 flex items-center gap-3 hover:shadow-card-hover transition-all duration-200">
              <Checkbox
                checked={action.completed}
                onCheckedChange={() => toggleGoalAction(goal.id, action.id)}
              />
              <span className={`flex-1 text-sm ${action.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {action.title}
              </span>
              {action.priority && pColor && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-2.5 py-0.5 rounded-full"
                  style={{
                    background: `hsl(${pColor.bgHsl})`,
                    color: `hsl(${pColor.hsl})`,
                  }}
                >
                  {action.priority}
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                onClick={() => { setEditingAction(action); setEditTitle(action.title); setEditPriority(action.priority); }}
              >
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive rounded-lg"
                onClick={() => deleteGoalAction(goal.id, action.id)}
              >
                <Trash2 size={14} />
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Delete goal */}
      <div className="pt-4 border-t">
        <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => { deleteGoal(goal.id); navigate("/metas"); toast("Meta excluída."); }}>
          <Trash2 size={14} className="mr-1.5" /> Excluir meta
        </Button>
      </div>

      {/* Edit action dialog */}
      <Dialog open={!!editingAction} onOpenChange={(o) => !o && setEditingAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar ação</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={editPriority || "none"} onValueChange={(v) => setEditPriority(v === "none" ? undefined : v as any)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveEdit} className="w-full rounded-xl">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status change dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar status</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {(["começar", "em progresso", "concluída", "arquivada"] as const).map((s) => {
              const sc = GOAL_STATUS_COLORS[s];
              return (
                <Button key={s} variant="outline" className="justify-start rounded-xl"
                  style={{ borderColor: `hsl(${sc.hsl})`, color: `hsl(${sc.hsl})` }}
                  onClick={() => handleStatusChange(s)}
                >
                  {goal.status === s && <Check size={14} className="mr-1.5" />}
                  {s}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit deadline dialog */}
      <Dialog open={editDeadlineOpen} onOpenChange={setEditDeadlineOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar prazo</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="rounded-xl" />
            <div className="flex gap-2">
              <Button onClick={handleSaveDeadline} className="flex-1 rounded-xl">Salvar</Button>
              {goal.deadline && (
                <Button variant="outline" className="rounded-xl" onClick={() => { updateGoal(goal.id, { deadline: undefined }); setEditDeadlineOpen(false); }}>
                  Remover
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
