import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLifeArea } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInCalendarDays, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type FilterDays = 3 | 7 | 14 | 30;

interface DeadlineItem {
  id: string;
  title: string;
  type: "meta";
  deadline: string;
  lifeAreas: string[];
  progress?: number;
  priority?: string;
}

const FILTERS: { label: string; value: FilterDays }[] = [
  { label: "3 dias", value: 3 },
  { label: "7 dias", value: 7 },
  { label: "14 dias", value: 14 },
  { label: "1 mês", value: 30 },
];


export default function Deadlines() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterDays>(7);
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = format(new Date(), "yyyy-MM-dd");
    const end = format(addDays(new Date(), filter), "yyyy-MM-dd");

    const [goalsRes, acksRes, actionsRes] = await Promise.all([
      supabase
        .from("goals")
        .select("id, title, life_area, deadline, status")
        .eq("user_id", user.id)
        .neq("status", "concluido")
        .not("deadline", "is", null)
        .gte("deadline", today)
        .lte("deadline", end),
      supabase
        .from("deadline_acknowledgments")
        .select("item_id, item_type")
        .eq("user_id", user.id),
      supabase
        .from("goal_actions")
        .select("goal_id, completed"),
    ]);

    const ackSet = new Set(
      (acksRes.data || []).map((a: any) => `${a.item_type}:${a.item_id}`)
    );
    setAcknowledged(ackSet);

    // Calculate goal progress
    const actionsByGoal: Record<string, { total: number; done: number }> = {};
    for (const a of actionsRes.data || []) {
      if (!actionsByGoal[a.goal_id]) actionsByGoal[a.goal_id] = { total: 0, done: 0 };
      actionsByGoal[a.goal_id].total++;
      if (a.completed) actionsByGoal[a.goal_id].done++;
    }

    const goalItems: DeadlineItem[] = (goalsRes.data || []).map((g: any) => {
      const stats = actionsByGoal[g.id];
      const progress = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
      return {
        id: g.id,
        title: g.title,
        type: "meta" as const,
        deadline: g.deadline,
        lifeAreas: g.life_area ? [g.life_area] : [],
        progress,
      };
    });


    const all = [...goalItems]
      .sort((a, b) => a.deadline.localeCompare(b.deadline));

    setItems(all);
    setDismissed(new Set());
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getItemKey = (item: DeadlineItem) => `meta:${item.id}`;

  const handleAcknowledge = async (item: DeadlineItem) => {
    if (!user) return;
    const key = getItemKey(item);
    if (acknowledged.has(key)) return;

    const itemType = "meta";
    await supabase.from("deadline_acknowledgments").insert({
      user_id: user.id,
      item_id: item.id,
      item_type: itemType,
    });
    setAcknowledged((prev) => new Set(prev).add(key));
    toast.success("Marcado como ciente");
  };

  const handleDismiss = async (item: DeadlineItem) => {
    if (!user) return;
    const key = getItemKey(item);
    // Save acknowledgment if not already saved
    if (!acknowledged.has(key)) {
      const itemType = "meta";
      await supabase.from("deadline_acknowledgments").insert({
        user_id: user.id,
        item_id: item.id,
        item_type: itemType,
      });
      setAcknowledged((prev) => new Set(prev).add(key));
    }
    setDismissed((prev) => new Set(prev).add(item.id));
  };

  const handleClearAll = async () => {
    if (!user) return;
    const toAcknowledge = visibleItems.filter((item) => !acknowledged.has(getItemKey(item)));

    if (toAcknowledge.length > 0) {
      const inserts = toAcknowledge.map((item) => ({
        user_id: user.id,
        item_id: item.id,
        item_type: "meta",
      }));
      await supabase.from("deadline_acknowledgments").insert(inserts);
      setAcknowledged((prev) => {
        const next = new Set(prev);
        toAcknowledge.forEach((item) => next.add(getItemKey(item)));
        return next;
      });
    }

    setDismissed((prev) => {
      const next = new Set(prev);
      visibleItems.forEach((item) => next.add(item.id));
      return next;
    });
    toast.success("Todos os lembretes foram limpos");
  };

  // Items visible on screen (not dismissed)
  const visibleItems = useMemo(
    () => items.filter((i) => !dismissed.has(i.id)),
    [items, dismissed]
  );

  const renderDeadlineLabel = (deadline: string) => {
    const d = new Date(deadline + "T00:00:00");
    if (isToday(d)) return <span className="text-[#A32D2D] font-medium text-xs">Vence hoje</span>;
    if (isTomorrow(d)) return <span className="text-[#B45309] font-medium text-xs">Vence amanhã</span>;
    const days = differenceInCalendarDays(d, new Date());
    return <span className="text-muted-foreground text-xs">Vence em {days} dias</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Prazos e lembretes</h1>
          <p className="text-xs text-muted-foreground mt-1">Acompanhe o que está se aproximando</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Counter + clear button */}
      {!loading && visibleItems.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {visibleItems.length} {visibleItems.length === 1 ? "item" : "itens"} com prazo nos próximos {filter} dias
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Limpar lembretes
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar lembretes</AlertDialogTitle>
                <AlertDialogDescription>
                  Limpar todos os {visibleItems.length} lembretes desta lista?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>Limpar tudo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && visibleItems.length === 0 && (
        <Card className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <CheckCircle2 size={24} className="text-primary" />
          </div>
          <p className="font-medium text-sm">Nenhum prazo próximo</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Tudo em dia! Seus prazos aparecem aqui quando estiverem se aproximando.
          </p>
        </Card>
      )}

      {/* Items */}
      {!loading && visibleItems.length > 0 && (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isAcked = acknowledged.has(getItemKey(item));
            return (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Type badge */}
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        backgroundColor: "#D6E8FA",
                        color: "#185FA5",
                      }}
                    >
                      Meta
                    </span>

                    {/* Title */}
                    <p className="text-sm font-medium leading-snug">{item.title}</p>

                    {/* Life areas */}
                    {item.lifeAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.lifeAreas.map((a) => {
                          const area = getLifeArea(a);
                          if (!area) return null;
                          return (
                            <span
                              key={a}
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ backgroundColor: area.bgColor, color: area.textColor }}
                            >
                              {area.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Progress */}
                    {item.progress !== undefined && (
                      <div className="flex items-center gap-2">
                        <Progress value={item.progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground font-medium">{item.progress}%</span>
                      </div>
                    )}

                  </div>

                  {/* Right side: deadline + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {renderDeadlineLabel(item.deadline)}
                    <div className="flex items-center gap-1.5">
                      {isAcked ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Ciente ✓
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-3"
                          onClick={() => handleAcknowledge(item)}
                        >
                          Estou ciente
                        </Button>
                      )}
                      <button
                        onClick={() => handleDismiss(item)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        title="Remover da lista"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}