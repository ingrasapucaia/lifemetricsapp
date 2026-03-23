

# Plan: Fix Two Critical Bugs

## Problem Analysis

### Bug 1 — Seed data loaded for new users
The `useStore` hook (line 69-71) uses seed data as fallback when localStorage is empty:
```typescript
useState<Habit[]>(() => load(KEYS.habits, seedHabits));
useState<DailyRecord[]>(() => migrateRecords(load(KEYS.records, generateSeedRecords())));
useState<UserProfile>(() => load(KEYS.profile, seedProfile));
```
Every new user gets 6 fake habits and 50 fake daily records. The onboarding then ADDS more habits on top of the seed data.

### Bug 2 — Emoji icons showing as text names
The seed habits use Lucide icon names (`"Droplets"`, `"Dumbbell"`, `"Book"`) in the `icon` field. The new UI expects emoji characters. When the app renders `h.icon`, it checks for non-ASCII characters — Lucide names fail that check, so they render as raw text (as seen in the screenshot: "Heart", "Brain", "Pencil", etc.). This is NOT a day-change bug per se — it's that the old seed/localStorage habits have Lucide icon names instead of emojis. The "day change" likely triggers a re-render or localStorage re-read that exposes the issue.

## Solution

### File 1: `src/hooks/useStore.tsx`

**Change the fallback values from seed data to empty arrays/defaults:**

- Line 69: `seedHabits` → `[]`
- Line 70: `generateSeedRecords()` → `[]`
- Line 71: `seedProfile` → default empty profile object

**Keep `resetToSeed` function** for the "Reset demo data" feature in Profile, but it won't auto-trigger.

**Remove the seed import** if no longer needed at init (keep for `resetToSeed`).

### File 2: `src/components/dashboard/CheckIn.tsx`

**Fix the icon rendering** in `HabitCard` (line 393): Instead of only checking for non-ASCII (emoji), also handle the case where `h.icon` is a Lucide icon name — fall back to "✅" for those. The current check `h.icon && /[^\x00-\x7F]/.test(h.icon)` already handles this correctly (Lucide names are ASCII, so they fall through to "✅"). But the `HabitIcon` function at line 24-33 renders Lucide icons by name for non-emoji icons. This means older habits with Lucide icon names would show the Lucide icon in some places. The real fix is ensuring consistency.

Actually, re-reading the code: `HabitCard` in CheckIn.tsx line 393 already does `h.icon && /[^\x00-\x7F]/.test(h.icon) ? h.icon : "✅"` — so Lucide names would show as "✅". The screenshot shows "Heart", "Brain" etc. rendered as text, which means there's likely a different rendering path or the `HabitCard` in `Habits.tsx` (line 198) does `{h.icon || "✅"}` WITHOUT the emoji check.

Looking at `Habits.tsx` line 198: `{h.icon || "✅"}` — this renders Lucide icon names as raw text. That's the bug.

### File 3: `src/pages/Habits.tsx`

**Fix line 198**: Change `{h.icon || "✅"}` to use the same emoji check:
```typescript
{h.icon && /[^\x00-\x7F]/.test(h.icon) ? h.icon : "✅"}
```

### Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useStore.tsx` | Change fallback from seed data to empty arrays/objects for new users |
| `src/pages/Habits.tsx` | Fix icon rendering to show "✅" for non-emoji icon values |

These two changes fix both bugs: new users start clean, and Lucide icon names no longer render as raw text. No layout, design, or other functionality changes.

