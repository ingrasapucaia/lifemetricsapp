import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getLifeArea } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeAreaBadge } from "@/components/LifeAreaBadge";
import { toast } from "sonner";
import { Trophy, Star, Calendar, Gift, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface CompletedGoal {
  id: string;
  title: string;
  icon: string | null;
  life_area: string | null;
  completed_at: string | null;
  reward: string | null;
  rewarded: boolean;
  rewarded_at: string | null;
}

const STAT_THEMES = [
  { bg: "hsl(var(--metric-habits-bg))", icon: "hsl(var(--metric-habits))" },
  { bg: "hsl(var(--metric-exercise-bg))", icon: "hsl(var(--metric-exercise))" },
  { bg: "hsl(var(--metric-sleep-bg))", icon: "hsl(var(--metric-sleep))" },
];

export default function Achievements() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<CompletedGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompleted = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goals")
      .select("id, title, life_area, completed_at, reward, rewarded, rewarded_at")
      .eq("user_id", user.id)
      .eq("status", "concluido")
      .order("completed_at", { ascending: false });
    setGoals((data as CompletedGoal[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCompleted(); }, [fetchCompleted]);

  const sorted = useMemo(
    () => [...goals].sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || "")),
    [goals],
  );

  const now = new Date();
  const thisMonth = format(now, "yyyy-MM");
  const thisYear = format(now, "yyyy");

  const monthCount = goals.filter((g) => g.completed_at?.startsWith(thisMonth)).length;
  const yearCount = goals.filter((g) => g.completed_at?.startsWith(thisYear)).length;
  const totalCount = goals.length;

  const handleReward = async (goalId: string, rewarded: boolean) => {
    const updates = rewarded
      ? { rewarded: true, rewarded_at: new Date().toISOString() }
      : { rewarded: false, rewarded_at: null };

    await supabase.from("goals").update(updates).eq("id", goalId);
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g)),
    );
    toast(rewarded ? "Recompensa marcada! 🎁" : "Recompensa desmarcada.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Minhas Conquistas</h1>
        <p className="text-sm text-muted-foreground mt-1">Metas que você concluiu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Calendar, label: "Este mês", value: monthCount, theme: STAT_THEMES[0] },
          { icon: Star, label: "Este ano", value: yearCount, theme: STAT_THEMES[1] },
          { icon: Trophy, label: "Total", value: totalCount, theme: STAT_THEMES[2] },
        ].map((stat, i) => (
          <Card key={i} className="border-0" style={{ backgroundColor: stat.theme.bg }}>
            <CardContent className="p-5 text-center">
              <div
                className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${stat.theme.icon}18` }}
              >
                <stat.icon size={16} style={{ color: stat.theme.icon }} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="mx-auto mb-3 text-muted-foreground opacity-30" size={32} />
            <p className="text-muted-foreground mb-2">Nenhuma conquista ainda</p>
            <p className="text-sm text-muted-foreground">
              Conclua suas metas para vê-las aparecer aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((g) => {
            const completedDate = g.completed_at
              ? format(parseISO(g.completed_at), "dd 'de' MMMM 'de' yyyy", { locale: pt })
              : null;

            return (
              <Card key={g.id} className="hover:shadow-card-hover transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-[32px] leading-none shrink-0 mt-0.5">
                      {g.icon || "🏆"}
                    </span>

                    <div className="flex-1 space-y-2 min-w-0">
                      <p className="text-[15px] font-medium">{g.title}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <LifeAreaBadge value={g.life_area || undefined} size="sm" />
                        {completedDate && (
                          <span className="text-xs text-muted-foreground">
                            Concluída em {completedDate}
                          </span>
                        )}
                      </div>

                      {/* Reward section */}
                      {g.reward && (
                        <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Gift size={14} className="text-muted-foreground shrink-0" />
                            <span>{g.reward}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Já se recompensou?</span>
                            <div className="flex gap-1.5">
                              <Button
                                variant={g.rewarded ? "default" : "outline"}
                                size="sm"
                                className="h-7 rounded-lg text-xs gap-1"
                                onClick={() => handleReward(g.id, true)}
                              >
                                {g.rewarded && <Check size={12} />} Sim
                              </Button>
                              <Button
                                variant={!g.rewarded ? "outline" : "ghost"}
                                size="sm"
                                className="h-7 rounded-lg text-xs"
                                style={
                                  !g.rewarded
                                    ? { backgroundColor: "#FDF3DC", color: "#7A5C00", borderColor: "#7A5C00" }
                                    : undefined
                                }
                                onClick={() => handleReward(g.id, false)}
                              >
                                Ainda não
                              </Button>
                            </div>
                          </div>

                          {g.rewarded && (
                            <p className="text-xs font-medium" style={{ color: "#0F6E56" }}>
                              Recompensa recebida ✓
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
