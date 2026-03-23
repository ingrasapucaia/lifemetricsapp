import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
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
  const { user, profile: authProfile, refreshProfile } = useAuth();

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

  // Load profile data from Supabase
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

  // Track if anything changed
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
      JSON.stringify(opportunities) !== JSON.stringify(authProfile.opportunities || [])
    );
  }, [name, gender, weekStartsMonday, insightsTone, objectives, lifeAreas, lifeGoals, challenges, strengths, opportunities, authProfile, loaded]);

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
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast("Perfil atualizado com sucesso");
      await refreshProfile();
    }
    setSaving(false);
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
              <Switch
                checked={weekStartsMonday}
                onCheckedChange={setWeekStartsMonday}
              />
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

      {/* Save button - only when changed */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t z-50 md:left-[var(--sidebar-width)]">
          <div className="max-w-3xl mx-auto">
            <Button className="w-full rounded-full" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
