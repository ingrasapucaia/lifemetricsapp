

## Plan: Fix habits and calories charts to show all week days

### Problems
1. **"Hábitos concluídos por dia" chart** only shows days with records (e.g. 2 bars for 2 days) instead of all 7 days of the week
2. **"Calorias por dia" chart** has the same issue — only days with data appear
3. Both charts should use the app's green color (`hsl(var(--primary))`) consistently

### Root cause
The `getDaysInPeriod` function (line 578) for the "7d" period starts from Monday of the current week (`startOfWeek`), so early in the week only 1-2 days appear. It should always show 7 days (today minus 6 days).

### Changes

**File: `src/pages/MetricsPage.tsx`**

1. **Fix `getDaysInPeriod`** (line 590-592): For "7d", change from `startOfWeek(today)` to `subDays(today, 6)` so it always returns 7 days regardless of which day of the week it is. For "30d", use `subDays(today, 29)`.

2. **Habits chart X-axis** (line 342-345): Show weekday abbreviation (e.g. "seg", "ter") instead of "dd/MM" format for better readability on the 7-day view. Update `habitChartData` to include a `label` field with the weekday abbreviation for XAxis.

3. **Calories chart** (line 473-491): Change fill color from `"hsl(145, 50%, 45%)"` to `chartBarColor` (`hsl(var(--primary))`) to match the green color.

4. **Both charts**: Use the same tooltip style with rounded corners, shadow, and capitalize weekday — already in place, no changes needed there.

### Not changed
- Dashboard charts, other sections, summary cards, consistency tracker, sleep/mood chart, macros chart
- No backend or database changes

