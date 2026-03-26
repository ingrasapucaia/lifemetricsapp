import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreVertical, Trash2, Sparkles, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const CATEGORIES = [
  {
    group: "Qualidade de Vida",
    color: "#FDF3DC",
    textColor: "#7A5C00",
    items: [
      { key: "criatividade_hobbies_diversao", label: "Criatividade" },
      { key: "plenitude_felicidade", label: "Plenitude" },
      { key: "espiritualidade", label: "Espiritualidade" },
    ],
  },
  {
    group: "Pessoal",
    color: "#D1F0E0",
    textColor: "#0F6E56",
    items: [
      { key: "saude_disposicao", label: "Saúde" },
      { key: "desenvolvimento_intelectual", label: "Intelectual" },
      { key: "equilibrio_emocional", label: "Emocional" },
      { key: "autocuidado", label: "Autocuidado" },
    ],
  },
  {
    group: "Profissional",
    color: "#D6E8FA",
    textColor: "#185FA5",
    items: [
      { key: "realizacao_proposito", label: "Propósito" },
      { key: "recursos_financeiros", label: "Financeiro" },
      { key: "contribuicao_social", label: "Social" },
    ],
  },
  {
    group: "Relacionamentos",
    color: "#FCDDE8",
    textColor: "#8C2E52",
    items: [
      { key: "familia", label: "Família" },
      { key: "relacionamento_amoroso", label: "Amoroso" },
      { key: "vida_social", label: "Vida Social" },
    ],
  },
];

const FULL_LABELS: Record<string, string> = {
  criatividade_hobbies_diversao: "Criatividade, Hobbies e Diversão",
  plenitude_felicidade: "Plenitude e Felicidade",
  espiritualidade: "Espiritualidade",
  saude_disposicao: "Saúde e Disposição",
  desenvolvimento_intelectual: "Desenvolvimento Intelectual",
  equilibrio_emocional: "Equilíbrio Emocional",
  autocuidado: "Autocuidado",
  realizacao_proposito: "Realização e Propósito",
  recursos_financeiros: "Recursos Financeiros",
  contribuicao_social: "Contribuição Social",
  familia: "Família",
  relacionamento_amoroso: "Relacionamento Amoroso",
  vida_social: "Vida Social",
};

interface Assessment {
  id: string;
  name: string;
  scores: Record<string, number>;
  average_score: number;
  created_at: string;
}

