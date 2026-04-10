
## Plan: Fix chart type mapping for all numeric habits

### Current Problem
The `getChartType` function in `DailyMetricsGrid.tsx` only maps `tempo`, `km`, and `milhas` to the "line" chart. Other numeric types like `calorias`, `litros`, `numero`, `reais`, `dolar`, `euro` are mapped to other chart types ("bar-percent", "dot", "progress").

### Change Required
**File: `src/components/dashboard/DailyMetricsGrid.tsx`**, lines 38-45:

Update the `getChartType` function to return "line" for all numeric metric types except:
- `check` → stays as "dot" (checkmark grid)
- `personalizado` → stays as "bar" (default behavior)

```typescript
// Before:
function getChartType(habit: Habit): ChartType {
  const mt = habit.metricType;
  if (mt === "tempo" || mt === "km" || mt === "milhas") return "line";
  if (mt === "calorias") return "bar-percent";
  if (mt === "litros" || mt === "numero" || mt === "check") return "dot";
  if (mt === "reais" || mt === "dolar" || mt === "euro") return "progress";
  return "bar";
}

// After:
function getChartType(habit: Habit): ChartType {
  const mt = habit.metricType;
  // Check type uses checkmark grid (dot chart)
  if (mt === "check") return "dot";
  // Personalizado keeps default behavior
  if (mt === "personalizado") return "bar";
  // All numeric metric types use line chart with gradient:
  // tempo, numero, km, milhas, calorias, litros, reais, dolar, euro
  return "line";
}
```

This ensures all numeric habits (km, milhas, minutos, horas, litros, calorias, número/contagem, reais, dólar, euro) display with the line chart with gradient, matching the existing behavior for corrida and horas de trabalho.
