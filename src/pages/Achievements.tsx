import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Achievement, AREA_OPTIONS } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Achievements() {
  const { achievements, addAchievement, deleteAchievement } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [delTarget, setDelTarget] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [area, setArea] = useState<Achievement["area"]>("pessoal");
  const [feeling, setFeeling] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const now = new Date();
  const thisMonth = achievements.filter((a) => {
    const d = parseISO(a.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const openNew = () => {
    setTitle("");
    setArea("pessoal");
    setFeeling("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setShowNew(true);
  };

  const save = () => {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    addAchievement({ title: title.trim(), area, feeling: feeling.trim() || undefined, date });
    setShowNew(false);
    toast("Conquista adicionada!");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Minhas Conquistas</h1>
        <Button variant="outline" size="sm" onClick={openNew}>
          <Plus size={14} className="mr-1" /> Nova Conquista
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Conquistas este mês</p>
            <p className="text-3xl font-semibold">{thisMonth.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Total de conquistas</p>
            <p className="text-3xl font-semibold">{achievements.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {achievements.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma conquista ainda.</p>
            <Button variant="link" onClick={openNew}>Registre sua primeira conquista</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {achievements
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => {
                const areaOpt = AREA_OPTIONS.find((o) => o.value === a.area);
                return (
                  <div key={a.id} className="relative pl-10">
                    <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-foreground/20 border-2 border-background" />
                    <div className="group flex items-start justify-between p-3 rounded hover:bg-muted/40 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{a.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(a.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                          </span>
                          {areaOpt && (
                            <Badge className={cn("font-normal text-xs border-0", areaOpt.bg, areaOpt.text)}>
                              {areaOpt.label}
                            </Badge>
                          )}
                        </div>
                        {a.feeling && (
                          <p className="text-xs text-muted-foreground italic">"{a.feeling}"</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDelTarget(a.id)}
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* New achievement modal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Conquista</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que você conquistou?" />
            </div>
            <div className="space-y-1.5">
              <Label>Área da vida</Label>
              <Select value={area} onValueChange={(v) => setArea(v as Achievement["area"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AREA_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sentimento (opcional)</Label>
              <Textarea value={feeling} onChange={(e) => setFeeling(e.target.value)} placeholder="Como se sentiu?" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
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
