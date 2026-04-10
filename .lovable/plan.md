

## Plan: Change check-type habit charts from dots to line with gradient

### Problem
Habits of type "check" (meditação, treino, leitura, etc.) use `MiniDotChart` which displays bubbles. They should use a line chart with gradient fill, like numeric habits (corrida, horas de trabalho).

### Change

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **Line 42** — In the `getChartType` function, change `"check"` from mapping to `"dot"` to mapping to `"line"`:

```typescript
if (mt === "litros" || mt === "numero") return "dot";
```
Remove `"check"` from the dot line. Then ensure check habits fall through to the default `"bar"` — or better, add explicit handling:

Actually, looking more carefully: the `getChartType` only applies to habits with a `metricType`. For check habits, `metricType` is likely `"check"` or undefined. The data for check habits is binary (0 or 1), so the `MiniLineChart` will work perfectly — it will show value 1 for completed days and 0 for not completed.

**Single change needed:**
- Line 42: Remove `"check"` from the dot chart mapping so it doesn't match, and add a new line mapping `"check"` to `"line"`:

```typescript
if (mt === "litros" || mt === "numero") return "dot";
if (mt === "check") return "line";
```

This will route check-type habits to `MiniLineChart`, which already renders a smooth line with gradient fill below it — exactly matching the style of numeric habits like running and work hours.

### What stays unchanged
- Sleep chart — untouched
- Card data/information — untouched  
- Backend — untouched
- `MiniLineChart` component — already handles the rendering correctly with gradient

