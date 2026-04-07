

## Plan: Fix 30-day charts overflowing the card

### Root Cause

All mini chart components (`MiniBarChart`, `MiniDotChart`, `MiniBarPercentChart`, `MiniLineChart`) render one element per day with fixed gaps. At 30 days, this exceeds the card width. Also, the day labels (S, T, Q...) render for every data point, becoming unreadable at 30 days.

### Changes

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **`MiniBarChart`**: Replace `gap-[6px]` with `gap-[2px]` dynamically based on data length. For 30+ items, use `gap-px`. Already uses `flex-1` so bars will shrink — just reduce the gap.

2. **`MiniDotChart`**: Same approach — dots already use `flex-1`, just need smaller dots for larger datasets (cap max radius when data.length > 10).

3. **`MiniBarPercentChart`**: Same gap reduction. Hide per-bar percentage labels when data.length > 10 (they overlap).

4. **`MiniLineChart`**: Already uses SVG viewBox so it scales correctly — no change needed.

5. **Day labels**: For all chart components, when `data.length > 7`, show labels only at intervals (e.g. every 5th day) or show date format (dd/MM) instead of weekday letters. For 30 days, show ~6 evenly spaced labels.

6. **`MiniProgressBar`**: Not affected (single bar, no per-day rendering).

### Files changed
- `src/components/dashboard/DailyMetricsGrid.tsx` — responsive chart sizing for 30-day period

### Not changed
- Backend, database, other pages, MetricsPage, period logic, data aggregation

