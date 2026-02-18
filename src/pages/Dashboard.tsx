import { useState, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { Period } from "@/types";
import { getRecordsForPeriod } from "@/lib/metrics";
import { format } from "date-fns";
import CheckIn from "@/components/dashboard/CheckIn";
import Metrics from "@/components/dashboard/Metrics";
import Insights from "@/components/dashboard/Insights";

export default function Dashboard() {
  const { records, habits, profile } = useStore();
  const [period, setPeriod] = useState<Period>("7d");

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRecord = records.find((r) => r.date === today);
  const periodRecords = useMemo(() => getRecordsForPeriod(records, period), [records, period]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {profile.displayName && (
          <p className="text-xl text-muted-foreground mt-1">
            Seja bem vinda, {profile.displayName}.
          </p>
        )}
      </div>

      <CheckIn today={today} record={todayRecord} habits={habits} />

      <Metrics records={periodRecords} habits={habits} period={period} setPeriod={setPeriod} />
      <Insights records={periodRecords} habits={habits} profile={profile} todayRecord={todayRecord} />
    </div>
  );
}
