

## Plan: Redesign metric cards with chart types based on habit metric type

### What changes

**File: `src/components/dashboard/DailyMetricsGrid.tsx`** — Full redesign

1. **Add a `chartType` field to `MetricItem`** mapped from the habit's `metricType`:
   - `"tempo"`, `"km"`, `"milhas"` → **Line chart** (continuous progress like the Exercise/BPM cards in the reference)
   - `"calorias"` → **Bar chart with percentage labels** on each bar (like the Calories card in the reference showing 44%, 34%, etc.)
   - `"litros"`, `"numero"`, `"check"` → **Dot/bubble chart** (like the Water card in the reference with droplet-style dots)
   - `"reais"`, `"dolar"`, `"euro"` → **Horizontal progress bar** (simple fill bar)
   - Sleep card → **Bar chart** (keep current style, matches reference)

2. **New card layout inspired by the reference image**:
   - Each card takes **full width** (single column, stacked vertically — not 2x2 grid)
   - Card structure:
     - Top-left: icon + metric name + "Últimos 7 dias" label
     - Top-right: "Hoje — X unit" with the current value prominently displayed
     - Below: the chart visualization spanning full card width
     - Optional target line on bar/line charts when a `dailyGoal` or `targetValue` exists
   - White background, rounded corners (16px), soft shadow
   - Each metric keeps its unique accent color for the chart

3. **New chart components** (all inline SVG, no external library):
   - `MiniLineChart` — smooth polyline with filled area underneath, dots at data points
   - `MiniBarChartWithLabels` — vertical bars with percentage labels above each bar (value/target as %)
   - `MiniDotChart` — row of circles (filled = has value, empty = no value), sized by value
   - `MiniProgressBar` — horizontal bar showing today's value vs target

4. **Chart color per metric** — uses `getHabitColor()` which already assigns unique colors per habit or uses the habit's custom color.

### What stays the same
- All data logic (records, habits, trend calculation)
- Sleep card (stays first, bar chart)
- No backend changes
- No changes to other pages
- Habit cards section unchanged
- Weekly streak card unchanged

### Technical notes
- The `metricType` field on `Habit` determines chart type; fallback to bar chart if undefined
- Charts are pure SVG — no dependencies added
- Responsive: cards stack full-width on mobile (390px viewport)

