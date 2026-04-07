

## Plan: Add white background to meals card in RegisterSheet

### Change

**File: `src/components/dashboard/RegisterSheet.tsx`** (line 236)

Wrap the meals section in a white card container. Change:
```
<div className="space-y-3">
```
to:
```
<div className="rounded-2xl bg-white border border-border/60 p-4 space-y-3">
```

This gives the Refeições section its own distinct white card background, matching the visual style of other cards in the app and making it stand out from the drawer background.

Also update the inner meal-type containers (line 261) from `rounded-xl border border-border/40 p-3` to `rounded-xl bg-muted/30 p-3` to create subtle visual separation within the white card without double-bordering.

