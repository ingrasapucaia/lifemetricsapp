import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DailyRecord, Habit } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

const INSIGHT_THEMES = [
  { bg: "hsl(var(--metric-habits-bg))", accent: "hsl(var(--metric-habits))" },
  { bg: "hsl(var(--metric-exercise-bg))", accent: "hsl(var(--metric-exercise))" },
  { bg: "hsl(var(--metric-sleep-bg))", accent: "hsl(var(--metric-sleep))" },
];

interface Props {
  records: DailyRecord[];
  habits: Habit[];
  todayRecord: DailyRecord | undefined;
}

interface InsightData {
  summary: string[];
  orientations: string[];
  patterns: string[];
}

export default function Insights({ records, habits, todayRecord }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InsightData | null>(null);
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const navigate = useNavigate();

  const loadCached = useCallback(async () => {
    if (!user) return false;
    try {
      const { data: cached } = await supabase
        .from("daily_insights" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (cached) {
        setData({
          summary: (cached as any).summary || [],
          orientations: (cached as any).orientations || [],
          patterns: (cached as any).patterns || [],
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
        body: {},
      });

      if (error) {
        console.error("Error generating insights:", error);
        toast.error("Erro ao gerar insights. Tente novamente.");
        setLoading(false);
        return;
      }

      if (fnData?.error === "rate_limited") {
        toast.error("Limite de requisições atingido. Tente novamente em alguns minutos.");
        setLoading(false);
        return;
      }

      if (fnData?.error === "payment_required") {
        toast.error("Créditos de IA esgotados.");
        setLoading(false);
        return;
      }

      if (fnData) {
        setData({
          summary: fnData.summary || [],
          orientations: fnData.orientations || [],
          patterns: fnData.patterns || [],
        });
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro ao gerar insights.");
    }
    setLoading(false);
  }, [user, habits, records, loadCached]);

  useEffect(() => {
    generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-metric-exercise" /> Insights do dia
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => generate(true)}
            disabled={loading}
            className="h-7 w-7 rounded-lg"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
        <button
          onClick={() => navigate("/insights")}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver tudo →
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-0" style={{ backgroundColor: INSIGHT_THEMES[i].bg }}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-32 bg-foreground/5" />
                <Skeleton className="h-3 w-full bg-foreground/5" />
                <Skeleton className="h-3 w-3/4 bg-foreground/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryInsightCard title="Resumo do dia" items={data.summary} theme={INSIGHT_THEMES[0]} />
          <SummaryInsightCard title="Micro-orientações" items={data.orientations} theme={INSIGHT_THEMES[1]} />
          <SummaryInsightCard title="Padrões do período" items={data.patterns} theme={INSIGHT_THEMES[2]} />
        </div>
      ) : null}
    </section>
  );
}

function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  // Cut roughly in the middle-to-end to create curiosity
  const cutPoint = Math.min(maxWords, words.length);
  return words.slice(0, cutPoint).join(" ") + "...";
}

function SummaryInsightCard({ title, items, theme }: { title: string; items: string[]; theme: { bg: string; accent: string } }) {
  const navigate = useNavigate();
  const firstItem = items[0] || "";
  const snippet = truncateToWords(firstItem, 15);

  return (
    <Card className="border-0" style={{ backgroundColor: theme.bg }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{snippet}</p>
        <button
          onClick={() => navigate("/insights")}
          className="text-xs font-medium text-primary hover:underline mt-3 block"
        >
          Ver completo →
        </button>
      </CardContent>
    </Card>
  );
}
