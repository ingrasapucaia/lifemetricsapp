import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UtensilsCrossed } from "lucide-react";
import { useMeals } from "@/hooks/useMeals";
import MealModal from "@/components/meals/MealModal";

interface Props {
  selectedDate: string;
}

export default function MealsCard({ selectedDate }: Props) {
  const navigate = useNavigate();
  const { getTotalKcalForDate, addMeal } = useMeals();
  const [modalOpen, setModalOpen] = useState(false);

  const totalKcal = useMemo(() => getTotalKcalForDate(selectedDate), [getTotalKcalForDate, selectedDate]);

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
        <CardContent className="pt-0 px-4 pb-3">
          <p className="text-sm text-muted-foreground">
            {totalKcal > 0
              ? `${totalKcal} kcal registradas hoje`
              : "Nenhuma refeição registrada"}
          </p>
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
