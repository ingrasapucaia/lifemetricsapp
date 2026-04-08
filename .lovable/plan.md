

## Plan: Fix task toggle bug + Add edit task + Custom time picker

### Bug Fix: Task completion not persisting

**Root cause**: In `toggleTask` (useStore.tsx line 593-602), `newCompleted` is set inside the `setTasks` functional updater callback. With React 18 automatic batching, this callback may execute after the `supabase.update()` call on line 601, so `newCompleted` stays `false`. Confirmed: all tasks in DB show `completed: false`.

**Fix in `src/hooks/useStore.tsx`**: Find the task first from current state, compute `newCompleted` before calling `setTasks`:

```tsx
const toggleTask = useCallback((id: string) => {
  if (!user) return;
  setTasks((prev) => {
    const task = prev.find((t) => t.id === id);
    if (!task) return prev;
    const newCompleted = !task.completed;
    void supabase.from("tasks").update({ completed: newCompleted }).eq("id", id).eq("user_id", user.id);
    return prev.map((t) => t.id === id ? { ...t, completed: newCompleted } : t);
  });
}, [user]);
```

---

### Feature: Edit existing task

**File: `src/pages/Agenda.tsx`**

- Add an `editingTask` state (null or Task)
- Clicking a task row (not the check or delete buttons) opens the same bottom Sheet pre-filled with the task's current values
- Sheet title changes to "Editar tarefa" when editing
- Save button calls `updateTask(id, updates)` instead of `addTask`
- The `updateTask` function already exists in the store

---

### Feature: Custom time picker matching app design

**File: `src/pages/Agenda.tsx`**

Replace the native `<input type="time">` with a custom inline time picker:
- Two side-by-side scroll selectors (hour 00-23, minute 00-59 in 5-min steps)
- Styled with the app's rounded cards, primary color highlights, and soft backgrounds
- Compact design fitting the bottom sheet layout
- A "Limpar" button to remove the time selection

---

### Not changed
- No database or backend changes
- No changes to other pages

