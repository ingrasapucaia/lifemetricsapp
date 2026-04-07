

## Plan: Move Prazos e Lembretes to Bell Icon on Dashboard

### Changes

**File: `src/pages/Dashboard.tsx`**
- Import `Sheet`, `SheetContent`, `SheetTrigger`, `SheetHeader`, `SheetTitle` from UI
- Import `Deadlines` component from `@/pages/Deadlines`
- Add state `deadlinesOpen` to control the sheet
- Replace the static bell `<button>` with a `SheetTrigger` that opens a right-side `Sheet` containing the `Deadlines` component
- Optionally show a badge dot on the bell if there are upcoming deadlines

**File: `src/components/AppSidebar.tsx`**
- Remove the `{ to: "/prazos", label: "Prazos e lembretes", icon: Bell }` entry from `mainLinks`
- Remove `Bell` from the lucide import if unused elsewhere

**File: `src/App.tsx`**
- Keep the `/prazos` route for direct URL access (optional, low cost to keep)

### Technical notes
- The `Deadlines` component is self-contained (fetches its own data), so it renders cleanly inside a Sheet without any prop changes
- No backend or database changes needed

