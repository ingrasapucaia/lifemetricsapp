import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const CATEGORIES = [
  {
    group: "Qualidade de Vida",
    color: "#FDF3DC",
    textColor: "#7A5C00",
    items: [
      { key: "criatividade_hobbies_diversao", label: "Criatividade, Hobbies e Diversão" },
      { key: "plenitude_felicidade", label: "Plenitude e Felicidade" },
      { key: "espiritualidade", label: "Espiritualidade" },
    ],
  },
  {
    group: "Pessoal",
    color: "#D1F0E0",
    textColor: "#0F6E56",
    items: [
      { key: "saude_disposicao", label: "Saúde e Disposição" },
      { key: "desenvolvimento_intelectual", label: "Desenvolvimento Intelectual" },
      { key: "equilibrio_emocional", label: "Equilíbrio Emocional" },
      { key: "autocuidado", label: "Autocuidado" },
    ],
  },
  {
    group: "Profissional",
    color: "#D6E8FA",
    textColor: "#185FA5",
    items: [
      { key: "realizacao_proposito", label: "Realização e Propósito" },
      { key: "recursos_financeiros", label: "Recursos Financeiros" },
      { key: "contribuicao_social", label: "Contribuição Social" },
    ],
  },
  {
    group: "Relacionamentos",
    color: "#FCDDE8",
    textColor: "#8C2E52",
    items: [
      { key: "familia", label: "Família" },
      { key: "relacionamento_amoroso", label: "Relacionamento Amoroso" },
      { key: "vida_social", label: "Vida Social" },
    ],
  },
];

const ALL_KEYS = CATEGORIES.flatMap((c) => c.items.map((i) => i.key));

export default function LifeWheelNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(ALL_KEYS.map((k) => [k, null]))
  );
  const [saving, setSaving] = useState(false);

  function setScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Dê um nome para esta avaliação");
      return;
    }
    const empty = ALL_KEYS.filter((k) => scores[k] === null);
    if (empty.length > 0) {
      toast.error("Preencha todas as áreas antes de salvar.");
      return;
    }
    if (!user) return;

    setSaving(true);
    const finalScores = Object.fromEntries(ALL_KEYS.map((k) => [k, scores[k]!]));
    const avg = ALL_KEYS.reduce((s, k) => s + scores[k]!, 0) / ALL_KEYS.length;

    const { data, error } = await supabase
      .from("life_wheel_assessments")
      .insert({
        user_id: user.id,
        name: name.trim(),
        scores: finalScores,
        average_score: Math.round(avg * 10) / 10,
      })
      .select("id")
      .single();

    if (error) {
      setSaving(false);
      toast.error("Erro ao salvar avaliação");
      return;
    }

    // Generate AI analysis once, immediately after saving
    try {
      const { data: fnData } = await supabase.functions.invoke("life-wheel-insights", {
        body: { assessmentId: data.id },
      });
      if (fnData?.analysis) {
        await supabase
          .from("life_wheel_assessments")
          .update({
            ai_analysis: fnData.analysis,
            ai_analysis_generated_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      }
    } catch {
      // Analysis failure is silent — assessment was saved successfully
    }

    setSaving(false);
    toast.success("Avaliação salva!");
    navigate(`/roda-da-vida/${data.id}`);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/roda-da-vida")}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Nova Roda da Vida</h1>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>Como quer chamar essa avaliação?</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Janeiro 2026, Q1, Semestre 1..."
        />
      </div>

      {/* Groups */}
      {CATEGORIES.map((cat) => (
        <Card key={cat.group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.textColor }}
              />
              {cat.group}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {cat.items.map((item) => {
              const val = scores[item.key];
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span
                      className="text-sm font-semibold min-w-[2rem] text-center rounded-lg px-2 py-0.5"
                      style={{
                        backgroundColor: val !== null ? cat.color : "hsl(var(--muted))",
                        color: val !== null ? cat.textColor : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {val !== null ? val : "—"}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={val !== null ? [val] : [1]}
                    onValueChange={([v]) => setScore(item.key, v)}
                    className="[&_[role=slider]]:border-2"
                    style={{
                      // @ts-ignore
                      "--slider-color": cat.textColor,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Save */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 p-4 bg-background/90 backdrop-blur-sm border-t border-border/50">
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar e ver minha Roda da Vida"}
        </Button>
      </div>
    </div>
  );
}
