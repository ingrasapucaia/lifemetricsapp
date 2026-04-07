import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useMeals, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, MealType, Meal } from "@/hooks/useMeals";
import { supabase } from "@/integrations/supabase/client";
import { DailyRecord, MOOD_TAGS, getMoodTag, moodToNumber, formatSleepHours } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MealModal from "@/components/meals/MealModal";
import { calculateDailyAdherence, isHabitCompleted } from "@/lib/metrics";
import { toast } from "sonner";
import { Plus, Trash2, Search, X, CalendarDays, List, Moon, Droplets, Dumbbell, BarChart3, UtensilsCrossed, MoreVertical, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Records() {
  const { records, habits, upsertRecord, deleteRecord } = useStore();
  const { user, profile, refreshProfile } = useAuth();
  const { meals, addMeal, updateMeal, deleteMeal, getMealsForDate, getDatesWithMeals } = useMeals();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("calendar");
  const [showNew, setShowNew] = useState(false);
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowNew(true);
      setNewDate(format(new Date(), "yyyy-MM-dd"));
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const dateset = useMemo(() => new Set(records.map((r) => r.date)), [records]);
  const dateStr = selected ? format(selected, "yyyy-MM-dd") : "";
  const selRecord = records.find((r) => r.date === dateStr);
  const active = habits.filter((h) => h.active);

  const filtered = useMemo(() => {
    let list = [...records].sort((a, b) => b.date.localeCompare(a.date));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.noteFeeling?.toLowerCase().includes(q) ||
          r.noteProcrastination?.toLowerCase().includes(q) ||
          r.noteGratitude?.toLowerCase().includes(q) ||
          r.date.includes(q)
      );
    }
    return list;
  }, [records, search]);

  const handleCreate = () => {
    if (!newDate) return;
    if (dateset.has(newDate)) {
      toast.error("Já existe registro para esta data");
      setSelected(parseISO(newDate));
      setShowNew(false);
      return;
    }
    upsertRecord({ date: newDate });
    setSelected(parseISO(newDate));
    setShowNew(false);
    setNewDate("");
    toast("Registro criado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Registros</h1>
        <Button onClick={() => { setShowNew(true); setNewDate(format(new Date(), "yyyy-MM-dd")); }} className="rounded-xl">
          <Plus size={16} /> Novo registro
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar nas notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
          id="records-search"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="calendar" className="gap-2 rounded-lg"><CalendarDays size={14} /> Calendário</TabsTrigger>
          <TabsTrigger value="list" className="gap-2 rounded-lg"><List size={14} /> Lista</TabsTrigger>
          <TabsTrigger value="meals" className="gap-2 rounded-lg"><UtensilsCrossed size={14} /> Refeições</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mt-4">
            <Card className="w-fit h-fit">
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={setSelected}
                  locale={ptBR}
                  modifiers={{ hasRecord: (d: Date) => dateset.has(format(d, "yyyy-MM-dd")) }}
                  modifiersStyles={{
                    hasRecord: { fontWeight: 700, textDecoration: "underline", textDecorationColor: "hsl(168,64%,38%)", textUnderlineOffset: "3px" },
                  }}
                />
              </CardContent>
            </Card>

            <DayPanel
              record={selRecord}
              date={dateStr}
              habits={active}
              onUpdate={(u) => { upsertRecord({ date: dateStr, ...u }); toast("Salvo"); }}
              onDelete={() => selRecord && setDelTarget(selRecord.id)}
            />
          </div>
        </TabsContent>

        <TabsContent value="list">
          {filtered.length === 0 ? (
            <Card className="text-center py-8 mt-4">
              <CardContent>
                <p className="text-muted-foreground">
                  {search ? "Nenhum registro encontrado." : "Nenhum registro ainda."}
                </p>
                {search && <Button variant="link" onClick={() => setSearch("")}>Limpar busca</Button>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 mt-4">
              {filtered.map((r) => {
                const adh = calculateDailyAdherence(r, habits);
                const tag = getMoodTag(r.mood);
                return (
                  <Card
                    key={r.id}
                    className="cursor-pointer hover:shadow-card-hover transition-all duration-200"
                    onClick={() => { setSelected(parseISO(r.date)); setActiveTab("calendar"); }}
                  >
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium">{format(parseISO(r.date), "dd/MM/yyyy")}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {tag && (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
                              style={{ backgroundColor: `hsl(${tag.bgHsl})` }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.hsl})` }} />
                              {tag.label}
                            </span>
                          )}
                          {r.sleepHours > 0 && <Badge variant="secondary" className="rounded-full">{formatSleepHours(r.sleepHours)}</Badge>}
                          <Badge variant="secondary" className="rounded-full">{adh}%</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-xl">Ver</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meals">
          <MealsTab
            user={user}
            profile={profile}
            refreshProfile={refreshProfile}
          />
        </TabsContent>

      </Tabs>

      {/* New record */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo registro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNew(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleCreate} className="rounded-xl">Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteRecord(delTarget!); setDelTarget(null); toast("Registro deletado"); }}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Meals Tab ─── */
function MealsTab({ user, profile, refreshProfile }: { user: any; profile: any; refreshProfile: () => Promise<void> }) {
  const { meals, addMeal, updateMeal, deleteMeal, getMealsForDate, getDatesWithMeals } = useMeals();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [defaultMealType, setDefaultMealType] = useState<MealType | undefined>();
  const [kcalGoal, setKcalGoal] = useState<string>("");
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    setKcalGoal(profile?.daily_kcal_goal ? String(profile.daily_kcal_goal) : "");
  }, [profile?.daily_kcal_goal]);

  const handleSaveGoal = async () => {
    if (!user) return;
    setSavingGoal(true);
    const { error } = await supabase
      .from("profiles")
      .update({ daily_kcal_goal: kcalGoal ? Number(kcalGoal) : null })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar meta");
    } else {
      toast("Meta calórica atualizada!");
      await refreshProfile();
    }
    setSavingGoal(false);
  };

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dayMeals = useMemo(() => getMealsForDate(dateStr), [getMealsForDate, dateStr]);
  const datesWithMeals = useMemo(() => getDatesWithMeals(), [getDatesWithMeals]);

  const grouped = useMemo(() => {
    const map: Record<string, Meal[]> = {};
    dayMeals.forEach((m) => {
      if (!map[m.meal_type]) map[m.meal_type] = [];
      map[m.meal_type].push(m);
    });
    return map;
  }, [dayMeals]);

  const totalKcal = dayMeals.reduce((s, m) => s + (m.kcal || 0), 0);
  const totalCarbs = dayMeals.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const totalProtein = dayMeals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const totalFat = dayMeals.reduce((s, m) => s + (m.fat_g || 0), 0);

  const handleSave = async (meal: { date: string; meal_type: string; name: string; kcal: number | null; carbs_g: number | null; protein_g: number | null; fat_g: number | null }) => {
    if (editMeal) {
      await updateMeal(editMeal.id, meal);
    } else {
      await addMeal(meal);
    }
    setEditMeal(null);
    setDefaultMealType(undefined);
  };

  const openAddForType = (type: MealType) => {
    setEditMeal(null);
    setDefaultMealType(type);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditMeal(null);
    setDefaultMealType(undefined);
    setModalOpen(true);
  };

  const openEdit = (meal: Meal) => {
    setEditMeal(meal);
    setDefaultMealType(undefined);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Kcal Goal */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-sm">Meta calórica diária (kcal)</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              min={0}
              value={kcalGoal}
              onChange={(e) => setKcalGoal(e.target.value)}
              placeholder="Ex: 2000"
              className="flex-1 rounded-xl"
            />
            <Button
              size="sm"
              onClick={handleSaveGoal}
              disabled={savingGoal || kcalGoal === (profile?.daily_kcal_goal ? String(profile.daily_kcal_goal) : "")}
              className="rounded-xl gap-1"
            >
              <Check size={14} />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            locale={ptBR}
            className="p-0 pointer-events-auto"
            modifiers={{ hasMeals: datesWithMeals.map((d) => parseISO(d)) }}
            modifiersClassNames={{ hasMeals: "has-meals-dot" }}
          />
        </CardContent>
      </Card>

      {/* Day panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold capitalize">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          {dayMeals.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalKcal} kcal · {totalCarbs}g carb · {totalProtein}g proteína · {totalFat}g gordura
            </p>
          )}
        </div>
        <Button onClick={openAdd} className="rounded-xl gap-1.5" size="sm">
          <Plus size={14} />
          Adicionar
        </Button>
      </div>

      {dayMeals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <UtensilsCrossed size={32} className="mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma refeição registrada</p>
            <Button variant="outline" onClick={openAdd} className="rounded-xl gap-1.5">
              <Plus size={14} />
              Registrar primeira refeição
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {MEAL_TYPE_ORDER.filter((t) => grouped[t]?.length).map((type) => {
            const items = grouped[type];
            const groupKcal = items.reduce((s, m) => s + (m.kcal || 0), 0);
            return (
              <Card key={type}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{MEAL_TYPE_LABELS[type as MealType]}</h3>
                      <span className="text-xs text-muted-foreground">({groupKcal} kcal)</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAddForType(type as MealType)}>
                          <Plus size={14} className="mr-2" />
                          Adicionar item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {items.map((meal) => (
                    <div key={meal.id} className="flex items-start gap-3 py-2 border-t border-border/40">
                      <div className="w-[4px] rounded-full self-stretch bg-primary/30 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{meal.name}</p>
                          <div className="flex items-center gap-1">
                            {meal.kcal != null && (
                              <span className="text-sm text-muted-foreground">{meal.kcal} kcal</span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <MoreVertical size={12} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(meal)}>
                                  <Pencil size={14} className="mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteMeal(meal.id)} className="text-destructive">
                                  <Trash2 size={14} className="mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {(meal.carbs_g || meal.protein_g || meal.fat_g) && (
                          <div className="flex items-center gap-3 mt-1">
                            {meal.carbs_g != null && meal.carbs_g > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#4CAF50" }} />
                                {meal.carbs_g}g carb
                              </span>
                            )}
                            {meal.protein_g != null && meal.protein_g > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#FF9800" }} />
                                {meal.protein_g}g proteína
                              </span>
                            )}
                            {meal.fat_g != null && meal.fat_g > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#2196F3" }} />
                                {meal.fat_g}g gordura
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MealModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        defaultDate={dateStr}
        defaultMealType={defaultMealType}
        editMeal={editMeal}
      />

      <style>{`
        .has-meals-dot { position: relative; }
        .has-meals-dot::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}

/* ─── Helper components ─── */

function calculateSleepDuration(sleepTime: string, wakeTime: string): number {
  if (!sleepTime || !wakeTime) return 0;
  const [sh, sm] = sleepTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let sleepMins = sh * 60 + sm;
  let wakeMins = wh * 60 + wm;
  if (wakeMins <= sleepMins) wakeMins += 24 * 60;
  const diff = wakeMins - sleepMins;
  return +(diff / 60).toFixed(2);
}

function SleepTimeSelect({ hours, minutes, onChangeHours, onChangeMinutes }: {
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

function DayPanel({ record, date, habits, onUpdate, onDelete }: {
  record: DailyRecord | undefined;
  date: string;
  habits: ReturnType<typeof Array.prototype.filter>;
  onUpdate: (u: Partial<DailyRecord>) => void;
  onDelete: () => void;
}) {
  if (!date) return null;

  if (!record) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-3">
            Sem registro para {date ? format(parseISO(date), "dd/MM/yyyy") : ""}.
          </p>
          <Button onClick={() => onUpdate({})} className="rounded-xl">Criar registro</Button>
        </CardContent>
      </Card>
    );
  }

  const adh = calculateDailyAdherence(record, habits as any);
  const moodTag = getMoodTag(record.mood);

  const sleepTime = record.sleepTime || "";
  const wakeUp = record.wakeUpTime || "";
  const [sleepH, sleepM] = sleepTime ? sleepTime.split(":").map(Number) : [23, 0];
  const [wakeH, wakeM] = wakeUp ? wakeUp.split(":").map(Number) : [7, 0];
  const calculatedSleep = calculateSleepDuration(sleepTime, wakeUp);

  const updateSleepTime = (h: number, m: number) => {
    const newSleepTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const effectiveWake = wakeUp || "07:00";
    const dur = calculateSleepDuration(newSleepTime, effectiveWake);
    onUpdate({ sleepTime: newSleepTime, wakeUpTime: effectiveWake, sleepHours: dur });
  };

  const updateWakeTime = (h: number, m: number) => {
    const newWakeTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const effectiveSleep = sleepTime || "23:00";
    const dur = calculateSleepDuration(effectiveSleep, newWakeTime);
    onUpdate({ sleepTime: effectiveSleep, wakeUpTime: newWakeTime, sleepHours: dur });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {format(parseISO(date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onDelete} className="rounded-lg">
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={typeof record.mood === "string" ? record.mood : ""}
            onValueChange={(v) => onUpdate({ mood: v })}
          >
            <SelectTrigger className="w-auto h-7 text-xs gap-1 px-2 rounded-lg">
              <SelectValue placeholder="Humor">
                {moodTag && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: `hsl(${moodTag.bgHsl})` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${moodTag.hsl})` }} />
                    {moodTag.label}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MOOD_TAGS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
                    style={{ backgroundColor: `hsl(${m.bgHsl})` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${m.hsl})` }} />
                    {m.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(sleepTime || wakeUp) && calculatedSleep > 0 && (
            <Badge variant="outline" className="gap-1 rounded-full">
              <Moon size={12} /> {formatSleepHours(calculatedSleep)}
            </Badge>
          )}
          {record.exerciseMinutes > 0 && (
            <Badge variant="outline" className="gap-1 rounded-full">
              <Dumbbell size={12} /> {record.exerciseMinutes} min
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 rounded-full">
            <BarChart3 size={12} /> {adh}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sleep */}
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <Moon size={14} className="text-muted-foreground" /> Sono
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dormi às</p>
              <SleepTimeSelect
                hours={sleepH}
                minutes={sleepM}
                onChangeHours={(h) => updateSleepTime(h, sleepM)}
                onChangeMinutes={(m) => updateSleepTime(sleepH, m)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Acordei às</p>
              <SleepTimeSelect
                hours={wakeH}
                minutes={wakeM}
                onChangeHours={(h) => updateWakeTime(h, wakeM)}
                onChangeMinutes={(m) => updateWakeTime(wakeH, m)}
              />
            </div>
          </div>
          {(sleepTime || wakeUp) && (
            <p className="text-sm font-semibold text-primary mt-2">
              Dormiu {formatSleepHours(calculatedSleep)}
            </p>
          )}
        </div>

        <Separator />

        {/* Habits */}
        <div>
          <p className="text-sm font-medium mb-2">Hábitos</p>
          <div className="space-y-2">
            {(habits as any[]).map((h: any) => (
              <div key={h.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                {h.targetType === "check" ? (
                  <Checkbox
                    checked={record.habitChecks[h.id] === true}
                    onCheckedChange={(c) => onUpdate({ habitChecks: { ...record.habitChecks, [h.id]: !!c } })}
                  />
                ) : (
                  <Input
                    type="number"
                    className="w-20 h-8 text-sm rounded-lg"
                    value={typeof record.habitChecks[h.id] === "number" ? (record.habitChecks[h.id] as number) : ""}
                    onChange={(e) => onUpdate({ habitChecks: { ...record.habitChecks, [h.id]: Number(e.target.value) } })}
                  />
                )}
                <span className="text-sm">{h.name}</span>
              </div>
            ))}
          </div>
        </div>

        {(record.noteFeeling || record.noteProcrastination || record.noteGratitude) && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Diário</p>
            {record.noteFeeling && <p className="text-sm text-muted-foreground">{record.noteFeeling}</p>}
            {record.noteProcrastination && <p className="text-sm text-muted-foreground">{record.noteProcrastination}</p>}
            {record.noteGratitude && <p className="text-sm text-muted-foreground">{record.noteGratitude}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
