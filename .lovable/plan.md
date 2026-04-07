## Plan: Redesign habits section as a single minimalist shareable card

### Concept

Replace the current 2-column grid of individual habit cards with a single unified card containing a clean checklist layout. The design should be "screenshot-worthy" — something users would want to share on social media showing their daily progress.

### Design

A single `Card` with:

- **Header**: Date (e.g. "07 de abril") + progress ring showing X/Y completed + percentage
- **Habit list**: Vertical list of rows, each row showing:
  - Emoji icon (if any) + habit name on the left
  - For check habits: a circular checkbox (tap to toggle) with animated check mark
  - For numeric habits: compact value/target display (e.g. "3/5 km") with inline +/- or input
- **Completed habits**: Get a subtle strikethrough or green tint + check icon, sorted to bottom
- **Footer**: App branding subtle watermark for screenshots (optional, tiny)
- Expand/collapse if more than 6 habits

### Visual style

- Clean white card, subtle border, generous padding
- Completed rows get a soft green-tinted background with the primary color check
- Overall progress circle at top-right of the header
- Minimalist typography — no uppercase headers, just clean sans-serif

### Changes

**File: `src/components/dashboard/HabitCardGrid.tsx**` — Full rewrite:

1. Replace grid of individual cards with a single `Card` component
2. Header row: formatted date + circular progress indicator (done/total)
3. Habit rows as a vertical list with dividers
4. Check habits: circular toggle button on the right side
5. Numeric habits: value/target text + compact +/- buttons or input on the right
6. Completed items get subtle green bg highlight + check icon
7. "Ver todos" expand button remains at bottom if habits > initialCount

### Not changed

- Backend, database, other pages, Dashboard layout structure
- `getHabitUnit`, `isHabitCompleted` logic stays the same
- Props interface stays the same (habits, checks, onUpdate, initialCount)