import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  name: string;
  kcal: number | null;
  carbs_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  created_at: string;
  updated_at: string;
}

export type MealType = "cafe_da_manha" | "almoco" | "lanche" | "jantar" | "outro";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  outro: "Outro",
};

export const MEAL_TYPE_ORDER: MealType[] = ["cafe_da_manha", "almoco", "lanche", "jantar", "outro"];

export function useMeals() {
  const { session } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching meals:", error);
    } else {
      setMeals((data as Meal[]) || []);
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const addMeal = async (meal: Omit<Meal, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from("meals")
      .insert({ ...meal, user_id: session.user.id });
    if (error) {
      toast.error("Erro ao salvar refeição");
      console.error(error);
    } else {
      toast.success("Refeição salva");
      fetchMeals();
    }
  };

  const updateMeal = async (id: string, updates: Partial<Omit<Meal, "id" | "user_id">>) => {
    const { error } = await supabase.from("meals").update(updates).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar refeição");
      console.error(error);
    } else {
      toast.success("Refeição atualizada");
      fetchMeals();
    }
  };

  const deleteMeal = async (id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir refeição");
      console.error(error);
    } else {
      toast.success("Refeição excluída");
      fetchMeals();
    }
  };

  const getMealsForDate = useCallback(
    (date: string) => meals.filter((m) => m.date === date),
    [meals]
  );

  const getTotalKcalForDate = useCallback(
    (date: string) => {
      return getMealsForDate(date).reduce((sum, m) => sum + (m.kcal || 0), 0);
    },
    [getMealsForDate]
  );

  const getDatesWithMeals = useCallback(() => {
    return [...new Set(meals.map((m) => m.date))];
  }, [meals]);

  return { meals, loading, addMeal, updateMeal, deleteMeal, getMealsForDate, getTotalKcalForDate, getDatesWithMeals, fetchMeals };
}
