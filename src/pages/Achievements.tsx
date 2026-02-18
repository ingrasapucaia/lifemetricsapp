import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { Achievement, ACHIEVEMENT_AREAS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, Star, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Achievements() {
  const { achievements, addAchievement, deleteAchievement } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [delTarget, setDelTarget] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [area, setArea] = useState<string>(ACHIEVEMENT_AREAS[0]);
  const [feeling, setFeeling] = useState("Orgulho");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const sorted = useMemo(
    () => [...achievements].sort((a, b) => b.date.localeCompare(a.date)),
    [achievements]
  );

  const now = new Date();
  const thisMonth = format(now, "yyyy-MM");
  const thisYear = format(now, "yyyy");

  const monthCount = achievements.filter((a) => a.date.startsWith(thisMonth)).length;
  const yearCount = achievements.filter((a) => a.date.startsWith(thisYear)).length;
  const totalCount = achievements.length;

  const handleSave = () => {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    addAchievement({ title: title.trim(), area, feeling, date });
    setShowNew(false);
    setTitle("");
    toast("Conquista adicionada!");
  };

  const areaColors: Record<string, string> = {
    "Profissional": "217 70% 50%",
    "Pessoal": "142 60% 45%",
    "Saúde": "168 64% 38%",
    "Financeiro": "38 90% 50%",
    "Relacionamento": "330 65% 55%",
    "Criatividade": "270 50% 55%",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minhas Conquistas</h1>
        <Button onClick={() => { setShowNew(true); setDate(format(new Date(), "yyyy-MM-dd")); }}>
          <Plus size={16} /> Nova conquista
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Calendar size={14} />
              <span className="text-xs">Este mês</span>
            </div>
            <p className="text-2xl font-bold">{monthCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Star size={14} />
              <span className="text-xs">Este ano</span>
            </div>
            <p className="text-2xl font-bold">{yearCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Trophy size={14} />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">{totalCount} pts</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="mx-auto mb-3 text-muted-foreground" size={32} />
            <p className="text-muted-foreground mb-2">Nenhuma conquista ainda.</p>
            <p className="text-sm text-muted-foreground">Registre suas vitórias, grandes ou pequenas!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => (
            <Card key={a.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-medium">{a.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="gap-1 text-xs"
                      style={{
                        backgroundColor: `hsl(${areaColors[a.area] || "220 10% 90%"} / 0.15)`,
                        color: `hsl(${areaColors[a.area] || "220 10% 45%"})`,
                      }}
                    >
                      {a.area}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{a.feeling}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(a.date), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDelTarget(a.id)}>
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New achievement modal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova conquista</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Consegui uma promoção" />
            </div>
            <div className="space-y-1.5">
              <Label>Área da vida</Label>
              <Select value={area} onValueChange={(v) => setArea(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENT_AREAS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sentimento</Label>
              <Select value={feeling} onValueChange={setFeeling}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Orgulho", "Gratidão", "Alívio", "Felicidade", "Realização", "Surpresa"].map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar conquista?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteAchievement(delTarget!); setDelTarget(null); toast("Conquista removida"); }}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
