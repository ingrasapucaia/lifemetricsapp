import { useStore } from "@/hooks/useStore";
import { useTasks } from "@/hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { getLifeArea } from "@/types";
import { LifeAreaBadge } from "@/components/LifeAreaBadge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function GoalsInProgress() {
  const { goals } = useStore();
  const { tasks } = useTasks();
  const navigate = useNavigate();

  const inProgress = goals
    .filter((g) => g.status === "em_progresso")
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  if (inProgress.length === 0) return null;

  const displayed = inProgress.slice(0, 3);
  const remaining = inProgress.length - 3;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">METAS EM PROGRESSO</h2>
        <button
          onClick={() => navigate("/metas")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Ver todas <ArrowRight size={12} />
        </button>
      </div>

      <div className="space-y-2">
        {displayed.map((g) => {
          const actionTotal = g.actions.length;
          const actionDone = g.actions.filter((a) => a.completed).length;
          const goalTasks = tasks.filter((t) => t.goal_id === g.id);
          const taskTotal = goalTasks.length;
          const taskDone = goalTasks.filter((t) => t.completed).length;
          const total = actionTotal + taskTotal;
          const done = actionDone + taskDone;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <Card
              key={g.id}
              className="p-3 cursor-pointer hover:shadow-card-hover transition-all duration-200"
              onClick={() => navigate(`/metas/${g.id}`)}
            >
              <div className="flex items-start gap-2.5">
                {g.icon && <span className="text-[20px] leading-none shrink-0 mt-0.5">{g.icon}</span>}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{g.title}</span>
                    {g.lifeArea && <LifeAreaBadge value={g.lifeArea} size="sm" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-[11px] font-medium text-muted-foreground shrink-0">{pct}%</span>
                  </div>
                  {g.deadline && (
                    <p className="text-[11px] text-muted-foreground">
                      Prazo: {format(new Date(g.deadline + "T12:00:00"), "dd MMM yyyy", { locale: pt })}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => navigate("/metas")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Ver mais {remaining} {remaining === 1 ? "meta" : "metas"} <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}
