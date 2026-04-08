

## Plan: Add text input for all numeric habit controls

### Problem
Numeric habits with a daily goal of 10 or less only show `-/+` buttons — no way to type a value directly. If someone needs to enter a large number (e.g., 500), tapping `+` repeatedly is impractical.

### Root cause
In `src/components/dashboard/HabitCardGrid.tsx`, line 157: `const useLargeInput = target > 10`. Habits with targets ≤ 10 get only the `-/+` buttons without a text input.

### Solution
**File: `src/components/dashboard/HabitCardGrid.tsx`** — Redesign `NumericControls` to always show a tappable value that opens an inline text input on click, combined with `-/+` buttons for quick adjustments.

- Replace the two-branch render (large input vs small buttons) with a single layout: `[ - ] [value/target unit] [ + ]`
- Make the center value area tappable — clicking it turns the value into an editable `<input>` field
- On blur or Enter, the input reverts to display mode
- Keep the `-/+` buttons for quick ±1 adjustments
- This works for all numeric habits regardless of target size

### Not changed
- Check-type habits (toggle behavior unchanged)
- No database, backend, or other page changes

