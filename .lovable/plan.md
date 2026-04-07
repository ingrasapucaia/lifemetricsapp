

## Plan: Add deadline to subtasks + reorder button

### 1. Database migration — add `deadline` column to `goal_actions`

```sql
ALTER TABLE public.goal_actions ADD COLUMN deadline date DEFAULT NULL;
```

### 2. Update TypeScript type

**File: `src/types/index.ts`**
- Add `deadline?: string` to `GoalAction` interface

### 3. Update store layer

**File: `src/hooks/useStore.tsx`**
- `mapGoalActionRow`: map `row.deadline` to the action
- `addGoalAction`: include `deadline` in the insert
- `updateGoalAction`: handle `deadline` in `dbUpdates`

### 4. Update GoalDetail UI — date picker on subtasks + reorder button

**File: `src/pages/GoalDetail.tsx`**

**Add action form**: Add an optional date picker (Popover + Calendar) next to the priority selector when creating a new action.

**Action cards**: Show the deadline date next to the priority badge (small text, e.g. "12 abr").

**Edit action dialog**: Add a date field so users can set/change deadline on existing actions.

**Reorder button**: Add a button (e.g. `ArrowUpDown` icon) next to the "Ações (X/50)" header. When clicked, it sorts the actions list: pending first, completed last — applied visually via local state sort, not changing DB order.

### 5. Update Deadlines panel to include subtask deadlines

**File: `src/pages/Deadlines.tsx`**
- In `fetchData`, also query `goal_actions` with non-null deadlines within the filter range
- Add these as individual `DeadlineItem` entries (type: `"acao"`) with the parent goal title as context
- Update `DeadlineItem` type to support `"acao"` type and add `parentTitle` field
- Update `getItemKey` to handle the new type

### Technical notes
- Single migration: one column addition, no RLS changes needed (existing policies on `goal_actions` already cover this)
- No changes to any other pages

