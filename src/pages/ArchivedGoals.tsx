import { useStore } from "@/hooks/useStore";
import { Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

export default function ArchivedGoals() {
  const { goals, updateGoal } = useStore();
  const archived = goals.filter((g) => g.status === "arquivada");

  function handleRestore(id: string) {
    updateGoal(id, { status: "começar" });
    toast.success("Meta restaurada para 'Metas de Vida'.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Projetos Arquivados</h1>
        <p className="text-sm text-muted-foreground mt-1">Metas e projetos que foram arquivados</p>
      </div>

      {archived.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Archive size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum projeto arquivado.</p>
        </Card>
      )}

      <div className="grid gap-3">
        {archived.map((g) => {
          const progress = g.actions.length === 0 ? 0 : Math.round((g.actions.filter((a) => a.completed).length / g.actions.length) * 100);
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 rounded-full">{g.type}</Badge>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{g.title}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground font-semibold">{progress}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Criada em {format(new Date(g.createdAt), "dd MMM yyyy", { locale: pt })}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0 rounded-xl" onClick={() => handleRestore(g.id)}>
                  <RotateCcw size={14} /> Restaurar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
