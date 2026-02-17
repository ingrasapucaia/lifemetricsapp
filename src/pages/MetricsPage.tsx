import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { Period } from "@/types";
import { getRecordsForPeriod } from "@/lib/metrics";
import Metrics from "@/components/dashboard/Metrics";
import Insights from "@/components/dashboard/Insights";
import { cn } from "@/lib/utils";

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "total", label: "Total" },
];

export default function MetricsPage() {
  const { records, habits, profile } = useStore();
  const [period, setPeriod] = useState<Period>("7d");

  const todayRecord = records.find((r) => r.date === new Date().toISOString().slice(0, 10));
  const periodRecords = useMemo(() => getRecordsForPeriod(records, period), [records, period]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Métricas Atuais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {period === "7d" ? "Últimos 7 dias" : period === "30d" ? "Últimos 30 dias" : "Todos os registros"}
          </p>
        </div>
        <div className="flex bg-muted rounded-md p-0.5">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded transition-colors",
                period === p.value
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Metrics records={periodRecords} habits={habits} />
      <Insights records={periodRecords} habits={habits} profile={profile} todayRecord={todayRecord} />
    </div>
  );
}
