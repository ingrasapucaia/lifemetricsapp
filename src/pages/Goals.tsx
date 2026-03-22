import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Goal, GoalStatus, LIFE_AREAS, GOAL_STATUSES, getLifeArea, getGoalStatus, STATUS_SORT_ORDER } from "@/types";
import { Plus, Target, ChevronDown, ChevronRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LifeAreaBadge } from "@/components/LifeAreaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type FilterMode = "is" | "not" | null;

function getProgress(g: Goal) {
  if (g.actions.length === 0) return 0;
  return Math.round((g.actions.filter((a) => a.completed).length / g.actions.length) * 100);
}

export default function Goals() {
  const { goals, addGoal } = useStore();
  const { profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState("");
  const [status, setStatus] = useState<GoalStatus>("nao_comecei");
  const [deadline, setDeadline] = useState("");
  const [reward, setReward] = useState("");
  const [aligned, setAligned] = useState(true);

  // Filter state: map of status value → filter mode
  const [filters, setFilters] = useState<Record<string, FilterMode>>({});

  // Collapsed groups
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const activeGoals = goals.filter((g) => g.status !== "arquivada");

  // Apply filters
  const filteredGoals = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([, mode]) => mode !== null);
    if (activeFilters.length === 0) return activeGoals;

    return activeGoals.filter((g) => {
      return activeFilters.every(([statusKey, mode]) => {
        if (mode === "is") return g.status === statusKey;
        if (mode === "not") return g.status !== statusKey;
        return true;
      });
    });
  }, [activeGoals, filters]);

  const isFiltering = Object.values(filters).some((f) => f !== null);

  // Group by life area, sorted by status priority
  const grouped = useMemo(() => {
    const groups: Record<string, Goal[]> = {};
    filteredGoals.forEach((g) => {
      const area = g.lifeArea || "_sem_area";
      if (!groups[area]) groups[area] = [];
      groups[area].push(g);
    });

    // Sort goals within each group by status order
    Object.values(groups).forEach((arr) => {
      arr.sort((a, b) => {
        const ai = STATUS_SORT_ORDER.indexOf(a.status);
        const bi = STATUS_SORT_ORDER.indexOf(b.status);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    });

    // Sort groups: areas with em_progresso first, then by name
    return Object.entries(groups).sort(([aKey, aGoals], [bKey, bGoals]) => {
      const aPrio = Math.min(...aGoals.map((g) => STATUS_SORT_ORDER.indexOf(g.status)).filter((i) => i !== -1), 99);
      const bPrio = Math.min(...bGoals.map((g) => STATUS_SORT_ORDER.indexOf(g.status)).filter((i) => i !== -1), 99);
      if (aPrio !== bPrio) return aPrio - bPrio;
      return aKey.localeCompare(bKey);
    });
  }, [filteredGoals]);

  function toggleFilter(statusValue: string) {
    setFilters((prev) => {
      const current = prev[statusValue] || null;
      let next: FilterMode;
      if (current === null) next = "is";
      else if (current === "is") next = "not";
      else next = null;
      return { ...prev, [statusValue]: next };
    });
  }

  function handleAdd() {
    if (!title.trim() || !lifeArea) return;
    addGoal({
      title: title.trim(),
      type: "meta",
      status,
      lifeArea,
      reward: reward.trim() || undefined,
      alignedWithGoal: aligned,
      deadline: deadline || undefined,
    });
    setTitle("");
    setLifeArea("");
    setStatus("nao_comecei");
    setDeadline("");
    setReward("");
    setAligned(true);
    setOpen(false);
  }

  function toggleCollapse(area: string) {
    setCollapsed((prev) => ({ ...prev, [area]: !prev[area] }));
  }

  function openNewWithArea(area: string) {
    setLifeArea(area);
    setTitle("");
    setStatus("nao_comecei");
    setDeadline("");
    setReward("");
    setAligned(true);
    setOpen(true);
  }

  const lifeGoals = authProfile?.life_goals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas de Vida</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas metas e projetos</p>
        </div>
        <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova meta
        </Button>
      </div>

      {/* Filter chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {GOAL_STATUSES.map((s) => {
            const mode = filters[s.value] || null;
            return (
              <button
                key={s.value}
                onClick={() => toggleFilter(s.value)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border",
                  mode === null && "bg-card border-border/60 text-muted-foreground hover:border-border",
                  mode === "is" && "border-transparent",
                  mode === "not" && "border-dashed border-2",
                )}
                style={
                  mode === "is"
                    ? { backgroundColor: s.bgColor, color: s.textColor }
                    : mode === "not"
                    ? { borderColor: s.textColor, color: s.textColor, backgroundColor: "transparent" }
                    : undefined
                }
              >
                {mode === "is" && "É "}
                {mode === "not" && "Não é "}
                {s.label}
              </button>
            );
          })}
        </div>
        {isFiltering && (
          <p className="text-xs text-muted-foreground">
            Exibindo {filteredGoals.length} de {activeGoals.length} metas
          </p>
        )}
      </div>

      {/* Empty state */}
      {filteredGoals.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {isFiltering ? "Nenhuma meta encontrada com esses filtros." : "Nenhuma meta criada ainda."}
          </p>
          {!isFiltering && (
            <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => setOpen(true)}>
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
            <Collapsible key={areaValue} open={!isCollapsed} onOpenChange={() => toggleCollapse(areaValue)}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <CollapsibleTrigger className="flex items-center gap-2 group">
                  {isCollapsed ? <ChevronRight size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  {area ? (
                    <LifeAreaBadge value={areaValue} size="md" />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">Sem área definida</span>
                  )}
                  <span className="text-xs text-muted-foreground">({areaGoals.length} {areaGoals.length === 1 ? "meta" : "metas"})</span>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => openNewWithArea(areaValue)}
                >
                  <Plus size={12} /> Adicionar meta
                </Button>
              </div>

              <CollapsibleContent className="space-y-2">
                {areaGoals.map((g) => {
                  const progress = getProgress(g);
                  const statusConfig = getGoalStatus(g.status);

                  return (
                    <Card
                      key={g.id}
                      className="p-4 cursor-pointer hover:shadow-card-hover transition-all duration-200"
                      onClick={() => navigate(`/metas/${g.id}`)}
                    >
                      <h3 className="font-medium text-[15px] text-foreground truncate">{g.title}</h3>

                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={g.status} />
                        {g.deadline && (
                          <span className="text-[11px] text-muted-foreground">
                            Prazo: {format(new Date(g.deadline + "T12:00:00"), "dd MMM yyyy", { locale: pt })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">{progress}%</span>
                      </div>

                      {g.reward && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                          <Gift size={12} />
                          <span className="truncate">{g.reward}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* New goal modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label>Título da meta *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Treinar 3x por semana por 30 dias"
                className="rounded-xl"
              />
            </div>

            {/* Life area */}
            <div className="space-y-2">
              <Label>Área de vida *</Label>
              <div className="grid grid-cols-2 gap-2">
                {LIFE_AREAS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setLifeArea(a.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border-2",
                      lifeArea === a.value
                        ? "border-current"
                        : "border-transparent",
                    )}
                    style={{
                      backgroundColor: a.bgColor,
                      color: a.textColor,
                      borderColor: lifeArea === a.value ? a.textColor : "transparent",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.textColor }} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status inicial</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border-2",
                      status === s.value ? "border-current" : "border-transparent",
                    )}
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
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Reward */}
            <div className="space-y-2">
              <Label>Recompensa (opcional)</Label>
              <Input
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="Ex: Uma viagem, um jantar especial, um dia de spa..."
                className="rounded-xl"
              />
            </div>

            {/* Goal alignment */}
            <div className="space-y-2">
              <Label>Alinhamento com objetivo de vida</Label>
              {lifeGoals && (
                <p className="text-xs text-muted-foreground italic">"{lifeGoals}"</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">Essa meta está alinhada com seu objetivo de vida?</span>
                <Switch checked={aligned} onCheckedChange={setAligned} />
              </div>
            </div>

            <Button
              onClick={handleAdd}
              className="w-full rounded-xl"
              disabled={!title.trim() || !lifeArea}
            >
              Criar meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
