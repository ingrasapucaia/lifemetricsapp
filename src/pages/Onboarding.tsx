import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Check, Plus, X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ── Data ──────────────────────────────────────────
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

const HABIT_EMOJIS = [
  "👟", "💧", "📚", "✏️", "🧘🏽", "💪🏼", "🏋🏽‍♀️", "🥗",
  "😴", "🎯", "💻", "🎨", "💰", "📖", "🌿", "🧃",
];

const METRIC_TYPES = [
  { value: "check", emoji: "✅", label: "Check (sim/não)" },
  { value: "hours_minutes", emoji: "⏱", label: "Tempo (horas/min)" },
  { value: "count", emoji: "🔢", label: "Número" },
  { value: "km", emoji: "📏", label: "Km / Milhas" },
  { value: "kcal", emoji: "🔥", label: "Kcal" },
  { value: "liters", emoji: "💧", label: "Litros" },
];

// ── ChipSelect ────────────────────────────────────
function ChipSelect({ options, selected, onToggle, multi = true }: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  multi?: boolean;
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
            {active && <Check size={16} className="ml-auto text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

// ── Goal Form ─────────────────────────────────────
interface GoalDraft {
  title: string;
  area: string;
  deadline: Date | undefined;
  reward: string;
}

function GoalForm({ goal, onChange, onRemove, index }: {
  goal: GoalDraft;
  onChange: (g: GoalDraft) => void;
  onRemove: () => void;
  index: number;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Meta {index + 1}</span>
          {index > 0 && (
            <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          <Input
            value={goal.title}
            onChange={(e) => onChange({ ...goal, title: e.target.value })}
            placeholder="Ex: Treinar 3x por semana na academia durante 30 dias"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Área da vida</Label>
          <div className="flex flex-wrap gap-1.5">
            {LIFE_AREAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onChange({ ...goal, area: a })}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  goal.area === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Prazo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left text-sm font-normal">
                  <CalendarIcon size={14} className="mr-2" />
                  {goal.deadline ? format(goal.deadline, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={goal.deadline}
                  onSelect={(d) => onChange({ ...goal, deadline: d })}
                  className="p-3 pointer-events-auto"
                  disabled={(d) => d < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Recompensa (opcional)</Label>
            <Input value={goal.reward} onChange={(e) => onChange({ ...goal, reward: e.target.value })} placeholder="Ex: Um jantar especial" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Habit Form ────────────────────────────────────
interface HabitDraft {
  emoji: string;
  name: string;
  metricType: string;
  area: string;
}

function HabitForm({ habit, onChange, onRemove, index }: {
  habit: HabitDraft;
  onChange: (h: HabitDraft) => void;
  onRemove: () => void;
  index: number;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Hábito {index + 1}</span>
          {index > 0 && (
            <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Ícone</Label>
          <div className="flex flex-wrap gap-2">
            {HABIT_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onChange({ ...habit, emoji: e })}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all",
                  habit.emoji === e ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:border-primary/30"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nome do hábito</Label>
          <Input value={habit.name} onChange={(e) => onChange({ ...habit, name: e.target.value })} placeholder="Ex: Leitura diária" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Como metrificar</Label>
          <div className="grid grid-cols-2 gap-2">
            {METRIC_TYPES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ ...habit, metricType: m.value })}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all",
                  habit.metricType === m.value ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <span>{m.emoji}</span>
                <span className="text-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Área da vida</Label>
          <div className="flex flex-wrap gap-1.5">
            {LIFE_AREAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onChange({ ...habit, area: a })}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  habit.area === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────
const TOTAL_STEPS = 4;
const DIAG_SUB_STEPS = 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { addGoal, addHabit } = useStore();

  const checkPendingPremium = async (currentUser: { id: string; email?: string }) => {
    if (!currentUser.email) return;
    const { data: pending } = await supabase
      .from("pending_premium")
      .select("*")
      .eq("email", currentUser.email.toLowerCase())
      .eq("processed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (pending && pending.length > 0) {
      const latest = pending[0];
      if (latest.status === "paid" || latest.status === "approved") {
        await supabase
          .from("profiles")
          .update({
            is_premium: true,
            premium_plan: "trimestral",
            premium_since: new Date().toISOString(),
            premium_expires_at: new Date(Date.now() + 93 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("user_id", currentUser.id);

        await supabase
          .from("pending_premium")
          .update({ processed: true })
          .eq("id", latest.id);
      }
    }
  };

  // Step tracking: 0 = welcome, 1-4 = original steps
  const [step, setStep] = useState(0);
  const [diagStep, setDiagStep] = useState(0); // 0-2 within step 2

  // Step 1 data
  const [userName, setUserName] = useState("");
  const [gender, setGender] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [lifeAreas, setLifeAreas] = useState<string[]>([]);
  const [lifeGoals, setLifeGoals] = useState("");

  // Step 2 data
  const [challenges, setChallenges] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<string[]>([]);

  // Step 3 data
  const [goals, setGoals] = useState<GoalDraft[]>([{ title: "", area: "", deadline: undefined, reward: "" }]);

  // Step 4 data
  const [habits, setHabits] = useState<HabitDraft[]>([{ emoji: "👟", name: "", metricType: "check", area: "" }]);

  // Final screen
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleMulti = useCallback((arr: string[], setter: (a: string[]) => void) => (v: string) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }, []);

  const progressPct = () => {
    if (step <= 1) return 25;
    if (step === 2) return 25 + ((diagStep + 1) / DIAG_SUB_STEPS) * 25;
    if (step === 3) return 75;
    return 100;
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        name: userName,
        gender: gender || null,
        main_objective: objectives,
        life_areas: lifeAreas,
        life_goals: lifeGoals || null,
        challenges,
        strengths,
        opportunities,
      })
      .eq("user_id", user.id);
    if (error) console.error("Profile save error:", error);
  };

  const handleNextStep1 = async () => {
    if (!userName.trim()) {
      toast.error("Digite seu nome");
      return;
    }
    await saveProfile();
    setStep(2);
  };

  const handleNextDiag = async () => {
    if (diagStep < DIAG_SUB_STEPS - 1) {
      setDiagStep(diagStep + 1);
    } else {
      await saveProfile();
      setStep(3);
    }
  };

  const handlePrevDiag = () => {
    if (diagStep > 0) setDiagStep(diagStep - 1);
    else setStep(1);
  };

  const handleNextStep3 = async () => {
    // Save goals to store
    const validGoals = goals.filter((g) => g.title.trim());
    validGoals.forEach((g) => {
      addGoal({
        title: g.title,
        type: "meta",
        status: "nao_comecei",
        alignedWithGoal: true,
        deadline: g.deadline ? format(g.deadline, "yyyy-MM-dd") : undefined,
      });
    });
    setStep(4);
  };

  const handleFinish = async () => {
    setSaving(true);
    // Save habits only from onboarding completion
    const validHabits = habits.filter((h) => h.name.trim());
    validHabits.forEach((h) => {
      const targetType = h.metricType === "kcal" || h.metricType === "liters" ? "count" : h.metricType as any;
      addHabit({
        name: h.name,
        icon: h.emoji || undefined,
        color: undefined,
        category: "geral",
        targetType,
        active: true,
        showOnDashboard: true,
        lifeArea: h.area || undefined,
        metricType:
          h.metricType === "hours_minutes"
            ? "tempo"
            : h.metricType === "count"
              ? "numero"
              : h.metricType === "kcal"
                ? "calorias"
                : h.metricType === "liters"
                  ? "litros"
                  : (h.metricType as any),
      });
    });

    // Check pending premium and mark onboarding complete
    if (user) {
      await checkPendingPremium(user);
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
      await refreshProfile();
    }
    setSaving(false);
    setFinished(true);
  };

  const handleSkipStep3 = () => setStep(4);
  const handleSkipStep4 = async () => {
    setSaving(true);
    if (user) {
      await checkPendingPremium(user);
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
      await refreshProfile();
    }
    setSaving(false);
    setFinished(true);
  };

  // ── Final Screen ────────────────────────────────
  if (finished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-in zoom-in duration-500">
            <Check size={40} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tudo pronto, {userName}! 🎉</h1>
            <p className="text-sm text-muted-foreground mt-2">Seu sistema de métricas de vida está configurado.</p>
          </div>
          <Button className="w-full rounded-full" onClick={() => navigate("/dashboard")}>
            Entrar no meu dashboard <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // ── Welcome Screen (step 0) ─────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">metrics</h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide">performance pessoal</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Vamos começar!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vamos configurar seu sistema em poucos minutos. Responda com sinceridade — quanto mais honesta for, mais personalizado fica o seu app.
            </p>
          </div>
          <div className="space-y-3">
            <Button className="w-full rounded-full" onClick={() => setStep(1)}>
              Começar configuração
            </Button>
            <p className="text-xs text-muted-foreground">Leva menos de 5 minutos</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step Renderer ───────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 pt-8 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Etapa {step}/4</span>
            <span>{Math.round(progressPct())}%</span>
          </div>
          <Progress value={progressPct()} className="h-2" />
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Vamos configurar seu sistema</h2>
              <p className="text-sm text-muted-foreground mt-1">Responda com sinceridade. Isso personaliza tudo para você.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Como você gostaria de ser chamado(a)?</Label>
              <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nome ou apelido" />
            </div>

            <div className="space-y-2">
              <Label>Qual seu gênero?</Label>
              <div className="grid grid-cols-3 gap-3">
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
                      "p-3 rounded-2xl border text-sm font-medium text-center transition-all",
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

            <div className="space-y-2">
              <Label>Qual seu objetivo principal com o app?</Label>
              <CardSelect options={OBJECTIVES} selected={objectives} onToggle={toggleMulti(objectives, setObjectives)} />
            </div>

            <div className="space-y-2">
              <Label>Quais áreas da vida você quer focar?</Label>
              <ChipSelect options={LIFE_AREAS} selected={lifeAreas} onToggle={toggleMulti(lifeAreas, setLifeAreas)} />
            </div>

            <div className="space-y-1.5">
              <Label>Meu objetivo atual com o app</Label>
              <p className="text-xs text-muted-foreground">Descreva em uma frase curta e específica o que você quer conquistar nos próximos 6 meses.</p>
              <Input value={lifeGoals} onChange={(e) => setLifeGoals(e.target.value)} placeholder="Ex: emagrecer 10kg" />
              <p className="text-[10px] text-muted-foreground italic">Ex: emagrecer 10kg, passar em um concurso, lançar minha marca, completar um triathlon</p>
            </div>

            <Button className="w-full rounded-full" onClick={handleNextStep1}>
              Próximo <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* ── STEP 2: DIAGNOSIS ── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" key={`diag-${diagStep}`}>
            <div>
              <h2 className="text-xl font-bold text-foreground">Diagnóstico pessoal</h2>
              <p className="text-sm text-muted-foreground mt-1">Essas informações são 100% privadas e ficam salvas em Meu Perfil.</p>
            </div>

            {diagStep === 0 && (
              <div className="space-y-3">
                <Label>O que mais te atrapalha na sua rotina?</Label>
                <ChipSelect options={CHALLENGES} selected={challenges} onToggle={toggleMulti(challenges, setChallenges)} />
              </div>
            )}

            {diagStep === 1 && (
              <div className="space-y-3">
                <Label>Quais são seus pontos fortes?</Label>
                <ChipSelect options={STRENGTHS} selected={strengths} onToggle={toggleMulti(strengths, setStrengths)} />
              </div>
            )}

            {diagStep === 2 && (
              <div className="space-y-3">
                <Label>Quais oportunidades você tem a seu favor?</Label>
                <ChipSelect options={OPPORTUNITIES} selected={opportunities} onToggle={toggleMulti(opportunities, setOpportunities)} />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full" onClick={handlePrevDiag}>
                <ChevronLeft size={16} /> Voltar
              </Button>
              <Button className="flex-1 rounded-full" onClick={handleNextDiag}>
                Próximo <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: GOALS ── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Defina suas primeiras metas</h2>
              <p className="text-sm text-muted-foreground mt-1">Seja específico. Metas vagas não saem do papel.</p>
            </div>

            <Card className="border-border/40 bg-muted/30">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground italic">
                  Ex: Treinar 3x por semana na academia durante 30 dias para melhorar minha disposição
                </p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {goals.map((g, i) => (
                <GoalForm
                  key={i}
                  goal={g}
                  index={i}
                  onChange={(updated) => {
                    const next = [...goals];
                    next[i] = updated;
                    setGoals(next);
                  }}
                  onRemove={() => setGoals(goals.filter((_, j) => j !== i))}
                />
              ))}
            </div>

            {goals.length < 3 && (
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => setGoals([...goals, { title: "", area: "", deadline: undefined, reward: "" }])}
              >
                <Plus size={14} /> Adicionar outra meta
              </Button>
            )}

            <div className="space-y-2">
              <Button className="w-full rounded-full" onClick={handleNextStep3}>
                Salvar metas e continuar <ChevronRight size={16} />
              </Button>
              <button type="button" onClick={handleSkipStep3} className="text-xs text-muted-foreground hover:underline mx-auto block">
                Pular por agora, farei depois
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: HABITS ── */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-bold text-foreground">Crie seus hábitos diários</h2>
              <p className="text-sm text-muted-foreground mt-1">Hábitos pequenos e consistentes criam resultados extraordinários.</p>
              <p className="text-xs text-muted-foreground mt-2">Hábitos diários são ações que você vai registrar todo dia para acompanhar sua consistência ao longo do tempo.</p>
            </div>

            <div className="space-y-4">
              {habits.map((h, i) => (
                <HabitForm
                  key={i}
                  habit={h}
                  index={i}
                  onChange={(updated) => {
                    const next = [...habits];
                    next[i] = updated;
                    setHabits(next);
                  }}
                  onRemove={() => setHabits(habits.filter((_, j) => j !== i))}
                />
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => setHabits([...habits, { emoji: "🎯", name: "", metricType: "check", area: "" }])}
            >
              <Plus size={14} /> Adicionar outro hábito
            </Button>

            <div className="space-y-2">
              <Button className="w-full rounded-full" onClick={handleFinish} disabled={saving}>
                {saving ? "Salvando..." : "Concluir configuração"} <Check size={16} />
              </Button>
              <button type="button" onClick={handleSkipStep4} disabled={saving} className="text-xs text-muted-foreground hover:underline mx-auto block">
                Pular por agora, farei depois
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
