

## Plan: Add period filters and reorder button to dashboard metrics

### Changes

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **Add period filter pills** next to the "Métricas de vida" title:
   - Three options: "7 dias", "30 dias", "Total"
   - Styled as pill buttons matching the uploaded reference (rounded bg-muted container, active state with white bg + shadow)
   - New prop `period` and `setPeriod` passed from Dashboard, or managed internally with `useState`
   - Filter the `records` used for chart data based on selected period (reuse `getRecordsForPeriod` from `src/lib/metrics.ts`)

2. **Add a discrete reorder button** (small icon button, e.g. `ArrowUpDown` or `GripVertical` from Lucide):
   - Placed near the title row, right side
   - Clicking toggles a reorder mode where each metric card shows drag handles (up/down arrows)
   - User can move cards up/down with arrow buttons (no drag library needed)
   - Order stored in component state; optionally persisted via localStorage

**File: `src/pages/Dashboard.tsx`**
- No changes needed if state is managed inside `DailyMetricsGrid`

### Technical notes
- Period filtering reuses existing `getRecordsForPeriod` from `src/lib/metrics.ts`
- Reorder uses simple array index swapping with useState + localStorage persistence
- No backend changes, no new dependencies

