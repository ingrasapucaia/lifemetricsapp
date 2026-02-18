import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { Achievement, ACHIEVEMENT_AREAS, ACHIEVEMENT_AREA_COLORS, HABIT_ICONS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, Star, Calendar, Pencil, icons } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

function IconPreview({ name, size = 16 }: { name?: string; size?: number }) {
  if (!name) return null;
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export default function Achievements() {
  const { achievements, addAchievement, updateAchievement, deleteAchievement } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [delTarget, setDelTarget] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [area, setArea] = useState<string>(ACHIEVEMENT_AREAS[0]);
  const [feeling, setFeeling] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [iconName, setIconName] = useState<string>("Trophy");

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

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setArea(ACHIEVEMENT_AREAS[0]);
    setFeeling("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setIconName("Trophy");
    setShowModal(true);
  };

  const openEdit = (a: Achievement) => {
    setEditingId(a.id);
    setTitle(a.title);
    setArea(a.area);
    setFeeling(a.feeling);
    setDate(a.date);
    setIconName(a.icon || "Trophy");
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    const data = { title: title.trim(), area, feeling, date, icon: iconName };
    if (editingId) {
      updateAchievement(editingId, data);
      toast("Conquista atualizada!");
    } else {
      addAchievement(data);
      toast("Conquista adicionada!");
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minhas Conquistas</h1>
        <Button onClick={openNew}>
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
          {sorted.map((a) => {
            const areaColor = ACHIEVEMENT_AREA_COLORS[a.area];
            return (
              <Card key={a.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <IconPreview name={a.icon} size={18} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm font-medium">{a.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs"
                          style={{
                            backgroundColor: areaColor ? `hsl(${areaColor.bgHsl})` : "hsl(220 10% 94%)",
                            color: areaColor ? `hsl(${areaColor.hsl})` : "hsl(220 10% 45%)",
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: areaColor ? `hsl(${areaColor.hsl})` : "hsl(220 10% 60%)" }}
                          />
                          {a.area}
                        </span>
                        {a.feeling && (
                          <span className="text-xs text-muted-foreground italic">"{a.feeling}"</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(a.date), "dd/MM/yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDelTarget(a.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Achievement modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar conquista" : "Nova conquista"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Consegui uma promoção" />
            </div>

            {/* Icon selector */}
            <div className="space-y-1.5">
              <Label>Ícone</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <IconPreview name={iconName} />
                    {iconName || "Selecionar ícone"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3">
                  <div className="grid grid-cols-6 gap-2">
                    {HABIT_ICONS.map((ic) => {
                      const Icon = icons[ic as keyof typeof icons];
                      if (!Icon) return null;
                      return (
                        <button
                          key={ic}
                          onClick={() => setIconName(ic)}
                          className={cn(
                            "p-2 rounded-md hover:bg-muted transition-colors flex items-center justify-center",
                            iconName === ic && "bg-primary/10 ring-2 ring-primary"
                          )}
                          title={ic}
                        >
                          <Icon size={18} />
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
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
              <Input
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                placeholder="Como você se sentiu? Ex: Orgulhosa, aliviada..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
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
