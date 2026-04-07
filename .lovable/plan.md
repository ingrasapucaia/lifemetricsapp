

## Plan: Unify habit progress bar colors to app primary green

### Problem
The habit cards in the Metrics page use per-life-area colors for progress bars (line 306: `AREA_TEXT_COLORS`). The user wants all bars to use the app's standard green (`#D6F3A1` / `hsl(80, 82%, 80%)` — the primary color).

### Changes

**File: `src/pages/MetricsPage.tsx`**

1. **Habit stats progress bars** (line ~306-320): Replace the dynamic `barColor` with `hsl(var(--primary))` so all habit progress bars use the app green.

2. **Habits bar chart** (line ~189, ~359): Change `chartBarColor` to always use `hsl(var(--primary))` instead of area-specific colors.

3. **Consistency pixel tracker** (line ~538-556): Change `barColor` for completed day squares to use `hsl(var(--primary))`.

All three locations will use the same primary green color, matching the app's design system.

### Not changed
- Goal progress bars (already use `bg-primary`)
- Other pages, backend, database

