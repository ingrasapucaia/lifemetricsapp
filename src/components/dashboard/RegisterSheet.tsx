import { useState, useRef, useCallback, useEffect } from "react";
import { DailyRecord, Habit, MOOD_TAGS, getMoodTag, formatSleepHours } from "@/types";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smile, Moon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import HabitCardGrid from "./HabitCardGrid";

function TimeSelect({ hours, minutes, onChangeHours, onChangeMinutes }: {
  hours: number;
  minutes: number;
  onChangeHours: (h: number) => void;
  onChangeMinutes: (m: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={String(hours)} onValueChange={(v) => onChangeHours(Number(v))}>
        <SelectTrigger className="w-[72px] rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 24 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}h</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(minutes)} onValueChange={(v) => onChangeMinutes(Number(v))}>
        <SelectTrigger className="w-[80px] rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 60 }, (_, i) => (
            <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}min</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function calculateSleepDuration(sleepTime: string, wakeTime: string): number {
  if (!sleepTime || !wakeTime) return 0;
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let sleepMins = sh * 60 + sm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= sleepMins) wakeMins += 24 * 60;
  return +((wakeMins - sleepMins) / 60).toFixed(2);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  record: DailyRecord | undefined;
  habits: Habit[];
}

export default function RegisterSheet({ open, onOpenChange, date, record, habits }: Props) {
  const { upsertRecord } = useStore();

  // Local state for the form
  const [mood, setMood] = useState("");
  const [sleepTime, setSleepTime] = useState("");
  const [wakeUp, setWakeUp] = useState("");
  const [habitChecks, setHabitChecks] = useState<Record<string, boolean | number>>({});

  // Sync from record when opening
  useEffect(() => {
    if (open) {
      setMood(record?.mood || "");
      setSleepTime(record?.sleepTime || "");
      setWakeUp(record?.wakeUpTime || "");
      setHabitChecks(record?.habitChecks || {});
    }
  }, [open, record]);

  const [sleepH, sleepM] = sleepTime ? sleepTime.split(":").map(Number) : [23, 0];
  const [wakeH, wakeM] = wakeUp ? wakeUp.split(":").map(Number) : [7, 0];
  const calculatedSleep = calculateSleepDuration(sleepTime || "23:00", wakeUp || "07:00");

  const updateSleepTime = (h: number, m: number) => {
    setSleepTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const updateWakeTime = (h: number, m: number) => {
    setWakeUp(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const handleSave = () => {
    const effectiveSleep = sleepTime || "23:00";
    const effectiveWake = wakeUp || "07:00";
    const sleepHours = calculateSleepDuration(effectiveSleep, effectiveWake);

    upsertRecord({
      date,
      mood,
      sleepTime: effectiveSleep,
      wakeUpTime: effectiveWake,
      sleepHours,
      habitChecks,
    });

    toast.success("Registro salvo!");
    onOpenChange(false);
  };

  const dateLabel = format(new Date(date + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: pt });

  const moodTag = getMoodTag(mood);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg capitalize">{dateLabel}</DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 140px)" }}>
          <div className="space-y-6 pb-4">
            {/* Mood */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smile size={16} className="text-primary" />
                <p className="text-sm font-semibold">Humor</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOOD_TAGS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
                      mood === m.value
                        ? "ring-2 ring-primary ring-offset-2 scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: `hsl(${m.bgHsl})` }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: `hsl(${m.hsl})` }} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon size={16} style={{ color: "hsl(var(--metric-sleep))" }} />
                <p className="text-sm font-semibold">Sono</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dormi às</p>
                  <TimeSelect
                    hours={sleepH} minutes={sleepM}
                    onChangeHours={(h) => updateSleepTime(h, sleepM)}
                    onChangeMinutes={(m) => updateSleepTime(sleepH, m)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Acordei às</p>
                  <TimeSelect
                    hours={wakeH} minutes={wakeM}
                    onChangeHours={(h) => updateWakeTime(h, wakeM)}
                    onChangeMinutes={(m) => updateWakeTime(wakeH, m)}
                  />
                </div>
              </div>
              {(sleepTime || wakeUp) && (
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--metric-sleep))" }}>
                  Dormiu {formatSleepHours(calculatedSleep)}
                </p>
              )}
            </div>

            {/* Habits */}
            <HabitCardGrid
              habits={habits}
              checks={habitChecks}
              onUpdate={setHabitChecks}
              initialCount={4}
            />
          </div>
        </ScrollArea>

        <DrawerFooter className="pt-2">
          <Button
            onClick={handleSave}
            className="w-full rounded-xl h-12 text-base font-semibold"
          >
            Salvar registro do dia
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
