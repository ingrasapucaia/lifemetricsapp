

## Plan: Add animations to Metrics page charts and elements

### Overview
Add smooth entrance animations to all charts and visual elements on the Metrics page so they animate in when scrolled into view or on mount.

### Changes

**File: `src/pages/MetricsPage.tsx`**

1. **Staggered fade-in on sections**: Wrap each chart `<Card>` and section in a container with CSS animation classes using inline `style={{ animationDelay }}` for staggered entrance. Use the existing `animate-fade-in` utility from the project's Tailwind config.

2. **Recharts animation props**: The Bar and Line charts already have `animationDuration={500}`. Increase to `800ms` and add `animationBegin={200}` for a slight delay that syncs with the card fade-in, making the bars/lines draw after the card appears.

3. **Progress bars (habit stats + consistency)**: Add a CSS transition on the `<Progress>` value width and on the consistency pixel squares with staggered delays per row using `animation-delay`.

4. **Summary stat cards at top**: Add fade-in with stagger (0ms, 100ms, 200ms, 300ms) to the metric summary cards.

### Implementation detail
- Use `animate-fade-in` class (already defined in tailwind config) on Cards with increasing `animationDelay` style
- Set `animation-fill-mode: both` so elements stay hidden until their delay triggers
- Bump Recharts `animationDuration` from 500 to 800 and add `animationBegin={300}`
- No new dependencies or backend changes

