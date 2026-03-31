import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MealType, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, Meal } from "@/hooks/useMeals";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: { date: string; meal_type: string; name: string; kcal: number | null; carbs_g: number | null; protein_g: number | null; fat_g: number | null }) => void;
  defaultDate?: string;
  defaultMealType?: MealType;
  editMeal?: Meal | null;
}

export default function MealModal({ open, onOpenChange, onSave, defaultDate, defaultMealType, editMeal }: Props) {
  const [mealType, setMealType] = useState<MealType>(defaultMealType || "almoco");
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [date, setDate] = useState<Date>(defaultDate ? parseISO(defaultDate) : new Date());

  useEffect(() => {
    if (open) {
      if (editMeal) {
        setMealType(editMeal.meal_type as MealType);
        setName(editMeal.name);
        setKcal(editMeal.kcal?.toString() || "");
        setCarbs(editMeal.carbs_g?.toString() || "");
        setProtein(editMeal.protein_g?.toString() || "");
        setFat(editMeal.fat_g?.toString() || "");
        setDate(parseISO(editMeal.date));
      } else {
        setMealType(defaultMealType || "almoco");
        setName("");
        setKcal("");
        setCarbs("");
        setProtein("");
        setFat("");
        setDate(defaultDate ? parseISO(defaultDate) : new Date());
      }
    }
  }, [open, editMeal, defaultDate, defaultMealType]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      date: format(date, "yyyy-MM-dd"),
      meal_type: mealType,
      name: name.trim(),
      kcal: kcal ? Number(kcal) : null,
      carbs_g: carbs ? Number(carbs) : null,
      protein_g: protein ? Number(protein) : null,
      fat_g: fat ? Number(fat) : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editMeal ? "Editar refeição" : "Adicionar refeição"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Meal type chips */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipo de refeição</Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMealType(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200",
                    mealType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border/60 hover:bg-muted/50"
                  )}
                >
                  {MEAL_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label className="text-sm font-medium">Nome do item</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Arroz com frango, Maçã..."
              className="rounded-xl mt-1"
            />
          </div>

          {/* Kcal */}
          <div>
            <Label className="text-sm font-medium">Calorias (kcal)</Label>
            <Input
              type="number"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              placeholder="Opcional"
              className="rounded-xl mt-1"
              min={0}
            />
          </div>

          {/* Macros */}
          <div>
            <Label className="text-sm font-medium mb-1 block">Macronutrientes (opcionais)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Carb (g)</Label>
                <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="rounded-xl mt-0.5" min={0} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Proteína (g)</Label>
                <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="rounded-xl mt-0.5" min={0} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Gordura (g)</Label>
                <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} className="rounded-xl mt-0.5" min={0} />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <Label className="text-sm font-medium">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl mt-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleSave} disabled={!name.trim()} className="w-full rounded-xl">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
