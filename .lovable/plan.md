

## Plan: Replace check-habit charts with minimalist weekly checkmark grid

### What changes

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **Add new chart type** `"check-grid"` to the `ChartType` union (line 18)

2. **Update `getChartType`** (line 43): change `if (mt === "check") return "line"` to `return "check-grid"`

3. **Create new `MiniCheckGrid` component** — a simple row of 7 day slots:
   - Each slot shows the day label (S D S T Q Q S) below
   - Completed day: a small **✓** in the habit's color
   - Incomplete day: a thin dash `—` in muted color (or empty)
   - No circles, no lines, no gradients — pure text-based minimalism
   - Adapts to 7d/30d/total periods by showing the last N days with sparse labels for longer periods

4. **Add `"check-grid"` rendering branch** in the `MetricCard` component (around line 465) alongside the existing chart type switch

### What stays unchanged
- Sleep chart (bar type) — untouched
- Numeric habits (line with gradient) — untouched
- All card data, values, labels — untouched
- Backend and database — untouched

