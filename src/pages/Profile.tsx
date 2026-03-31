import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronDown, Download, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const OBJECTIVES = [
  { emoji: "👟", label: "Sou atleta" },
  { emoji: "💼", label: "Sou empresário/autônomo" },
  { emoji: "📚", label: "Sou estudante" },
  { emoji: "🔥", label: "Desenvolver disciplina" },
  { emoji: "🎯", label: "Alcançar objetivos" },
  { emoji: "🎨", label: "Sou artista/creator" },
];

const LIFE_AREAS = [
  "Saúde", "Profissional", "Financeiro", "Relacionamentos",
  "Autocuidado", "Espiritualidade", "Família", "Criatividade", "Educação",
];

const CHALLENGES = [
  "Falta de tempo", "Procrastinação", "Falta de energia", "Distrações",
  "Esquecimento", "Falta de motivação", "Rotina imprevisível", "Dificuldade em dizer não",
];

const STRENGTHS = [
  "Determinação", "Criatividade", "Disciplina", "Foco",
  "Comunicação", "Organização", "Empatia", "Resiliência",
];

const OPPORTUNITIES = [
  "Condição financeira estável", "Boas conexões", "Conhecimento na área",
  "Liberdade de tempo", "Habilidades relevantes", "Visibilidade/reputação",
];

