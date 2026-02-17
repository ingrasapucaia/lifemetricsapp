import { useStore } from "@/hooks/useStore";
import { format } from "date-fns";
import DayEditor from "@/components/DayEditor";

export default function Dashboard() {
  const { records, habits, profile, upsertRecord } = useStore();

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRecord = records.find((r) => r.date === today);

  return (
    <div className="max-w-2xl">
      <DayEditor
        date={today}
        record={todayRecord}
        habits={habits}
        onUpdate={(u) => upsertRecord({ date: today, ...u })}
        showHeader
        displayName={profile.displayName}
      />
    </div>
  );
}
