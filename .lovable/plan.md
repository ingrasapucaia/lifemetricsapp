

## Plan: Match meals card icon style + lighten green background

**Problem**: The Refeições card icon is a plain `UtensilsCrossed` without the circular colored background that other cards (Humor, Sono, Água) use. Also, the green background `#D1F0E0` is too dark.

**File: `src/components/dashboard/MealsCard.tsx`**

Two changes:

1. **Icon**: Wrap `UtensilsCrossed` in a circular container matching the other cards' pattern:
   ```
   <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
     <UtensilsCrossed size={14} className="text-emerald-600" />
   </div>
   ```

2. **Background color**: Change from `#D1F0E0` to a lighter pastel green like `#E3F8ED`.

