import { useState } from "react";
import { useStore } from "@/hooks/useStore";
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
import { toast } from "sonner";
import { Download, Upload, RotateCcw, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const store = useStore();
  const { profile, updateProfile, habits, records, resetToSeed, clearAll, importData } = store;

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>

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

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ações</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setExportOpen(true)} className="rounded-xl"><Download size={14} /> Exportar</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="rounded-xl"><Upload size={14} /> Importar</Button>
          <Button variant="outline" onClick={() => setConfirmReset(true)} className="rounded-xl"><RotateCcw size={14} /> Resetar demo</Button>
          <Button variant="destructive" onClick={() => setConfirmClear(true)} className="rounded-xl"><Eraser size={14} /> Limpar dados</Button>
        </CardContent>
      </Card>

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