function ChipSelect({ options, selected, onToggle }: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-all duration-200",
              active
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function CardSelect({ options, selected, onToggle }: {
  options: { emoji: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => {
        const active = selected.includes(o.label);
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onToggle(o.label)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200",
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30"
            )}
          >
            <span className="text-xl">{o.emoji}</span>
            <span className="text-sm font-medium text-foreground">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Profile() {
  const { user, profile: authProfile, refreshProfile, signOut } = useAuth();
  const { habits, records, clearAll } = useStore();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [weekStartsMonday, setWeekStartsMonday] = useState(true);
  const [insightsTone, setInsightsTone] = useState("direto");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [lifeAreas, setLifeAreas] = useState<string[]>([]);
  const [lifeGoals, setLifeGoals] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<string[]>([]);
  
  const [diagOpen, setDiagOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  // Delete modal
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0); // 0=closed, 1=step1, 2=step2
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authProfile) return;
    setName(authProfile.name || "");
    setGender(authProfile.gender || "");
    setWeekStartsMonday(authProfile.week_starts_monday ?? true);
    setInsightsTone(authProfile.insights_tone || "direto");
    setObjectives(authProfile.main_objective || []);
    setLifeAreas(authProfile.life_areas || []);
    setLifeGoals(authProfile.life_goals || "");
    setChallenges(authProfile.challenges || []);
    setStrengths(authProfile.strengths || []);
    setOpportunities(authProfile.opportunities || []);
    
    setLoaded(true);
  }, [authProfile]);

  const hasChanges = useMemo(() => {
    if (!authProfile || !loaded) return false;
    return (
      name !== (authProfile.name || "") ||
      gender !== (authProfile.gender || "") ||
      weekStartsMonday !== (authProfile.week_starts_monday ?? true) ||
      insightsTone !== (authProfile.insights_tone || "direto") ||
      JSON.stringify(objectives) !== JSON.stringify(authProfile.main_objective || []) ||
      JSON.stringify(lifeAreas) !== JSON.stringify(authProfile.life_areas || []) ||
      lifeGoals !== (authProfile.life_goals || "") ||
      JSON.stringify(challenges) !== JSON.stringify(authProfile.challenges || []) ||
      JSON.stringify(strengths) !== JSON.stringify(authProfile.strengths || []) ||
      JSON.stringify(opportunities) !== JSON.stringify(authProfile.opportunities || []) ||
      dailyKcalGoal !== (authProfile.daily_kcal_goal ? String(authProfile.daily_kcal_goal) : "")
    );
  }, [name, gender, weekStartsMonday, insightsTone, objectives, lifeAreas, lifeGoals, challenges, strengths, opportunities, dailyKcalGoal, authProfile, loaded]);

  const toggleMulti = (arr: string[], setter: (a: string[]) => void) => (v: string) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name || null,
        gender: gender || null,
        week_starts_monday: weekStartsMonday,
        insights_tone: insightsTone,
        main_objective: objectives,
        life_areas: lifeAreas,
        life_goals: lifeGoals || null,
        challenges,
        strengths,
        opportunities,
        daily_kcal_goal: dailyKcalGoal ? Number(dailyKcalGoal) : null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast("Perfil atualizado!");
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const [profileRes, habitsRes, recordsRes, goalsRes, actionsRes, tasksRes, achievementsRes, acknowledgementsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("daily_records").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("goal_actions").select("*"),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("achievements").select("*").eq("user_id", user.id),
        supabase.from("deadline_acknowledgments").select("*").eq("user_id", user.id),
      ]);

      // Filter goal_actions by user's goals
      const goalIds = (goalsRes.data || []).map((g) => g.id);
      const userActions = (actionsRes.data || []).filter((a) => goalIds.includes(a.goal_id));

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.data,
        habits: habitsRes.data || [],
        records: recordsRes.data || [],
        goals: goalsRes.data || [],
        goalActions: userActions,
        tasks: tasksRes.data || [],
        achievements: achievementsRes.data || [],
        deadlineAcknowledgments: acknowledgementsRes.data || [],
      };

      const userName = name || "usuario";
      const date = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `metrics-dados-${userName}-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Seus dados foram exportados com sucesso");
    } catch {
      toast.error("Erro ao exportar dados");
    }
  };

  const handleReset = async () => {
    if (!user) return;
    if (resetConfirmText !== "RESETAR") return;
    setResetting(true);
    try {
      // Auto-export backup before destructive operation
      try {
        const [profileRes, habitsRes, recordsRes, goalsRes, actionsRes, tasksRes, achievementsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).single(),
          supabase.from("habits").select("*").eq("user_id", user.id),
          supabase.from("daily_records").select("*").eq("user_id", user.id),
          supabase.from("goals").select("*").eq("user_id", user.id),
          supabase.from("goal_actions").select("*"),
          supabase.from("tasks").select("*").eq("user_id", user.id),
          supabase.from("achievements").select("*").eq("user_id", user.id),
        ]);
        const backupData = {
          exported_at: new Date().toISOString(),
          reason: "auto_backup_before_reset",
          profile: profileRes.data,
          habits: habitsRes.data,
          records: recordsRes.data,
          goals: goalsRes.data,
          goal_actions: actionsRes.data,
          tasks: tasksRes.data,
          achievements: achievementsRes.data,
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-antes-reset-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (backupErr) {
        console.warn("Backup before reset failed, proceeding anyway:", backupErr);
      }

      // Get user's goal IDs first for goal_actions
      const { data: userGoals } = await supabase.from("goals").select("id").eq("user_id", user.id);
      const goalIds = (userGoals || []).map((g) => g.id);

      // Delete from Supabase tables
      await Promise.all([
        supabase.from("deadline_acknowledgments").delete().eq("user_id", user.id),
        supabase.from("tasks").delete().eq("user_id", user.id),
        supabase.from("achievements").delete().eq("user_id", user.id),
        supabase.from("daily_records").delete().eq("user_id", user.id),
        supabase.from("daily_insights").delete().eq("user_id", user.id),
        ...(goalIds.length > 0 ? [supabase.from("goal_actions").delete().in("goal_id", goalIds)] : []),
      ]);
      await Promise.all([
        supabase.from("goals").delete().eq("user_id", user.id),
        supabase.from("habits").delete().eq("user_id", user.id),
      ]);

      clearAll();

      setResetOpen(false);
      setResetConfirmText("");
      toast("App resetado. Comece do zero!");
      navigate("/dashboard");
    } catch {
      toast.error("Erro ao resetar o app");
    }
    setResetting(false);
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { password: deletePassword },
      });

      if (error || data?.error) {
        if (data?.error === "wrong_password") {
          setDeleteError("Senha incorreta. Tente novamente.");
        } else {
          setDeleteError("Erro ao excluir conta. Tente novamente.");
        }
        setDeleting(false);
        return;
      }

      // Clear localStorage
      clearAll();
      await signOut();
      toast("Conta excluída com sucesso");
      navigate("/login");
    } catch {
      setDeleteError("Erro ao excluir conta. Tente novamente.");
      setDeleting(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>

      {/* Informações */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome / apelido</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label>Gênero</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "feminino", label: "Feminino" },
                  { value: "masculino", label: "Masculino" },
                  { value: "neutro", label: "Neutro" },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={cn(
                      "p-2.5 rounded-2xl border text-sm font-medium text-center transition-all",
                      gender === g.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label className="cursor-pointer">Semana começa na segunda</Label>
              <Switch checked={weekStartsMonday} onCheckedChange={setWeekStartsMonday} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label>Tom dos insights</Label>
              <div className="flex bg-muted rounded-lg p-1">
                {(["direto", "gentil"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setInsightsTone(t)}
                    className={cn("px-3 py-1 text-sm rounded-md transition-colors capitalize",
                      insightsTone === t ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Meta calórica diária (kcal)</Label>
            <Input
              type="number"
              min={0}
              value={dailyKcalGoal}
              onChange={(e) => setDailyKcalGoal(e.target.value)}
              placeholder="Ex: 2000"
            />
            <p className="text-[10px] text-muted-foreground">Defina sua meta para acompanhar o progresso no card de refeições</p>
          </div>
        </CardContent>
      </Card>

      {/* Meu objetivo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Meu objetivo</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Objetivo principal com o app</Label>
            <CardSelect options={OBJECTIVES} selected={objectives} onToggle={toggleMulti(objectives, setObjectives)} />
          </div>
          <div className="space-y-2">
            <Label>Áreas de foco</Label>
            <ChipSelect options={LIFE_AREAS} selected={lifeAreas} onToggle={toggleMulti(lifeAreas, setLifeAreas)} />
          </div>
          <div className="space-y-1.5">
            <Label>Seus objetivos de vida</Label>
            <Textarea value={lifeGoals} onChange={(e) => setLifeGoals(e.target.value)} rows={3} placeholder="Escreva livremente..." />
            <p className="text-[10px] text-muted-foreground">Revisitar isso quando precisar de motivação</p>
          </div>
        </CardContent>
      </Card>

      {/* Meu diagnóstico */}
      <Card>
        <Collapsible open={diagOpen} onOpenChange={setDiagOpen}>
          <CardHeader className="cursor-pointer" onClick={() => setDiagOpen(!diagOpen)}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-base">Meu diagnóstico</CardTitle>
                <ChevronDown
                  size={18}
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    diagOpen && "rotate-180"
                  )}
                />
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-5">
              <p className="text-xs text-muted-foreground">
                Essas informações são privadas e só você tem acesso a elas.
              </p>
              <div className="space-y-2">
                <Label>Desafios na rotina</Label>
                <ChipSelect options={CHALLENGES} selected={challenges} onToggle={toggleMulti(challenges, setChallenges)} />
              </div>
              <div className="space-y-2">
                <Label>Pontos fortes</Label>
                <ChipSelect options={STRENGTHS} selected={strengths} onToggle={toggleMulti(strengths, setStrengths)} />
              </div>
              <div className="space-y-2">
                <Label>Oportunidades</Label>
                <ChipSelect options={OPPORTUNITIES} selected={opportunities} onToggle={toggleMulti(opportunities, setOpportunities)} />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Salvar alterações */}
      <Button
        className="w-full rounded-full"
        onClick={handleSave}
        disabled={!hasChanges || saving}
      >
        {saving ? "Salvando..." : "Salvar alterações"}
      </Button>

      {/* Meus dados */}
      <Card>
        <CardHeader><CardTitle className="text-base">Meus dados</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-primary text-primary hover:bg-primary/5"
            onClick={handleExport}
          >
            <Download size={16} />
            Exportar meus dados
          </Button>

          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/5"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw size={16} />
            Resetar app
          </Button>

          <button
            onClick={() => { setDeleteStep(1); setDeletePassword(""); setDeleteError(""); }}
            className="w-full text-center text-sm text-destructive/70 hover:text-destructive transition-colors py-1"
          >
            Excluir minha conta
          </button>
        </CardContent>
      </Card>

      {/* Reset modal */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resetar o app?</DialogTitle>
            <DialogDescription>
              Isso vai apagar todos os seus registros, hábitos, metas e tarefas.
              Seu acesso e perfil serão mantidos, mas você começará do zero.
              Um backup será baixado automaticamente antes da exclusão.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Digite <span className="font-bold text-destructive">RESETAR</span> para confirmar:
              </Label>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESETAR"
                className="text-center font-mono"
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setResetOpen(false); setResetConfirmText(""); }}
            >
              Cancelar
            </Button>
            <Button
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReset}
              disabled={resetting || resetConfirmText !== "RESETAR"}
            >
              {resetting ? "Resetando..." : "Sim, resetar tudo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete account modal */}
      <Dialog open={deleteStep > 0} onOpenChange={(open) => { if (!open) setDeleteStep(0); }}>
        <DialogContent className="sm:max-w-md">
          {deleteStep === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>Tem certeza?</DialogTitle>
                <DialogDescription>
                  Excluir sua conta é permanente. Todos os seus dados serão apagados
                  para sempre e não poderão ser recuperados.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 mt-2">
                <Button variant="outline" className="w-full" onClick={() => setDeleteStep(0)}>
                  Cancelar
                </Button>
                <Button
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => setDeleteStep(2)}
                >
                  Continuar
                </Button>
              </div>
            </>
          )}
          {deleteStep === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Confirmação final</DialogTitle>
                <DialogDescription>
                  Para confirmar, digite sua senha atual abaixo:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                />
                {deleteError && (
                  <p className="text-sm text-destructive">{deleteError}</p>
                )}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full" onClick={() => setDeleteStep(0)}>
                    Cancelar
                  </Button>
                  <Button
                    className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword}
                  >
                    {deleting ? "Excluindo..." : "Excluir minha conta definitivamente"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
