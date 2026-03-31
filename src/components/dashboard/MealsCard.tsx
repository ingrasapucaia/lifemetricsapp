import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, UtensilsCrossed } from "lucide-react";
import { useMeals } from "@/hooks/useMeals";
import { useAuth } from "@/hooks/useAuth";
import MealModal from "@/components/meals/MealModal";

interface Props {
  selectedDate: string;
}

export default function MealsCard({ selectedDate }: Props) {
  const navigate = useNavigate();
  const { getTotalKcalForDate, addMeal } = useMeals();
  const { profile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const totalKcal = useMemo(() => getTotalKcalForDate(selectedDate), [getTotalKcalForDate, selectedDate]);
  const dailyGoal = profile?.daily_kcal_goal ?? 0;
  const pct = dailyGoal > 0 ? Math.min(Math.round((totalKcal / dailyGoal) * 100), 100) : 0;

  return (
    <>
      <Card
        className="border-0 cursor-pointer hover:shadow-md transition-shadow duration-200"
        style={{ backgroundColor: "#E3F8ED" }}
        onClick={() => navigate("/refeicoes")}
      >
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <UtensilsCrossed size={14} className="text-emerald-600" />
              </div>
              Refeições
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1 hover:bg-black/5"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
            >
              <Plus size={12} />
              Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            {totalKcal > 0
              ? dailyGoal > 0
                ? `${totalKcal} / ${dailyGoal} kcal`
                : `${totalKcal} kcal registradas hoje`
              : "Nenhuma refeição registrada"}
          </p>
          {dailyGoal > 0 && (
            <div className="space-y-1">
              <Progress value={pct} className="h-1.5 bg-emerald-200/50" />
              <p className="text-[10px] text-muted-foreground text-right">{pct}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      <MealModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={(meal) => addMeal(meal)}
        defaultDate={selectedDate}
      />
    </>
  );
}
