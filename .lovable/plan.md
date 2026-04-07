

## Plan: Move Refeições into Meus Registros and RegisterSheet

### Changes

**File: `src/components/AppSidebar.tsx`**
- Remove the `{ to: "/refeicoes", label: "Refeições", icon: UtensilsCrossed }` entry from `mainLinks` array
- Remove the `UtensilsCrossed` import if unused elsewhere

**File: `src/pages/Records.tsx`**
- Import `useMeals`, `MealModal`, `MEAL_TYPE_LABELS`, `MEAL_TYPE_ORDER`, `MealType`, `Meal`, plus `UtensilsCrossed` icon
- Import `useAuth` for accessing `profile` and kcal goal
- Add a third tab "Refeições" to the existing `Tabs` component (alongside Calendário and Lista)
- The Refeições tab content reuses the same layout from `Meals.tsx`:
  - Kcal goal card (with save to profiles)
  - Calendar with meal-date dots
  - Day panel with meals grouped by type, add/edit/delete actions
  - `MealModal` for adding/editing
- In the `DayPanel` component (calendar tab), add a "Refeições" section after Habits showing meals for that date with total kcal and a quick "Adicionar refeição" button

**File: `src/components/dashboard/RegisterSheet.tsx`**
- Import `useMeals`, `MealModal`, `MEAL_TYPE_LABELS`, `MEAL_TYPE_ORDER`, `MealType`, `Meal`, `UtensilsCrossed`, `Plus`, `Pencil`, `Trash2`, `MoreVertical`
- Import `DropdownMenu` components for meal item actions
- Add a new section after `HabitCardGrid` (after line 189):
  - Section header: UtensilsCrossed icon + "Refeições" + total kcal for the day
  - List of meals for the selected `date`, grouped by type (reusing same card layout from Meals.tsx)
  - Each meal shows name, kcal, macros, with edit/delete dropdown
  - "Adicionar refeição" button that opens `MealModal`
  - `MealModal` rendered inside the drawer, with `defaultDate={date}`

### What stays the same
- Database and backend unchanged
- `useMeals` hook unchanged
- `MealModal` component unchanged
- `MealsCard.tsx` dashboard card unchanged
- `/refeicoes` route still exists (just hidden from nav)
- All other pages untouched

### Technical notes
- `useMeals` is called inside both Records page and RegisterSheet; each manages its own meal state independently via the hook
- The RegisterSheet needs to call `fetchMeals` after add/update/delete to refresh the list within the drawer
- Kcal goal editing uses direct supabase update to `profiles.daily_kcal_goal` (same pattern as Meals.tsx)

