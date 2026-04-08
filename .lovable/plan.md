

## Plan: Redesign time picker as a clean white card

### Problem
The current scroll-based time picker with `bg-muted/40` columns and green highlighted items feels out of place. The user wants a simple, clean white card with rounded corners matching the app's aesthetic.

### Solution

**File: `src/components/agenda/TimePicker.tsx`** — Replace the current scroll columns with a simpler design:

- Wrap the entire picker in a white `Card`-style container (`bg-white rounded-2xl border border-border/60 shadow-sm p-4`)
- Two side-by-side columns still scrollable, but with a cleaner white background
- Selected item: subtle rounded pill with `bg-muted` and bold dark text instead of the green `bg-primary`
- Unselected items: light gray text, clean and minimal
- Keep the colon separator centered between columns
- "Limpar horário" button stays below as a subtle ghost link
- Overall height stays compact (~144px visible area per column)

### Visual style
- Card: `bg-white rounded-2xl border border-border/60 p-3`
- Selected item: `bg-muted rounded-xl font-semibold text-foreground`
- Unselected: `text-muted-foreground/60`
- Separator: muted colon

### Not changed
- Functionality (hour/minute selection, clear button) stays identical
- No changes to Agenda.tsx or other files

