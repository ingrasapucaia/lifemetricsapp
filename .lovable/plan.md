

## Plan: Fix stretched charts on desktop and add responsive grid layout

### Problem
On desktop, the metric cards stretch full-width across a wide viewport (~1000px content area), making charts look distorted and wasting space. The app is mobile-first but should look organized on desktop.

### Changes

**File: `src/components/dashboard/DailyMetricsGrid.tsx`**

1. **Responsive grid for metric cards** (line 544):
   - Mobile: keep single column (`flex-col`)
   - Desktop (md+): switch to a 2-column grid so cards fill the space side by side
   - Replace `<div className="flex flex-col gap-3">` with `<div className="grid grid-cols-1 md:grid-cols-2 gap-3">`

2. **Fix SVG line chart stretching** (MiniLineChart, line 129):
   - Remove `preserveAspectRatio="none"` which causes distortion
   - Change to `preserveAspectRatio="xMidYMid meet"` so the chart scales proportionally
   - Use a proper viewBox and let the SVG scale naturally with `height: auto` instead of a fixed pixel height

3. **Constrain chart heights on desktop**:
   - Bar charts and dot charts: keep current flex-based approach (already responsive)
   - Line chart SVG: set `className="w-full h-auto"` with a `max-height` via style to prevent excessive vertical stretching

### What stays the same
- Mobile layout unchanged (single column, same card sizes)
- All data logic, period filters, reorder functionality
- No backend changes
- No other pages affected