export default function LifeWheelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  // Insights state
  const [isPremium, setIsPremium] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisGeneratedAt, setAnalysisGeneratedAt] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("life_wheel_assessments")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Avaliação não encontrada");
          navigate("/roda-da-vida");
          return;
        }
        setAssessment({
          ...data,
          scores: data.scores as Record<string, number>,
        });
        setLoading(false);
      });
  }, [id]);

  // Check premium status
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setIsPremium(!!(data as any)?.is_premium);
      });
  }, [user]);

  // Generate insights on load
  useEffect(() => {
    if (assessment && user) {
      generateAnalysis();
    }
  }, [assessment, user]);

  const generateAnalysis = useCallback(async () => {
    if (!id || !user) return;
    setAnalysisLoading(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("life-wheel-insights", {
        body: { assessmentId: id },
      });
      if (error) {
        console.error("Edge function error:", error);
        toast.error("Erro ao gerar análise.");
        setAnalysisLoading(false);
        return;
      }
      if (fnData?.error === "rate_limited") {
        toast.error("Limite atingido. Tente em alguns minutos.");
        setAnalysisLoading(false);
        return;
      }
      if (fnData?.error === "payment_required") {
        toast.error("Créditos de IA esgotados.");
        setAnalysisLoading(false);
        return;
      }
      if (fnData?.analysis) {
        setAnalysis(fnData.analysis);
        setAnalysisGeneratedAt(new Date().toISOString());
      }
    } catch {
      toast.error("Erro ao gerar análise.");
    }
    setAnalysisLoading(false);
  }, [id, user]);

  async function handleDelete() {
    if (!id) return;
    await supabase.from("life_wheel_assessments").delete().eq("id", id);
    toast.success("Avaliação excluída");
    navigate("/roda-da-vida");
  }

  if (loading || !assessment) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-80 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  const scores = assessment.scores;
  const radarData = CATEGORIES.flatMap((c) =>
    c.items.map((i) => ({ subject: i.label, value: scores[i.key] || 0, fullMark: 10 }))
  );

  const truncatedAnalysis = analysis
    ? analysis.split(/\s+/).slice(0, 15).join(" ") + "..."
    : "";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/roda-da-vida")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{assessment.name}</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(assessment.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/roda-da-vida/${id}/editar`)}>
              <ArrowLeft size={14} className="mr-2 rotate-180" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDelete(true)} className="text-destructive">
              <Trash2 size={14} className="mr-2" /> Excluir avaliação
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              />
              <Radar
                name="Nota"
                dataKey="value"
                stroke="hsl(168, 64%, 38%)"
                fill="hsl(168, 64%, 38%)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Group summaries */}
      {CATEGORIES.map((cat) => {
        const groupScores = cat.items.map((i) => scores[i.key] || 0);
        const groupAvg = groupScores.reduce((a, b) => a + b, 0) / groupScores.length;
        return (
          <Card key={cat.group}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.textColor }} />
                  {cat.group}
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: cat.color, color: cat.textColor }}
                >
                  {groupAvg.toFixed(1)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cat.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{FULL_LABELS[item.key]}</span>
                  <span className="font-medium text-foreground">{scores[item.key]}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* AI Insights Section */}
      {analysisLoading ? (
        <Card className="border-0" style={{ backgroundColor: "hsl(270, 60%, 96%)" }}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              <span className="text-sm font-medium text-foreground">Análise da sua Roda da Vida</span>
            </div>
            <div className="h-3 w-full bg-purple-200/40 animate-pulse rounded" />
            <div className="h-3 w-3/4 bg-purple-200/40 animate-pulse rounded" />
            <div className="h-3 w-5/6 bg-purple-200/40 animate-pulse rounded" />
          </CardContent>
        </Card>
      ) : analysis ? (
        isPremium ? (
          /* Premium: full insight */
          <Card className="border-0" style={{ backgroundColor: "hsl(270, 60%, 96%)" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                Análise da sua Roda da Vida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {analysis}
              </p>
              {analysisGeneratedAt && (
                <p className="text-[11px] text-muted-foreground/60">
                  Gerado em {format(new Date(analysisGeneratedAt), "dd/MM/yyyy")} às {format(new Date(analysisGeneratedAt), "HH:mm")}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateAnalysis()}
                disabled={analysisLoading}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2 h-7"
              >
                <RefreshCw size={12} className={analysisLoading ? "animate-spin" : ""} />
                Regenerar análise
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Free: locked card */
          <Card
            className="border-0 relative overflow-hidden cursor-pointer"
            style={{ backgroundColor: "hsl(270, 60%, 96%)" }}
            onClick={() => setShowUpgrade(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                Análise da sua Roda da Vida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Blurred preview */}
              <div className="relative">
                <p className="text-sm text-muted-foreground leading-relaxed blur-[6px] select-none">
                  {truncatedAnalysis}
                </p>
                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <Lock size={18} className="text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Disponível no plano Premium</span>
                </div>
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }}
              >
                Desbloquear agora →
              </Button>
            </CardContent>
          </Card>
        )
      ) : null}

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles size={28} className="text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">Desbloqueie sua análise completa</h2>
              <p className="text-sm text-muted-foreground">
                Entenda profundamente cada área da sua vida e receba orientações personalizadas
                baseadas nos seus objetivos e metas reais.
              </p>
            </div>
            <div className="w-full text-left space-y-2.5 bg-muted/50 rounded-xl p-4">
              {[
                "Análise completa da Roda da Vida com IA",
                "Insights personalizados diários",
                "Relatórios de evolução por área",
                "Acesso a todas as funcionalidades futuras",
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 mt-0.5 shrink-0">✦</span>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full rounded-xl"
              onClick={() => {
                setShowUpgrade(false);
                toast.info("Em breve! Entraremos em contato.");
              }}
            >
              Quero ser Premium →
            </Button>
            <button
              onClick={() => setShowUpgrade(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Agora não
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
