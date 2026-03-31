

## Plan: Match task card shadow to app's card style

**What changes**: Update the task card styling in `src/components/dashboard/Agenda.tsx` to use the same `shadow-card` shadow and `border-border/60` border used by other cards in the app, instead of the current flat `0.5px solid #E5E5EA` border.

**File: `src/components/dashboard/Agenda.tsx` (line 123-124)**

Replace the current inline border style with Tailwind classes matching the app's Card component:
- Add `shadow-card` class (the app's standard soft shadow)
- Change border from inline `0.5px solid #E5E5EA` to `border border-border/60`
- Keep `rounded-xl`, `bg-white`, padding, and all other existing styles

This is a single-line CSS change — no logic or layout modifications.

