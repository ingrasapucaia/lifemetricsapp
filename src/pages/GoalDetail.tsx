import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { GOAL_PRIORITY_COLORS, GOAL_STATUSES, GoalAction, GoalStatus, LIFE_AREAS, getLifeArea } from "@/types";
import { ArrowLeft, Plus, Pencil, Trash2, Check, Gift, Target, MoreVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LifeAreaBadge } from "@/components/LifeAreaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRIORITIES = ["importante", "urgente", "atrasado", "proximo"] as const;
const EMOJI_GRID = ["👟", "💧", "📚", "✏️", "🧘🏽", "💪🏼", "🏋🏽‍♀️", "🥗", "😴", "🎯", "💻", "🎨", "💰", "📖", "🌿", "🧃"];

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, updateGoal, deleteGoal, addGoalAction, updateGoalAction, deleteGoalAction, toggleGoalAction } = useStore();
  const { profile: authProfile } = useAuth();

  const goal = goals.find((g) => g.id === id);

  const [actionTitle, setActionTitle] = useState("");
  const [actionPriority, setActionPriority] = useState<GoalAction["priority"]>(undefined);
  const [editingAction, setEditingAction] = useState<GoalAction | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<GoalAction["priority"]>(undefined);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit goal form
  const [editIcon, setEditIcon] = useState("");
  const [editCustomEmoji, setEditCustomEmoji] = useState("");
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editLifeArea, setEditLifeArea] = useState("");
  const [editStatus, setEditStatus] = useState<GoalStatus>("nao_comecei");
  const [editDeadline, setEditDeadline] = useState("");
  const [editReward, setEditReward] = useState("");
  const [editAligned, setEditAligned] = useState(true);

  if (!goal) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Meta não encontrada.</p>
        <Button variant="ghost" className="mt-4 rounded-xl" onClick={() => navigate("/metas")}>Voltar</Button>
      </div>
    );
  }

  const progress = goal.actions.length === 0 ? 0 : Math.round((goal.actions.filter((a) => a.completed).length / goal.actions.length) * 100);
  const lifeGoals = authProfile?.life_goals;

  function handleAddAction() {
    if (!actionTitle.trim()) return;
    addGoalAction(goal!.id, { title: actionTitle.trim(), priority: actionPriority });
    setActionTitle("");
    setActionPriority(undefined);
  }

  function handleSaveEdit() {
    if (!editingAction || !editTitle.trim()) return;
    updateGoalAction(goal!.id, editingAction.id, { title: editTitle.trim(), priority: editPriority });
    setEditingAction(null);
  }

  function handleStatusChange(newStatus: GoalStatus) {
    updateGoal(goal!.id, { status: newStatus });
    if (newStatus === "concluido") toast.success("Meta concluída! 🎉 Conquista desbloqueada.");
    if (newStatus === "arquivada") {
      toast("Meta arquivada.");
      navigate("/metas");
    }
  }

  function handleIconChange(emoji: string) {
    updateGoal(goal!.id, { icon: emoji });
  }

  function openEditGoal() {
    setEditIcon(goal!.icon || "🎯");
    setEditCustomEmoji("");
    setEditGoalTitle(goal!.title);
    setEditLifeArea(goal!.lifeArea || "");
    setEditStatus(goal!.status);
    setEditDeadline(goal!.deadline || "");
    setEditReward(goal!.reward || "");
    setEditAligned(goal!.alignedWithGoal ?? true);
    setEditModalOpen(true);
  }

  function handleSaveGoal() {
    if (!editGoalTitle.trim()) return;
    const icon = editCustomEmoji.trim() || editIcon;
    const oldStatus = goal!.status;
    updateGoal(goal!.id, {
      title: editGoalTitle.trim(),
      icon,
      lifeArea: editLifeArea || undefined,
      status: editStatus,
      deadline: editDeadline || undefined,
      reward: editReward.trim() || undefined,
      alignedWithGoal: editAligned,
    });
    if (editStatus === "concluido" && oldStatus !== "concluido") {
      toast.success("Meta concluída! 🎉 Conquista desbloqueada.");
    }
    setEditModalOpen(false);
    toast.success("Meta atualizada!");
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 rounded-xl" onClick={() => navigate("/metas")}>
        <ArrowLeft size={16} /> Voltar
      </Button>

      {/* Header */}
      <div>
        {/* Emoji icon - clickable */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-4xl mb-2 hover:scale-110 transition-transform focus:outline-none">
              {goal.icon || <span className="text-2xl text-muted-foreground bg-muted/50 w-12 h-12 rounded-xl flex items-center justify-center">+</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-3 w-auto">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_GRID.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleIconChange(emoji)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-lg flex items-center justify-center hover:bg-muted transition-colors",
                    goal.icon === emoji && "bg-primary/10"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-medium text-foreground">{goal.title}</h1>
          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0">
                <MoreVertical size={18} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openEditGoal}>Editar meta</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => { deleteGoal(goal.id); navigate("/metas"); toast("Meta excluída."); }}>
                Excluir meta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Life area badge */}
        <div className="mt-2">
          <LifeAreaBadge value={goal.lifeArea} size="md" />
        </div>

        {/* Status dropdown */}
        <div className="mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <StatusBadge status={goal.status} size="lg" onClick={() => {}} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {GOAL_STATUSES.map((s) => (
                <DropdownMenuItem key={s.value} onClick={() => handleStatusChange(s.value)} className="gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.textColor }} />
                  {s.label}
                  {goal.status === s.value && <Check size={14} className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>Criada em {format(new Date(goal.createdAt), "dd MMM yyyy", { locale: pt })}</span>
          {goal.deadline && (
            <span>Prazo: {format(new Date(goal.deadline + "T12:00:00"), "dd MMM yyyy", { locale: pt })}</span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-3 flex-1" />
        <span className="text-sm font-bold text-foreground">{progress}%</span>
      </div>

      {/* Loose info (no card) */}
      <div className="space-y-1.5">
        {goal.reward && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Gift size={14} className="text-muted-foreground shrink-0" />
            <span>{goal.reward}</span>
          </div>
        )}
        {goal.alignedWithGoal && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Target size={14} className="text-muted-foreground shrink-0" />
            <span>Alinhada com seu objetivo</span>
          </div>
        )}
      </div>

      {/* Actions section */}
      <Card className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Ações ({goal.actions.length}/50)
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
          <Button size="icon" className="rounded-xl" onClick={handleAddAction} disabled={!actionTitle.trim() || goal.actions.length >= 50}>
            <Plus size={16} />
          </Button>
        </div>
      </Card>

      {/* Actions list */}
      <div className="space-y-2">
        {goal.actions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Adicione ações para acompanhar seu progresso</p>
        )}
        {goal.actions.map((action) => {
          const pColor = action.priority ? GOAL_PRIORITY_COLORS[action.priority] : null;
          return (
            <Card key={action.id} className="p-4 flex items-center gap-3 hover:shadow-card-hover transition-all duration-200">
              <Checkbox checked={action.completed} onCheckedChange={() => toggleGoalAction(goal.id, action.id)} />
              <span className={`flex-1 text-sm ${action.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {action.title}
              </span>
              {action.priority && pColor && (
                <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 rounded-full"
                  style={{ background: `hsl(${pColor.bgHsl})`, color: `hsl(${pColor.hsl})` }}>
                  {action.priority}
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"
                onClick={() => { setEditingAction(action); setEditTitle(action.title); setEditPriority(action.priority); }}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive rounded-lg"
                onClick={() => deleteGoalAction(goal.id, action.id)}>
                <Trash2 size={14} />
              </Button>
            </Card>
          );
        })}
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
                  {PRIORITIES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveEdit} className="w-full rounded-xl">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit goal dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar meta</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Emoji */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_GRID.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => { setEditIcon(emoji); setEditCustomEmoji(""); }}
                    className={cn("w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-200 border-2",
                      editIcon === emoji && !editCustomEmoji ? "border-primary bg-primary/10" : "border-transparent bg-muted/50 hover:bg-muted"
                    )}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Textarea value={editGoalTitle} onChange={(e) => setEditGoalTitle(e.target.value)} className="rounded-xl min-h-[56px] resize-none" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Área de vida</Label>
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm transition-colors hover:bg-muted/50">
                  {editLifeArea ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: getLifeArea(editLifeArea)?.bgColor, color: getLifeArea(editLifeArea)?.textColor }}>
                      {getLifeArea(editLifeArea)?.label}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Selecionar área de vida</span>
                  )}
                  <ChevronDown size={16} className="text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {LIFE_AREAS.map((a) => (
                      <button key={a.value} type="button" onClick={() => setEditLifeArea(a.value)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border-2"
                        style={{ backgroundColor: a.bgColor, color: a.textColor, borderColor: editLifeArea === a.value ? a.textColor : "transparent" }}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_STATUSES.map((s) => (
                  <button key={s.value} type="button" onClick={() => setEditStatus(s.value)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border-2"
                    style={{ backgroundColor: s.bgColor, color: s.textColor, borderColor: editStatus === s.value ? s.textColor : "transparent" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Recompensa</Label>
              <Input value={editReward} onChange={(e) => setEditReward(e.target.value)} placeholder="Ex: Uma viagem..." className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Alinhamento</Label>
              {lifeGoals && <p className="text-xs text-muted-foreground italic">"{lifeGoals}"</p>}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">Alinhada com meu objetivo de vida</span>
                <Switch checked={editAligned} onCheckedChange={setEditAligned} />
              </div>
            </div>
            <Button onClick={handleSaveGoal} className="w-full rounded-xl" disabled={!editGoalTitle.trim()}>Salvar alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
