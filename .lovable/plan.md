

## Plan: Improve habit cards with aggregated metrics by type

### Problem
The habit cards in the Metrics page always show `rate%` and `X/Y dias concluídos` — even for numeric habits like "Horas de trabalho" (hours) or "Vendas do dia" (count). These should show the **sum total** of the metric (e.g. "12h 30min total" or "47 vendas") instead of just a completion percentage.

### Changes

**File: `src/pages/MetricsPage.tsx`**

1. **Enrich `habitStats` computation** (lines 157-164): For each habit, calculate an additional `aggregatedValue` field:
   - `check` type → keep current behavior (rate% + days)
   - `minutes` → sum all numeric values, display as `Xmin total`
   - `hours_minutes` → sum all numeric values, display as `Xh Ymin total`
   - `count` → sum all numeric values, display as `X total`
   - `km` / `miles` → sum all numeric values, display as `X.X km` or `X.X mi total`

2. **Update habit card rendering** (lines 306-327): 
   - For numeric habits: show the aggregated total as the main large value (instead of `rate%`), and show the completion rate as secondary text below
   - For check habits: keep current layout (rate% as main value)
   - Add the unit label next to the aggregated value

### Not changed
- Charts, summary cards, consistency tracker, goals, nutrition — untouched
- No backend or database changes

