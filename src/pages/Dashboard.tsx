import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { format, isAfter, startOfDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import Deadlines from "@/pages/Deadlines";

import WeekCalendar from "@/components/dashboard/WeekCalendar";
import WeeklyStreakCard from "@/components/dashboard/WeeklyStreakCard";
import DailyMetricsGrid from "@/components/dashboard/DailyMetricsGrid";
import HabitCardGrid from "@/components/dashboard/HabitCardGrid";
import RegisterSheet from "@/components/dashboard/RegisterSheet";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { records, habits } = useStore();
  const { profile: authProfile } = useAuth();
  const displayName = authProfile?.name;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDate, setSheetDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deadlinesOpen, setDeadlinesOpen] = useState(false);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayRecord = records.find((r) => r.date === selectedDateStr);

  const checks = todayRecord?.habitChecks || {};

  const handleDaySelect = (day: Date) => {
    const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
    if (isFuture) return;
    setSelectedDate(day);
    setSheetDate(format(day, "yyyy-MM-dd"));
    setSheetOpen(true);
  };

  const handleRegisterToday = () => {
    setSheetDate(todayStr);
    setSheetOpen(true);
  };

  const { upsertRecord } = useStore();

  const onDashboardHabitUpdate = (newChecks: Record<string, boolean | number>) => {
    upsertRecord({ date: selectedDateStr, habitChecks: newChecks });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {getGreeting()}{displayName ? `, ${displayName}` : ""}
          </h1>
        </div>
        <button
          onClick={() => setDeadlinesOpen(true)}
          className="p-2 rounded-full hover:bg-muted/60 transition-colors"
        >
          <Bell size={22} className="text-muted-foreground" />
        </button>
      </div>

      {/* Week Calendar */}
      <WeekCalendar
        selectedDate={selectedDate}
        onSelectDate={handleDaySelect}
        weekOffset={weekOffset}
        onWeekChange={setWeekOffset}
        records={records}
      />

      {/* Weekly Streak Card */}
      <WeeklyStreakCard records={records} objective={authProfile?.life_goals} />

      {/* Daily Metrics */}
      <DailyMetricsGrid
        todayRecord={todayRecord}
        records={records}
        habits={habits}
        selectedDate={selectedDateStr}
      />

      {/* Habits Grid */}
      <HabitCardGrid
        habits={habits}
        checks={checks}
        onUpdate={onDashboardHabitUpdate}
        initialCount={4}
      />

      {/* Floating button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={handleRegisterToday}
          className="h-12 px-6 rounded-full shadow-lg text-base font-semibold gap-2"
        >
          <Plus size={18} />
          Registrar meu dia
        </Button>
      </div>

      {/* Deadlines Sheet */}
      <Sheet open={deadlinesOpen} onOpenChange={setDeadlinesOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Prazos e lembretes</SheetTitle>
            <SheetDescription>Visualize seus prazos e lembretes</SheetDescription>
          </SheetHeader>
          <div className="p-5 pt-8">
            <Deadlines />
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Sheet */}
      <RegisterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={sheetDate}
        record={records.find((r) => r.date === sheetDate)}
        habits={habits}
      />
    </div>
  );
}
