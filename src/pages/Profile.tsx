import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { Habit } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconPicker } from "@/components/IconPicker";
import { LucideIcon } from "@/components/LucideIcon";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download, Upload, RotateCcw, Eraser, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const store = useStore();
  const { profile, updateProfile, habits, addHabit, updateHabit, deleteHabit, reorderHabits, records, achievements, resetToSeed, clearAll, importData } = store;

  const [habitModal, setHabitModal] = useState<{ open: boolean; editing?: Habit }>({ open: false });
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const [hName, setHName] = useState("");
  const [hIcon, setHIcon] = useState("");
  const [hType, setHType] = useState<"check" | "minutes" | "count">("check");
  const [hTarget, setHTarget] = useState(0);
  const [hActive, setHActive] = useState(true);

  const sortedHabits = [...habits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const openModal = (h?: Habit) => {
    setHName(h?.name || "");
    setHIcon(h?.iconName || "");
    setHType(h?.targetType || "check");
    setHTarget(h?.targetValue || 0);
    setHActive(h?.active ?? true);
    setHabitModal({ open: true, editing: h });
  };

  const saveHabit = () => {
    if (!hName.trim()) { toast.error("Nome é obrigatório"); return; }
    const dup = habits.find((h) => h.name.toLowerCase() === hName.trim().toLowerCase() && h.id !== habitModal.editing?.id);
    if (dup) { toast.error("Já existe um hábito com este nome"); return; }

    const data = {
      name: hName.trim(),
      iconName: hIcon || undefined,
      targetType: hType,
      targetValue: hType !== "check" ? hTarget : undefined,
      active: hActive,
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

  const json = JSON.stringify({ habits, records, profile, achievements }, null, 2);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Meu Perfil</h1>

      {/* Info */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Informações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={profile.displayName} onChange={(e) => updateProfile({ displayName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Área de foco</Label>
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
            <Label className="text-xs text-muted-foreground">Objetivo principal</Label>
            <Textarea value={profile.mainGoal} onChange={(e) => updateProfile({ mainGoal: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded border">
              <Label className="text-sm cursor-pointer">Semana começa na segunda</Label>
              <Switch
                checked={profile.preferences.weekStartsOn === "mon"}
                onCheckedChange={(c) => updateProfile({ preferences: { ...profile.preferences, weekStartsOn: c ? "mon" : "sun" } })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded border">
              <Label className="text-sm">Tom dos insights</Label>
              <div className="flex bg-muted rounded p-0.5">
                {(["direto", "gentil"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateProfile({ preferences: { ...profile.preferences, insightsTone: t } })}
                    className={cn("px-3 py-1 text-xs rounded transition-colors capitalize",
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Meus Hábitos</CardTitle>
            <Button variant="outline" size="sm" onClick={() => openModal()}><Plus size={14} className="mr-1" /> Novo</Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedHabits.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Nenhum hábito cadastrado.</p>
          ) : (
            <div className="divide-y">
              {sortedHabits.map((h, idx) => (
                <div key={h.id} className="flex items-center gap-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => reorderHabits(idx, idx - 1)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      disabled={idx === sortedHabits.length - 1}
                      onClick={() => reorderHabits(idx, idx + 1)}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center rounded bg-muted">
                    {h.iconName ? <LucideIcon name={h.iconName} size={16} className="text-muted-foreground" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.targetType === "check" ? "Check" : h.targetType === "minutes" ? `${h.targetValue || 0} min` : `${h.targetValue || 0}x`}
                    </p>
                  </div>
                  <Switch checked={h.active} onCheckedChange={(c) => updateHabit(h.id, { active: c })} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openModal(h)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDelTarget(h.id)}><Trash2 size={14} className="text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Ações</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}><Download size={14} className="mr-1" /> Exportar</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload size={14} className="mr-1" /> Importar</Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}><RotateCcw size={14} className="mr-1" /> Resetar demo</Button>
          <Button variant="destructive" size="sm" onClick={() => setConfirmClear(true)}><Eraser size={14} className="mr-1" /> Limpar dados</Button>
        </CardContent>
      </Card>

      {/* Habit modal */}
      <Dialog open={habitModal.open} onOpenChange={(o) => !o && setHabitModal({ open: false })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{habitModal.editing ? "Editar hábito" : "Novo hábito"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Ícone</Label>
                <IconPicker value={hIcon} onChange={setHIcon} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={hName} onChange={(e) => setHName(e.target.value)} placeholder="Ex: Leitura" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de meta</Label>
              <Select value={hType} onValueChange={(v) => setHType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check (sim/não)</SelectItem>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="count">Quantidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hType !== "check" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Meta</Label>
                <Input type="number" min={0} value={hTarget || ""} onChange={(e) => setHTarget(Number(e.target.value))} placeholder="Ex: 30" />
              </div>
            )}
            <div className="flex items-center gap-2"><Switch checked={hActive} onCheckedChange={setHActive} /><Label className="text-sm">Ativo</Label></div>
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
