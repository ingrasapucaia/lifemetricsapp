

## Plan: Enhance Goals Section

### 1. Add GoalsInProgress to Dashboard

**File: `src/pages/Dashboard.tsx`**
- Import `GoalsInProgress` from `@/components/dashboard/GoalsInProgress`
- Add `<GoalsInProgress />` after the `HabitCardGrid` section (before the floating button)

### 2. Enhance goal cards in Goals page with progress bar, pending tasks count, and reward

**File: `src/pages/Goals.tsx`** (lines 362-418, the goal card rendering)
- Add a green progress bar (`bg-primary` / lime green) below the status badge, showing action completion percentage
- Add pending tasks count text: e.g. "3 tarefas pendentes" 
- The reward line already exists (lines 414-418) — keep it as-is

The card layout becomes:
```text
┌─────────────────────────────────┐
│ 🎯 Goal title              ⋮   │
│ [Em progresso ▾]                │
│ ████████░░░░░░░░░░░░  45%       │
│ 3 tarefas pendentes             │
│ Prazo: 12 de abril de 2026      │
│ 🎁 Recompensa text              │
└─────────────────────────────────┘
```

### 3. Move "Metas de Vida" higher in sidebar menu

**File: `src/components/AppSidebar.tsx`** (lines 9-20)
- Move the `{ to: "/metas", ... }` entry from position 7 to position 4 (after Insights, before Roda da Vida)

New order: Dashboard, Métricas, Insights, **Metas de Vida**, Roda da Vida, Meus Registros, Controle de hábitos, Minhas Conquistas

### Technical notes
- Progress bar uses the existing `Progress` component with primary/lime color
- GoalsInProgress component already exists and is self-contained
- No backend changes needed

