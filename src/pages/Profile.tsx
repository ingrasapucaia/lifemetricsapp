import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Habit, HABIT_ICONS } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Upload, RotateCcw, Eraser, icons } from "lucide-react";
import { cn } from "@/lib/utils";

function IconPreview({ name, size = 16 }: { name?: string; size?: number }) {
  if (!name) return null;
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon size={size} />;
}

export default function Profile() {
  const store = useStore();
  const { profile, updateProfile, habits, addHabit, updateHabit, deleteHabit, records, resetToSeed, clearAll, importData } = store;

  const [habitModal, setHabitModal] = useState<{ open: boolean; editing?: Habit }>({ open: false });
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const [hName, setHName] = useState("");
  const [hType, setHType] = useState<"check" | "minutes" | "count" | "hours_minutes">("check");
  const [hTarget, setHTarget] = useState(0);
  const [hTargetHours, setHTargetHours] = useState(0);
  const [hTargetMins, setHTargetMins] = useState(0);
  const [hActive, setHActive] = useState(true);
  const [hIcon, setHIcon] = useState<string>("");
  const [hCategory, setHCategory] = useState<"geral" | "exercicio">("geral");

  const openModal = (h?: Habit) => {
    setHName(h?.name || "");
    setHType(h?.targetType || "check");
    setHTarget(h?.targetValue || 0);
    setHTargetHours(h?.targetType === "hours_minutes" && h?.targetValue ? Math.floor(h.targetValue / 60) : 0);
    setHTargetMins(h?.targetType === "hours_minutes" && h?.targetValue ? h.targetValue % 60 : 0);
    setHActive(h?.active ?? true);
    setHIcon(h?.icon || "");
    setHCategory(h?.category || "geral");
    setHabitModal({ open: true, editing: h });
  };

  const saveHabit = () => {
    if (!hName.trim()) { toast.error("Nome é obrigatório"); return; }
    const dup = habits.find((h) => h.name.toLowerCase() === hName.trim().toLowerCase() && h.id !== habitModal.editing?.id);
    if (dup) { toast.error("Já existe um hábito com este nome"); return; }

    const targetValue = hType === "hours_minutes" ? hTargetHours * 60 + hTargetMins : hType !== "check" ? hTarget : undefined;
    const data = {
      name: hName.trim(),
      targetType: hType,
      targetValue,
      active: hActive,
      icon: hIcon || undefined,
      category: hCategory,
    };
    if (habitModal.editing) { updateHabit(habitModal.editing.id, data); toast("Hábito atualizado"); }
    else { addHabit(data); toast("Hábito criado"); }
    setHabitModal({ open: false });
  };

  const handleImport = () => {
    try {
      const d = JSON.parse(importText);
      if (!d.habits || !d.records || !d.profile) throw new Error();
      importData(d);
      setImportOpen(false);
      setImportText("");
      toast("Dados importados");
    } catch {
      toast.error("Formato inválido");
    }
  };

  const json = JSON.stringify({ habits, records, profile }, null, 2);

  const typeLabel = (t: string) => {
    switch (t) {
      case "check": return "Check";
      case "minutes": return "Minutos";
      case "count": return "Contagem";
      case "hours_minutes": return "Horas/Min";
      default: return t;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {/* Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={profile.displayName} onChange={(e) => updateProfile({ displayName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Área de foco</Label>
              <Select value={profile.focusArea} onValueChange={(v) => updateProfile({ focusArea: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["saúde", "produtividade", "bem-estar", "autoconhecimento", "misto"].map((v) => (
                    <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Objetivo principal</Label>
            <Textarea value={profile.mainGoal} onChange={(e) => updateProfile({ mainGoal: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label className="cursor-pointer">Semana começa na segunda</Label>
              <Switch
                checked={profile.preferences.weekStartsOn === "mon"}
                onCheckedChange={(c) => updateProfile({ preferences: { ...profile.preferences, weekStartsOn: c ? "mon" : "sun" } })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label>Tom dos insights</Label>
              <div className="flex bg-muted rounded-lg p-1">
                {(["direto", "gentil"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateProfile({ preferences: { ...profile.preferences, insightsTone: t } })}
                    className={cn("px-3 py-1 text-sm rounded-md transition-colors capitalize",
                      profile.preferences.insightsTone === t ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Habits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Meus Hábitos</CardTitle>
            <Button size="sm" onClick={() => openModal()}><Plus size={14} /> Novo hábito</Button>
          </div>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhum hábito cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {habits.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <IconPreview name={h.icon} />
                        {h.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{typeLabel(h.targetType)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {h.targetType === "hours_minutes" && h.targetValue
                        ? `${Math.floor(h.targetValue / 60)}h ${h.targetValue % 60}min`
                        : h.targetValue || "—"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={h.active} onCheckedChange={(c) => updateHabit(h.id, { active: c })} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openModal(h)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDelTarget(h.id)}><Trash2 size={14} className="text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ações</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setExportOpen(true)}><Download size={14} /> Exportar</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload size={14} /> Importar</Button>
          <Button variant="outline" onClick={() => setConfirmReset(true)}><RotateCcw size={14} /> Resetar demo</Button>
          <Button variant="destructive" onClick={() => setConfirmClear(true)}><Eraser size={14} /> Limpar dados</Button>
        </CardContent>
      </Card>

      {/* Habit modal */}
      <Dialog open={habitModal.open} onOpenChange={(o) => !o && setHabitModal({ open: false })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{habitModal.editing ? "Editar hábito" : "Novo hábito"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={hName} onChange={(e) => setHName(e.target.value)} placeholder="Ex: Treino" /></div>

            {/* Icon selector */}
            <div className="space-y-1.5">
              <Label>Ícone</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    {hIcon ? <IconPreview name={hIcon} /> : null}
                    {hIcon || "Selecionar ícone"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3">
                  <div className="grid grid-cols-6 gap-2">
                    {HABIT_ICONS.map((iconName) => {
                      const Icon = icons[iconName as keyof typeof icons];
                      if (!Icon) return null;
                      return (
                        <button
                          key={iconName}
                          onClick={() => setHIcon(iconName)}
                          className={cn(
                            "p-2 rounded-md hover:bg-muted transition-colors flex items-center justify-center",
                            hIcon === iconName && "bg-primary/10 ring-2 ring-primary"
                          )}
                          title={iconName}
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
              <Label>Categoria</Label>
              <Select value={hCategory} onValueChange={(v) => setHCategory(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="exercicio">Exercício</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={hType} onValueChange={(v) => setHType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check (sim/não)</SelectItem>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="count">Contagem</SelectItem>
                  <SelectItem value="hours_minutes">Horas e minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hType === "hours_minutes" && (
              <div className="space-y-1.5">
                <Label>Meta</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={23} value={hTargetHours || ""} onChange={(e) => setHTargetHours(Number(e.target.value))} placeholder="0" className="w-20" />
                  <span className="text-sm text-muted-foreground">h</span>
                  <Input type="number" min={0} max={59} value={hTargetMins || ""} onChange={(e) => setHTargetMins(Number(e.target.value))} placeholder="0" className="w-20" />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            )}
            {(hType === "minutes" || hType === "count") && (
              <div className="space-y-1.5">
                <Label>Meta</Label>
                <Input type="number" min={0} value={hTarget || ""} onChange={(e) => setHTarget(Number(e.target.value))} placeholder="Ex: 30" />
              </div>
            )}
            <div className="flex items-center gap-2"><Switch checked={hActive} onCheckedChange={setHActive} /><Label>Ativo</Label></div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setHabitModal({ open: false })}>Cancelar</Button>
              <Button onClick={saveHabit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete habit */}
      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deletar hábito?</AlertDialogTitle><AlertDialogDescription>O hábito será removido permanentemente.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteHabit(delTarget!); setDelTarget(null); toast("Hábito deletado"); }}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Resetar dados de demonstração?</AlertDialogTitle><AlertDialogDescription>Todos os dados atuais serão substituídos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { resetToSeed(); setConfirmReset(false); toast("Dados resetados"); }}>Resetar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle><AlertDialogDescription>Todos os registros e configurações serão perdidos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { clearAll(); setConfirmClear(false); toast("Dados limpos"); }}>Limpar tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Exportar dados</DialogTitle></DialogHeader>
          <Textarea value={json} readOnly rows={10} className="font-mono text-xs" />
          <Button onClick={() => { navigator.clipboard.writeText(json); toast("Copiado!"); }}>Copiar</Button>
        </DialogContent>
      </Dialog>

      {/* Import */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Importar dados</DialogTitle></DialogHeader>
          <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={10} placeholder="Cole o JSON aqui..." className="font-mono text-xs" />
          <Button onClick={handleImport}>Importar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
