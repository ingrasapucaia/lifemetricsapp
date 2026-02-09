import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { Period } from "@/types";
import { getRecordsForPeriod } from "@/lib/metrics";
import { format } from "date-fns";
import CheckIn from "@/components/dashboard/CheckIn";
import Metrics from "@/components/dashboard/Metrics";
import Insights from "@/components/dashboard/Insights";
import { cn } from "@/lib/utils";

const periods: { value: Period; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "total", label: "Total" },
];

export default function Dashboard() {
  const { records, habits, profile } = useStore();
  const [period, setPeriod] = useState<Period>("7d");

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRecord = records.find((r) => r.date === today);
  const periodRecords = useMemo(() => getRecordsForPeriod(records, period), [records, period]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {period === "7d" ? "Últimos 7 dias" : period === "30d" ? "Últimos 30 dias" : "Todos os registros"}
          </p>
        </div>
        <div className="flex bg-muted rounded-lg p-1 self-start">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
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

      <CheckIn today={today} record={todayRecord} habits={habits} />
      <Metrics records={periodRecords} habits={habits} />
      <Insights records={periodRecords} habits={habits} profile={profile} todayRecord={todayRecord} />
    </div>
  );
}
