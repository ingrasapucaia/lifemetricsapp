import { useState, useEffect, useCallback, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { getRecordsForPeriod } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";

const INSIGHT_THEMES = [
  { bg: "hsl(var(--metric-habits-bg))", accent: "hsl(var(--metric-habits))" },
  { bg: "hsl(var(--metric-exercise-bg))", accent: "hsl(var(--metric-exercise))" },
  { bg: "hsl(var(--metric-sleep-bg))", accent: "hsl(var(--metric-sleep))" },
];

interface InsightData {
  summary: string[];
  orientations: string[];
  patterns: string[];
  generatedAt?: string;
}

export default function InsightsPage() {
  const { records, habits } = useStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InsightData | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const periodRecords = useMemo(() => getRecordsForPeriod(records, "7d"), [records]);

  const loadCached = useCallback(async () => {
    if (!user) return false;
    try {
      const { data: cached } = await supabase
        .from("daily_insights")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (cached) {
        setData({
          summary: cached.summary || [],
          orientations: cached.orientations || [],
          patterns: cached.patterns || [],
          generatedAt: cached.generated_at,
        });
        return true;
      }
    } catch {
      // No cached data
    }
    return false;
  }, [user, today]);

  const generate = useCallback(async (force = false) => {
    if (!user) return;
    if (!force) {
      const hasCached = await loadCached();
      if (hasCached) return;
    }
    setLoading(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("generate-insights", {
        body: { habits, records: periodRecords.slice(0, 60) },
      });
      if (error) { toast.error("Erro ao gerar insights."); setLoading(false); return; }
      if (fnData?.error === "rate_limited") { toast.error("Limite atingido. Tente em alguns minutos."); setLoading(false); return; }
      if (fnData?.error === "payment_required") { toast.error("Créditos de IA esgotados."); setLoading(false); return; }
      if (fnData) {
        setData({
          summary: fnData.summary || [],
          orientations: fnData.orientations || [],
          patterns: fnData.patterns || [],
          generatedAt: new Date().toISOString(),
        });
      }
    } catch { toast.error("Erro ao gerar insights."); }
    setLoading(false);
  }, [user, habits, periodRecords, loadCached]);

  useEffect(() => { generate(false); }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles size={22} className="text-primary" /> Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Análise personalizada da sua evolução</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => generate(true)} disabled={loading} className="rounded-xl gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar insights
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-0" style={{ backgroundColor: INSIGHT_THEMES[i].bg }}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-32 bg-foreground/5" />
                <Skeleton className="h-3 w-full bg-foreground/5" />
                <Skeleton className="h-3 w-3/4 bg-foreground/5" />
                <Skeleton className="h-3 w-5/6 bg-foreground/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            <FullInsightCard title="Resumo do dia" items={data.summary} theme={INSIGHT_THEMES[0]} />
            <FullInsightCard title="Micro-orientações" items={data.orientations} theme={INSIGHT_THEMES[1]} />
            <FullInsightCard title="Padrões do período" items={data.patterns} theme={INSIGHT_THEMES[2]} />
          </div>
          {data.generatedAt && (
            <p className="text-xs text-muted-foreground text-center">
              Gerado em {format(new Date(data.generatedAt), "dd/MM/yyyy")} às {format(new Date(data.generatedAt), "HH:mm")}
            </p>
          )}
        </>
      ) : (
        <Card className="border border-border/60">
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <Sparkles size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum insight gerado ainda</p>
            <Button onClick={() => generate(true)} disabled={loading} className="w-full rounded-xl">
              Gerar meus primeiros insights
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FullInsightCard({ title, items, theme }: { title: string; items: string[]; theme: { bg: string; accent: string } }) {
  return (
    <Card className="border-0" style={{ backgroundColor: theme.bg }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((s, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-xs font-medium mt-0.5 shrink-0" style={{ color: theme.accent }}>{i + 1}.</span>
              {s}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
