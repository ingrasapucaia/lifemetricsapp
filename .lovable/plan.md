

## Plan: Move kcal goal to Meals page + fix mobile text overflow

### 1. Move "Meta calórica diária" from Profile to Meals page

**File: `src/pages/Profile.tsx`**
- Remove the `dailyKcalGoal` state, its initialization from `authProfile`, its inclusion in `hasChanges`, and its inclusion in the save payload
- Remove the UI block (lines 417-427) with the Label, Input, and helper text

**File: `src/pages/Meals.tsx`**
- Import `useAuth`, `supabase`, `Input`, `Label`, and `toast`
- Add local state for `kcalGoal` initialized from `profile?.daily_kcal_goal`
- Add a card above the Calendar with the kcal goal input and a save button
- On save, update `profiles.daily_kcal_goal` directly and call `refreshProfile()`

### 2. Fix mobile text overflow in CardSelect

**File: `src/pages/Profile.tsx`**
- In the `CardSelect` component, add `min-w-0` to the button and `break-words` / `truncate` or `line-clamp` to the label `<span>` so long labels like "Sou empresário/autônomo" don't overflow on small screens

