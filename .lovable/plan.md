## Plan: Fix Charts, Data Consistency, and Add Sleep+Mood Dashboard Card

### Changes

#### 1. Fix "7d" period to align to Monday (both files)

`**src/components/dashboard/DailyMetricsGrid.tsx**` — `getRecordSlice` and `getChartDates`:

- Use `startOfWeek(new Date(), { weekStartsOn: 1 })` as the start for "7d" instead of `subDays(today, 7)`.

`**src/pages/MetricsPage.tsx**` — `getDaysInPeriod` and `filteredRecords`:

- Same Monday-aligned logic for "7d".

#### 2. Fix "total" filter

`**src/components/dashboard/DailyMetricsGrid.tsx**` — `getChartDates`:

- For "total", generate dates from the earliest record to today (currently hardcoded to 7 points).

`**src/pages/MetricsPage.tsx**` — `getDaysInPeriod`:

- For "total", use all records' date range (currently caps at 30 days).

#### 3. Add animations to charts

**Dashboard mini-charts**: Add CSS keyframe animations (bars grow up, dots scale in) via inline styles with `animation` property on mount.

**MetricsPage Recharts**: Add `isAnimationActive={true} animationDuration={800}` to all `<Bar>` and `<Line>` components.

#### 4. Improve interactivity (hover tooltips on dashboard mini-charts)

Add `hoveredIndex` state to each mini-chart component. On hover/touch of a bar/dot/point, show a small tooltip with the value. Simple absolute-positioned div.

#### 5. Add Sleep + Mood combined card to Dashboard

`**src/components/dashboard/DailyMetricsGrid.tsx**`:

- Add a new special card after the Sleep metric card: "Sono & Humor"
- Uses the same period filter and chart dates as other metrics

#### 6. Remove duplicate "Dias consecutivos" summary card

`**src/pages/MetricsPage.tsx**` (line 290): Delete the duplicate `SummaryCard`.

#### 7. Keep MetricsPage Sleep & Mood chart as-is

The existing dual-line chart in MetricsPage stays unchanged — it's the detailed view.

### Files modified

- `src/components/dashboard/DailyMetricsGrid.tsx`
- `src/pages/MetricsPage.tsx`

### No backend changes needed