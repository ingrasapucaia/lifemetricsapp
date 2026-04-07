

## Plan: Fix charts, data sync, periods, animations, and tooltips

### 1. Fix data sync — Dashboard showing "—" instead of real values

**File: `src/components/dashboard/DailyMetricsGrid.tsx`** (line 437)

The dashboard shows "—" for check-type habits when not completed. Change to show "✗" or "0" instead of "—" for consistency. For numeric habits, the value already shows correctly. The core issue is line 437: `displayValue = numericToday ? "✓" : "—"` — replace "—" with "✗" to be clear it's a real value (not missing data).

Also, the dashboard and MetricsPage already use the same data source (`useStore`), so the data itself is identical. The "—" display issue is purely a formatting problem in the dashboard cards.

### 2. Fix period logic — Monday-based weeks

**File: `src/lib/metrics.ts`**
- Add a shared helper `getMonday(date)` using `startOfWeek(date, { weekStartsOn: 1 })` 
- `7d` period: from Monday of current week to Sunday (or today if mid-week)
- `30d` period: from the Monday 4 weeks ago to end of current week
- `total`: return all records (no filtering)

**File: `src/pages/MetricsPage.tsx`**
- Update `filteredRecords` (lines 44-58): use Monday-based logic for 7d/30d
- Update `getDaysInPeriod` (lines 537-547): use Monday-based intervals, and fix "total" to use `eachDayOfInterval` from first record to today (currently it falls back to 30 days)

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**
- Update `getRecordSlice` (lines 338-343): same Monday-based logic
- Update `getChartDates` (lines 345-350): generate dates from Monday of current week

### 3. Add animations to Recharts charts (MetricsPage)

**File: `src/pages/MetricsPage.tsx`**
- Add `animationDuration={500}` and `animationEasing="ease-out"` to all `<Bar>` and `<Line>` components (Recharts supports this natively)
- Bars will grow from bottom; lines will draw left-to-right automatically with these props

### 4. Add animations to mini SVG charts (DailyMetricsGrid)

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**
- `MiniBarChart`: add CSS animation — bars start at height 0 and grow to target height using `@keyframes grow-bar` (400ms ease-out), with staggered delay per bar
- `MiniLineChart`: add `stroke-dasharray` / `stroke-dashoffset` animation to draw the path (500ms)
- `MiniDotChart`: add scale-in animation to each dot with staggered delays
- `MiniBarPercentChart`: same grow animation as MiniBarChart

**File: `src/index.css`**
- Add `@keyframes grow-bar` and `@keyframes draw-line` keyframes

### 5. Improve tooltips on MetricsPage charts

**File: `src/pages/MetricsPage.tsx`**
- Replace inline `contentStyle` Tooltip with a custom `content` renderer for all charts
- Tooltip format: white background, rounded-xl, shadow-lg, shows weekday + date + value + unit
- Example: "Ter, 01/04 — 4,5 km"
- Add `cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}` to BarCharts for hover highlight
- Add `activeDot={{ r: 6, strokeWidth: 2 }}` to LineCharts for point highlight on hover

### Files changed
- `src/lib/metrics.ts` — add Monday-based period helper
- `src/components/dashboard/DailyMetricsGrid.tsx` — fix "—" display, fix periods, add SVG animations
- `src/pages/MetricsPage.tsx` — fix periods, fix "total", add Recharts animations, improve tooltips
- `src/index.css` — add keyframe animations for mini charts

### No changes to
- Backend/database
- Any other pages or components
- Card layouts or structure

