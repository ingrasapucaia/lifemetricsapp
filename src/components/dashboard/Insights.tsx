import { useState, useEffect } from "react";
import { DailyRecord, Habit, UserProfile } from "@/types";
import { calculatePeriodMetrics } from "@/lib/metrics";
import { generateDaySummary, generateMicroOrientations, generatePeriodPatterns } from "@/lib/insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";

interface Props {
  records: DailyRecord[];
  habits: Habit[];
  profile: UserProfile;
  todayRecord: DailyRecord | undefined;
}

interface InsightData {
  summary: string[];
  orientations: string[];
  patterns: string[];
}

export default function Insights({ records, habits, profile, todayRecord }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InsightData | null>(null);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const m = calculatePeriodMetrics(records, habits);
      setData({
        summary: generateDaySummary(todayRecord, habits, m.avgSleep, m.avgMood, profile.preferences.insightsTone),
        orientations: generateMicroOrientations(records, habits, profile),
        patterns: generatePeriodPatterns(records, habits),
      });
      setLoading(false);
    }, 800 + Math.random() * 400);
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (records.length < 3 && !data) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Sparkles className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-muted-foreground">
            Registre mais {3 - records.length} dia(s) para insights melhores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles size={18} /> Insights
        </h2>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Gerar insights
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard title="Resumo do dia" items={data.summary} />
          <InsightCard title="Micro-orientações" items={data.orientations} />
          <InsightCard title="Padrões do período" items={data.patterns} />
        </div>
      ) : null}
    </section>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.map((s, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed">
              {s}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
