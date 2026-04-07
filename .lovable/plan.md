

## Plan: Fix dashboard metrics — periods, chart data, and value display

### Root Causes

1. **Only 2 days shown**: `getChartDates` and `getRecordSlice` use Monday-based week start. If today is Tuesday, only Mon+Tue appear. Must change to rolling 7/30 days.
2. **Period logic**: Same Monday-based issue. "7d" should be last 7 rolling days, "30d" last 30 rolling days, "total" all records.
3. **Card values show today only**: Cards display today's single value (e.g. "✓", "5 km") instead of period aggregates (totals, averages, completion rates).

### Changes

**File: `src/lib/metrics.ts`** — Fix `getPeriodCutoff` to use rolling days:
- `7d`: `subDays(today, 6)` (7 rolling days including today)
- `30d`: `subDays(today, 29)` (30 rolling days including today)

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **Fix `getRecordSlice`** (line 368-373): Use `subDays(today, 6)` for 7d, `subDays(today, 29)` for 30d — rolling days, not Monday-based.

2. **Fix `getChartDates`** (line 375-390): Same rolling logic. Generate dates from `subDays(today, N)` to today.

3. **Fix metric value computation** (lines 438-508): Instead of showing today's single value, compute period aggregates:
   - **Sleep**: Show average sleep across period (e.g. "8h 24min")
   - **Check habits**: Show completion count + percentage (e.g. "13/17 dias · 76%")
   - **Numeric habits (km, min, hours, R$)**: Show total accumulated (e.g. "30.8 km", "27h 30min")
   - **Trend**: Compare current period average vs previous equivalent period

### Files changed
- `src/lib/metrics.ts` — rolling period cutoffs
- `src/components/dashboard/DailyMetricsGrid.tsx` — rolling dates, period aggregates

### Not changed
- Backend, database, other pages, card layout/structure, chart types

