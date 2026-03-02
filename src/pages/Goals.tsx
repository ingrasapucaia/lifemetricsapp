import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { Goal, GOAL_STATUS_COLORS } from "@/types";
import { Plus, Target, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Goals() {
  const { goals, addGoal } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"meta" | "projeto">("meta");
  const [deadline, setDeadline] = useState("");

  const activeGoals = goals.filter((g) => g.status !== "arquivada");

  function handleAdd() {
    if (!title.trim()) return;
    addGoal({ title: title.trim(), type, status: "começar", deadline: deadline || undefined });
    setTitle("");
    setType("meta");
    setDeadline("");
    setOpen(false);
  }

  function getProgress(g: Goal) {
    if (g.actions.length === 0) return 0;
    return Math.round((g.actions.filter((a) => a.completed).length / g.actions.length) * 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Metas de Vida</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas metas e projetos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus size={16} /> Nova
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova meta / projeto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aprender inglês" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as "meta" | "projeto")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta">Meta</SelectItem>
                    <SelectItem value="projeto">Projeto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prazo (opcional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <Button onClick={handleAdd} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeGoals.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <Target size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhuma meta ou projeto criado ainda.</p>
        </Card>
      )}

      <div className="grid gap-3">
        {activeGoals.map((g) => {
          const progress = getProgress(g);
          const statusColor = GOAL_STATUS_COLORS[g.status];
          return (
            <Card
              key={g.id}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/metas/${g.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0"
                      style={{
                        background: `hsl(${g.type === "meta" ? "270 60% 92%" : "200 60% 92%"})`,
                        color: `hsl(${g.type === "meta" ? "270 50% 40%" : "200 50% 35%"})`,
                      }}
                    >
                      {g.type === "meta" ? <Target size={10} className="mr-1" /> : <Briefcase size={10} className="mr-1" />}
                      {g.type}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0"
                      style={{
                        background: statusColor ? `hsl(${statusColor.bgHsl})` : undefined,
                        color: statusColor ? `hsl(${statusColor.hsl})` : undefined,
                      }}
                    >
                      {g.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground truncate">{g.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{progress}%</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span>{g.actions.length} {g.actions.length === 1 ? "ação" : "ações"}</span>
                    {g.deadline && (
                      <span>Prazo: {format(new Date(g.deadline + "T12:00:00"), "dd MMM yyyy", { locale: pt })}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
