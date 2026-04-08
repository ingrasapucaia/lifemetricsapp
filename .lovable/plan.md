

## Plan: Reverse habit sort order (completed on top)

### Change

**File: `src/components/dashboard/HabitCardGrid.tsx`**, line 280:

Change `return aDone ? 1 : -1` to `return aDone ? -1 : 1`

This single change makes completed habits sort to the top and incomplete ones to the bottom, in both the Dashboard card and the RegisterSheet (since both use `HabitCardGrid`).

