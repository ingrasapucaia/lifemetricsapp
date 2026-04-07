

## Plan: Fix tooltip clipping in dashboard mini-charts

### Problem
The `MiniChartTooltip` is positioned absolutely inside chart containers that have `overflow-hidden` (needed to prevent 30-day charts from overflowing). The tooltip renders above the bar/dot with `bottom: 100%`, but gets clipped by the parent's overflow.

### Solution
Remove `overflow-hidden` from the chart wrapper divs and instead move it only to the inner bar/dot containers where needed. Additionally, add `overflow-visible` to the outer card area so tooltips can escape the card boundary.

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **Chart wrappers**: Change `overflow-hidden` to `overflow-visible` on the outermost chart `div` in `MiniBarChart`, `MiniDotChart`, `MiniBarPercentChart`. The bars themselves already have `flex-1 min-w-0` which prevents horizontal overflow — `overflow-hidden` on the parent is redundant for layout but kills tooltips.

2. **MetricCard**: Add `overflow-visible` to the `CardContent` or the chart section so tooltips positioned above the chart aren't clipped by the card's rounded corners / overflow.

3. **MiniLineChart tooltip**: Same fix — ensure the SVG wrapper allows tooltip overflow.

### Files changed
- `src/components/dashboard/DailyMetricsGrid.tsx` — remove `overflow-hidden` from chart containers, ensure tooltip can render above the card boundary

### Not changed
- Backend, database, other pages, layout structure, tooltip content/format

