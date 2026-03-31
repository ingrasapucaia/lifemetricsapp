import { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Goal, GoalStatus, LIFE_AREAS, GOAL_STATUSES, getLifeArea, getGoalStatus, STATUS_SORT_ORDER } from "@/types";
import { Plus, Target, ChevronDown, ChevronRight, Gift, ArrowUpDown, Filter, MoreVertical, Check, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LifeAreaBadge } from "@/components/LifeAreaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import LifeAreaCollapsible from "@/components/LifeAreaCollapsible";
import { toast } from "sonner";

type SortMode = "created" | "deadline" | "status";

const EMOJI_GRID = ["👟", "💧", "📚", "✏️", "🧘🏽", "💪🏼", "🏋🏽‍♀️", "🥗", "😴", "🎯", "💻", "🎨", "💰", "📖", "🌿", "🧃"];

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore();
  const { profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  

  // Form state
  const [formIcon, setFormIcon] = useState("🎯");
  const [formCustomEmoji, setFormCustomEmoji] = useState("");
  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState("");
  const [status, setStatus] = useState<GoalStatus>("nao_comecei");
  const [deadline, setDeadline] = useState("");
  const [reward, setReward] = useState("");
  const [aligned, setAligned] = useState(true);

  // Sort & Filter
  const [sortMode, setSortMode] = useState<SortMode>("created");
  const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
  const [hideFilters, setHideFilters] = useState<Record<string, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Collapsed groups
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  const activeGoals = goals.filter((g) => g.status !== "arquivada");

  // Apply filters
  const filteredGoals = useMemo(() => {
    const showActive = Object.entries(showFilters).filter(([, v]) => v);
    const hideActive = Object.entries(hideFilters).filter(([, v]) => v);

    let result = activeGoals;
    if (showActive.length > 0) {
      const showSet = new Set(showActive.map(([k]) => k));
      result = result.filter((g) => showSet.has(g.status));
    }
    if (hideActive.length > 0) {
      const hideSet = new Set(hideActive.map(([k]) => k));
      result = result.filter((g) => !hideSet.has(g.status));
    }
    return result;
  }, [activeGoals, showFilters, hideFilters]);

  // Sort
  const sortedGoals = useMemo(() => {
    const arr = [...filteredGoals];
    if (sortMode === "created") {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortMode === "deadline") {
      arr.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else if (sortMode === "status") {
      arr.sort((a, b) => {
        const ai = STATUS_SORT_ORDER.indexOf(a.status);
        const bi = STATUS_SORT_ORDER.indexOf(b.status);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    }
    return arr;
  }, [filteredGoals, sortMode]);

  const isFiltering = Object.values(showFilters).some(Boolean) || Object.values(hideFilters).some(Boolean);

  // Group by life area
  const grouped = useMemo(() => {
    const groups: Record<string, Goal[]> = {};
    sortedGoals.forEach((g) => {
      const area = g.lifeArea || "_sem_area";
      if (!groups[area]) groups[area] = [];
      groups[area].push(g);
    });
    return Object.entries(groups).sort(([aKey], [bKey]) => {
      if (aKey === "_sem_area") return 1;
      if (bKey === "_sem_area") return -1;
      return aKey.localeCompare(bKey);
    });
  }, [sortedGoals]);

  function toggleShowFilter(statusValue: string) {
    // Remove from hide if active there
    setHideFilters((prev) => ({ ...prev, [statusValue]: false }));
    setShowFilters((prev) => ({ ...prev, [statusValue]: !prev[statusValue] }));
  }

  function toggleHideFilter(statusValue: string) {
    setShowFilters((prev) => ({ ...prev, [statusValue]: false }));
    setHideFilters((prev) => ({ ...prev, [statusValue]: !prev[statusValue] }));
  }

  function resetForm() {
    setFormIcon("🎯");
    setFormCustomEmoji("");
    setTitle("");
    setLifeArea("");
    setStatus("nao_comecei");
    setDeadline("");
    setReward("");
    setAligned(true);
    setEditingGoal(null);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(g: Goal) {
    setEditingGoal(g);
    setFormIcon(g.icon || "🎯");
    setFormCustomEmoji("");
    setTitle(g.title);
    setLifeArea(g.lifeArea || "");
    setStatus(g.status);
    setDeadline(g.deadline || "");
    setReward(g.reward || "");
    setAligned(g.alignedWithGoal ?? true);
    setOpen(true);
  }

  function handleSubmit() {
    if (!title.trim() || !lifeArea) return;
    const icon = formCustomEmoji.trim() || formIcon;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: title.trim(),
        icon,
        lifeArea,
        status,
        deadline: deadline || undefined,
        reward: reward.trim() || undefined,
        alignedWithGoal: aligned,
      });
      if (status === "concluido" && editingGoal.status !== "concluido") {
        toast.success("Meta concluída! 🎉 Veja em Minhas Conquistas.");
      } else if (status !== "concluido" && editingGoal.status === "concluido") {
        toast("Meta reaberta. Conquista removida.");
      }
      toast.success("Meta atualizada!");
    } else {
      addGoal({
        title: title.trim(),
        icon,
        type: "meta",
        status,
        lifeArea,
        reward: reward.trim() || undefined,
        alignedWithGoal: aligned,
        deadline: deadline || undefined,
      });
    }
    resetForm();
    setOpen(false);
  }

  function handleStatusChange(goalId: string, newStatus: GoalStatus, e: React.MouseEvent) {
    e.stopPropagation();
    const goal = goals.find((g) => g.id === goalId);
    const oldStatus = goal?.status;
    updateGoal(goalId, { status: newStatus });
    if (newStatus === "concluido") toast.success("Meta concluída! 🎉 Veja em Minhas Conquistas.");
    else if (oldStatus === "concluido") toast("Meta reaberta. Conquista removida.");
  }

  function handleDelete(goalId: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteGoal(goalId);
    toast("Meta excluída.");
  }

  const lifeGoals = authProfile?.life_goals;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas</h1>
        <div className="flex items-center gap-2">
          {/* Sort button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs">
                <ArrowUpDown size={14} /> Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortMode("created")} className="gap-2">
                Data de criação (mais recente)
                {sortMode === "created" && <Check size={14} className="ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("deadline")} className="gap-2">
                Data de prazo (mais próximo)
                {sortMode === "deadline" && <Check size={14} className="ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode("status")} className="gap-2">
                Status
                {sortMode === "status" && <Check size={14} className="ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter button */}
          <div className="relative" ref={filterRef}>
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-1.5 rounded-xl text-xs", isFiltering && "border-primary text-primary")}
              onClick={() => setFilterOpen((p) => !p)}
            >
              <Filter size={14} /> Filtrar
            </Button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-card border border-border rounded-xl shadow-lg p-4 space-y-4 animate-in fade-in-0 zoom-in-95">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mostrar apenas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {GOAL_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => toggleShowFilter(s.value)}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-200 border",
                          showFilters[s.value]
                            ? "border-current"
                            : "bg-card border-border/60 text-muted-foreground hover:border-border",
                        )}
                        style={
                          showFilters[s.value]
                            ? { backgroundColor: s.bgColor, color: s.textColor, borderColor: s.textColor }
                            : undefined
                        }
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ocultar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {GOAL_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => toggleHideFilter(s.value)}
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-200 border",
                          hideFilters[s.value]
                            ? "border-dashed border-2"
                            : "bg-card border-border/60 text-muted-foreground hover:border-border",
                        )}
                        style={
                          hideFilters[s.value]
                            ? { borderColor: s.textColor, color: s.textColor, backgroundColor: "transparent" }
                            : undefined
                        }
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* New button */}
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={openCreate}>
            <Plus size={16} /> Nova
          </Button>
        </div>
      </div>

      {/* Filter counter */}
      {isFiltering && (
        <p className="text-xs text-muted-foreground">
          Exibindo {filteredGoals.length} de {activeGoals.length} metas
        </p>
      )}

      {/* Empty state */}
      {sortedGoals.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {isFiltering ? "Nenhuma meta encontrada com esses filtros." : "Nenhuma meta criada ainda."}
          </p>
          {!isFiltering && (
            <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={openCreate}>
              <Plus size={14} className="mr-1" /> Criar primeira meta
            </Button>
          )}
        </Card>
      )}

      {/* Grouped goals */}
      <div className="space-y-4">
        {grouped.map(([areaValue, areaGoals]) => {
          const area = getLifeArea(areaValue);
          const isCollapsed = collapsed[areaValue] ?? false;

          return (
            <Collapsible key={areaValue} open={!isCollapsed} onOpenChange={() => setCollapsed((p) => ({ ...p, [areaValue]: !p[areaValue] }))}>
              <CollapsibleTrigger className="flex items-center gap-2 mb-2 group">
                {isCollapsed ? <ChevronRight size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                {area ? (
                  <LifeAreaBadge value={areaValue} size="md" />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">Sem área definida</span>
                )}
                <span className="text-xs text-muted-foreground">({areaGoals.length})</span>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-2">
                {areaGoals.map((g) => (
                  <Card
                    key={g.id}
                    className="p-4 cursor-pointer hover:shadow-card-hover transition-all duration-200 relative"
                    onClick={() => navigate(`/metas/${g.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {g.icon && <span className="text-lg shrink-0">{g.icon}</span>}
                        <h3 className="font-medium text-[15px] text-foreground line-clamp-2">{g.title}</h3>
                      </div>

                      {/* 3-dot menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-1 rounded-lg hover:bg-muted/50 transition-colors shrink-0">
                            <MoreVertical size={16} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(g); }}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(g.id, e)}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status badge - clickable inline */}
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="focus:outline-none">
                            <StatusBadge status={g.status} onClick={() => {}} className="border border-border/80 shadow-sm" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {GOAL_STATUSES.map((s) => (
                            <DropdownMenuItem key={s.value} onClick={(e) => handleStatusChange(g.id, s.value, e)} className="gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.textColor }} />
                              {s.label}
                              {g.status === s.value && <Check size={14} className="ml-auto" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {g.deadline && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Prazo: {format(new Date(g.deadline + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                      </p>
                    )}

                    {g.reward && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                        <Gift size={12} />
                        <span className="truncate">{g.reward}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Create / Edit goal modal */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); setOpen(o); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar meta" : "Nova meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Emoji icon */}
            <div className="space-y-2">
              <Label>Ícone da meta</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_GRID.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { setFormIcon(emoji); setFormCustomEmoji(""); }}
                    className={cn(
                      "w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all duration-200 border-2",
                      formIcon === emoji && !formCustomEmoji ? "border-primary bg-primary/10" : "border-transparent bg-muted/50 hover:bg-muted",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Título da meta *</Label>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Treinar 3x por semana por 30 dias"
                className="rounded-xl min-h-[56px] resize-none"
                rows={2}
              />
            </div>

            {/* Life area */}
            <div className="space-y-2">
              <Label>Área de vida *</Label>
              <LifeAreaCollapsible
                value={lifeArea}
                onValueChange={setLifeArea}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border-2"
                    style={{
                      backgroundColor: s.bgColor,
                      color: s.textColor,
                      borderColor: status === s.value ? s.textColor : "transparent",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label>Prazo para concluir (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl", !deadline && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(new Date(deadline + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: pt }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline ? new Date(deadline + "T12:00:00") : undefined}
                    onSelect={(date) => setDeadline(date ? format(date, "yyyy-MM-dd") : "")}
                    locale={pt}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reward */}
            <div className="space-y-2">
              <Label>Recompensa (opcional)</Label>
              <Input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Ex: Uma viagem, um jantar especial..." className="rounded-xl" />
            </div>

            {/* Alignment */}
            <div className="space-y-2">
              <Label>Alinhamento com objetivo de vida</Label>
              {lifeGoals && <p className="text-xs text-muted-foreground italic">"{lifeGoals}"</p>}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">Alinhada com meu objetivo de vida</span>
                <Switch checked={aligned} onCheckedChange={setAligned} />
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full rounded-xl" disabled={!title.trim() || !lifeArea}>
              {editingGoal ? "Salvar alterações" : "Criar meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
