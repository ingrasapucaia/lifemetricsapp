import { useState, useMemo, useEffect } from "react";
import { useMeals, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, MealType, Meal } from "@/hooks/useMeals";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MealModal from "@/components/meals/MealModal";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, MoreVertical, Pencil, Trash2, UtensilsCrossed, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Meals() {
  const { meals, addMeal, updateMeal, deleteMeal, getMealsForDate, getDatesWithMeals } = useMeals();
  const { user, profile, refreshProfile } = useAuth();
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

  // Group by meal_type
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refeições</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhe sua alimentação</p>
        </div>
        <Button onClick={openAdd} className="rounded-xl gap-1.5">
          <Plus size={16} />
          Adicionar
        </Button>
      </div>

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
      <div className="space-y-4">
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
                    {/* Group header */}
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

                    {/* Items */}
                    {items.map((meal) => (
                      <div key={meal.id} className="flex items-start gap-3 py-2 border-t border-border/40">
                        {/* Color bar */}
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
                          {/* Macros */}
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
      </div>

      <MealModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        defaultDate={dateStr}
        defaultMealType={defaultMealType}
        editMeal={editMeal}
      />

      {/* CSS for calendar dots */}
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
