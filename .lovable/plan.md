

## Plan: Increase base font size globally for mobile comfort

The simplest and most effective approach is to increase the base `font-size` on the `html`/`body` element for mobile viewports. Since the app uses Tailwind's `text-sm`, `text-xs`, `text-base` etc. (which are all relative to the root font size in `rem`), bumping the root font size on mobile will scale everything up uniformly -- titles, habit names, goal labels, metrics, buttons, inputs, all of it.

### Changes

**File: `src/index.css`**

Add a mobile-first font size rule in the `@layer base` block:

- Set `html { font-size: 17px }` as the default (mobile-first), which bumps everything ~6% from the browser default of 16px
- Add a `@media (min-width: 768px)` rule resetting to `font-size: 16px` so desktop stays unchanged

This single change propagates across every `rem`-based size in the entire app (Tailwind classes, shadcn components, custom styles) without needing to touch individual components.

