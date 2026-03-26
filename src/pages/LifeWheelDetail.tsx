import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

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

      {/* General average */}
      <Card className="border-primary/30">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Média geral</span>
            <span className="text-2xl font-bold text-primary">
              {Number(assessment.average_score).toFixed(1)}
            </span>
          </div>
          <Progress value={Number(assessment.average_score) * 10} />
        </CardContent>
      </Card>

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
    </div>
  );
}
