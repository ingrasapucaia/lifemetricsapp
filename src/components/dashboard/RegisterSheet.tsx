import { useState, useEffect, useMemo } from "react";
import { DailyRecord, Habit, MOOD_TAGS, getMoodTag, formatSleepHours } from "@/types";
import { useStore } from "@/hooks/useStore";
import { useMeals, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, MealType, Meal } from "@/hooks/useMeals";
import MealModal from "@/components/meals/MealModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Smile, Moon, UtensilsCrossed, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
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
  const { getMealsForDate, addMeal, updateMeal, deleteMeal, fetchMeals } = useMeals();

  const [mood, setMood] = useState("");
  const [sleepTime, setSleepTime] = useState("");
  const [wakeUp, setWakeUp] = useState("");
  const [habitChecks, setHabitChecks] = useState<Record<string, boolean | number>>({});

  // Meals state
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);

  const dayMeals = useMemo(() => getMealsForDate(date), [getMealsForDate, date]);
  const totalKcal = dayMeals.reduce((sum, m) => sum + (m.kcal || 0), 0);

  const groupedMeals = useMemo(() => {
    const map: Record<string, Meal[]> = {};
    dayMeals.forEach((m) => {
      if (!map[m.meal_type]) map[m.meal_type] = [];
      map[m.meal_type].push(m);
    });
    return map;
  }, [dayMeals]);

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

  const handleMealSave = async (meal: { date: string; meal_type: string; name: string; kcal: number | null; carbs_g: number | null; protein_g: number | null; fat_g: number | null }) => {
    if (editMeal) {
      await updateMeal(editMeal.id, meal);
    } else {
      await addMeal(meal);
    }
    setEditMeal(null);
  };

  const handleDeleteMeal = async (id: string) => {
    await deleteMeal(id);
  };

  const openEditMeal = (meal: Meal) => {
    setEditMeal(meal);
    setMealModalOpen(true);
  };

  const openAddMeal = () => {
    setEditMeal(null);
    setMealModalOpen(true);
  };

  const dateLabel = format(new Date(date + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: pt });

  const moodTag = getMoodTag(mood);

  return (
    <>
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

              {/* Meals */}
              <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed size={16} className="text-primary" />
                    <p className="text-sm font-semibold">Refeições</p>
                    {totalKcal > 0 && (
                      <span className="text-xs text-muted-foreground">({totalKcal} kcal)</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={openAddMeal} className="rounded-xl gap-1 h-7 text-xs">
                    <Plus size={14} />
                    Adicionar
                  </Button>
                </div>

                {dayMeals.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">Nenhuma refeição registrada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {MEAL_TYPE_ORDER.filter((t) => groupedMeals[t]?.length).map((type) => {
                      const items = groupedMeals[type];
                      const groupKcal = items.reduce((s, m) => s + (m.kcal || 0), 0);
                      return (
                        <div key={type} className="rounded-xl bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold">{MEAL_TYPE_LABELS[type as MealType]}</p>
                            <span className="text-xs text-muted-foreground">{groupKcal} kcal</span>
                          </div>
                          {items.map((meal) => (
                            <div key={meal.id} className="flex items-center justify-between py-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{meal.name}</p>
                                {meal.kcal != null && (
                                  <p className="text-xs text-muted-foreground">{meal.kcal} kcal</p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                    <MoreVertical size={12} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditMeal(meal)}>
                                    <Pencil size={14} className="mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteMeal(meal.id)} className="text-destructive">
                                    <Trash2 size={14} className="mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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

      <MealModal
        open={mealModalOpen}
        onOpenChange={setMealModalOpen}
        onSave={handleMealSave}
        defaultDate={date}
        editMeal={editMeal}
      />
    </>
  );
}
