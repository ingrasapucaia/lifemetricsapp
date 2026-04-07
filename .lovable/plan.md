

## Plan: Add padding to Deadlines panel inside the Sheet

### Problem
The Deadlines component renders inside the Sheet with `p-0` on the `SheetContent`, so the content is flush against the edges with no spacing.

### Change

**File: `src/pages/Dashboard.tsx`** (line 122)
- Wrap the `<Deadlines />` component in a `<div className="p-5 pt-8">` to add internal padding, keeping `p-0` on the SheetContent to avoid double-padding with the close button area.

