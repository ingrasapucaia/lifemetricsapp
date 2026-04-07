

## Plan: Create Agenda (Task Schedule) Module

### Overview
Create a new "Agenda" tab with a weekly task scheduler where users can create tasks for any day, assign life areas, link to goals, set priority levels and times. Design follows the reference image: day-based cards with tasks listed vertically.

### Database

**New table: `tasks`**
```sql
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  time time null,
  completed boolean default false,
  priority text default 'media' check (priority in ('alta', 'media', 'baixa')),
  life_area text null,
  goal_id uuid references public.goals(id) on delete set null null,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users manage own tasks"
  on public.tasks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### Navigation
**File: `src/components/AppSidebar.tsx`**
- Add "Agenda" link with `CalendarCheck` icon right after Dashboard (position 2)
- Route: `/agenda`

### Route
**File: `src/App.tsx`**
- Add route `/agenda` pointing to new `Agenda` page

### Types
**File: `src/types/index.ts`**
- Add `Task` interface with fields: id, userId, title, date, time, completed, priority, lifeArea, goalId, createdAt

### Page
**New file: `src/pages/Agenda.tsx`**

Design inspired by the reference image (light mode, not dark):
- **Header**: "SEMANA {number} • {MONTH}" in uppercase muted text
- **Week navigation**: Previous/next week arrows
- **Day cards**: One card per day of the week, each showing:
  - Left side: Large day number + weekday name (bold) + month (muted)
  - Right side: Task count badge + "+" add button
  - Task list below: Each task as a row with circular check toggle + title
  - Completed tasks get green background highlight (using primary color #D6F3A1)
  - Empty days show subtle placeholder text "Sem tarefas"
- **Add task modal/sheet**: Title input, date (pre-filled), time picker, priority selector (Alta=green, Média=yellow, Baixa=red), life area dropdown, optional goal link dropdown

### Priority colors
- Alta (high): green (#D6F3A1 bg, dark text)
- Média (medium): yellow (#FDF3DC bg)
- Baixa (low): red (#FCEBEB bg)

Priority shown as a small colored dot or left border on the task row.

### Task creation sheet
- Opens when clicking "+" on a day card
- Fields: title, time (optional), priority (3-button selector), life area (dropdown from LIFE_AREAS), linked goal (dropdown from user's goals)
- Save persists to database immediately

### Deadlines integration
**File: `src/pages/Deadlines.tsx`**
- Include tasks with dates in the deadlines/reminders view alongside goal deadlines

### Store integration
**File: `src/hooks/useStore.tsx`**
- Add tasks state, CRUD operations (addTask, updateTask, deleteTask, toggleTask)
- Fetch tasks in the initial data load
- Include in context value

### Files changed
1. Database migration — create `tasks` table with RLS
2. `src/types/index.ts` — add Task interface
3. `src/hooks/useStore.tsx` — add tasks CRUD
4. `src/pages/Agenda.tsx` — new page (main implementation)
5. `src/components/AppSidebar.tsx` — add Agenda nav link
6. `src/App.tsx` — add /agenda route
7. `src/pages/Deadlines.tsx` — include tasks with deadlines

