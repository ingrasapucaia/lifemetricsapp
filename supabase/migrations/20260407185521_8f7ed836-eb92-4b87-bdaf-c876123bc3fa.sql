
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  date date not null,
  time time null,
  completed boolean default false,
  priority text default 'media',
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
