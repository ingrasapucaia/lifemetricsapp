

## Plan: Add interactive tooltips to dashboard mini-charts

### Problem
The dashboard mini-charts (MiniBarChart, MiniLineChart, MiniDotChart, MiniBarPercentChart) are pure SVG/CSS with no interactivity. Hovering or tapping shows nothing.

### Solution
Add a stateful tooltip to each mini-chart that appears on hover (desktop) and tap (mobile), showing the date, value, and unit.

### Changes

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **Pass date + unit data to chart components**: Change all mini-chart props from `data: number[]` to `data: { value: number; date: string; unit: string }[]`. Update the call sites in `MetricCard` (lines 358-372) and the data construction in `metrics` useMemo (lines 496-500, 465) to pass `{ value, date: chartDates[i], unit }`.

2. **Add shared `MiniChartTooltip` component**: A small absolutely-positioned div that shows on hover/tap:
   - Format: "Ter, 01/04 — 4,5 km" (weekday + dd/MM + value + unit)
   - White background, rounded-lg, shadow-md, text-xs
   - Positioned above the hovered element
   - Dismissed on mouse leave or tap outside

3. **MiniBarChart**: Wrap each bar in a hoverable container. On `onMouseEnter`/`onTouchStart`, set active index → show tooltip above that bar.

4. **MiniLineChart**: Add invisible hit-area circles (r=8, fill transparent) over each data point. On hover/touch, show tooltip near that point.

5. **MiniDotChart**: Each dot already has a div — add hover/touch handlers to show tooltip.

6. **MiniBarPercentChart**: Same approach as MiniBarChart.

7. **MiniProgressBar**: No per-day data, skip.

8. **Highlight active element**: Active bar gets full opacity color (not 35%); active dot gets slightly larger; active line point gets larger radius.

### Date formatting
Use `format(parseISO(date), "EEE, dd/MM", { locale: ptBR })` for "ter., 01/04" format. Already have `ptBR` imported in MetricsPage but will need to add import in DailyMetricsGrid.

### Files changed
- `src/components/dashboard/DailyMetricsGrid.tsx` — add tooltip state, handlers, and tooltip component to all mini-charts

### Not changed
- Backend, database, MetricsPage, other pages, card layout

