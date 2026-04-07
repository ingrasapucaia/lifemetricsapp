

## Plan: Fix meals content being cut off in RegisterSheet

### Problem
The `ScrollArea` component has a fixed `maxHeight` of `calc(85vh - 140px)` which doesn't account for content growth when many meals are added. The meals section overflows and gets clipped.

### Change

**File: `src/components/dashboard/RegisterSheet.tsx`**

1. **Line 168**: Replace `ScrollArea` with a plain scrollable `div` to ensure native scrolling works reliably within the Drawer:
   ```tsx
   <div className="flex-1 px-4 overflow-y-auto" style={{ maxHeight: "calc(85vh - 140px)" }}>
   ```
   The `ScrollArea` component from Radix can sometimes clip content inside drawers. Using a native scrollable div is more reliable here.

2. Remove the `ScrollArea` import if no longer used elsewhere in the file.

This is a single-line fix — replacing `<ScrollArea>` with a native `<div>` (and updating the closing tag) to ensure all meal cards are scrollable without being cut off.

