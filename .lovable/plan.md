

## Plan: Fix hours-based habit calculation in Metrics page

### Problem
The habit "horas de trabalho" is configured with `metricType: "tempo"` and `metricTimeUnit: "horas"`. The user entered 9 hours, which is stored as `9` in `habitChecks`. However, the Metrics page uses the legacy `targetType: "hours_minutes"` to format the value, which assumes the stored value is in **minutes** — so it does `Math.floor(9 / 60)h 9%60min` = `0h 9min`. Over multiple days, small hour values sum to something like 13, displayed as `0h 13min`.

### Root cause
`src/pages/Habits.tsx` line 311: `tempo` maps to legacy `targetType: "hours_minutes"`, which the Metrics page interprets as minutes. But when `metricTimeUnit === "horas"`, the stored value is already in hours.

### Solution

**File: `src/pages/MetricsPage.tsx`** — Update the aggregated value formatting (lines 319-338) to check the new `metricType` and `metricTimeUnit` fields instead of relying solely on legacy `targetType`:

1. If `metricType === "tempo"` and `metricTimeUnit === "horas"`: the aggregated value is in hours → format as `Xh Ymin` using `Math.floor(value)` for hours and `(value % 1) * 60` for remaining minutes
2. If `metricType === "tempo"` and `metricTimeUnit === "minutos"`: value is in minutes → format as `Xh Ymin` or `Xmin`
3. If `metricType === "tempo"` and `metricTimeUnit === "segundos"`: format as seconds
4. For other `metricType` values (`numero`, `calorias`, `litros`, `reais`, `dolar`, `euro`, `personalizado`): show `value + unit`
5. Fall back to legacy `targetType` switch only if `metricType` is not set

This also fixes the same issue in the `isHabitCompleted` check and the old `Metrics.tsx` component if it's still used.

### Not changed
- Dashboard habit cards (already use `metricType`/`metricTimeUnit` correctly)
- Habit creation/editing logic
- No backend or database changes

