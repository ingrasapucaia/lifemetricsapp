-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  gender TEXT CHECK (gender IN ('feminino', 'masculino', 'neutro')),
  main_objective TEXT[],
  life_areas TEXT[],
  life_goals TEXT,
  challenges TEXT[],
  strengths TEXT[],
  opportunities TEXT[],
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  insights_tone TEXT DEFAULT 'direto' CHECK (insights_tone IN ('direto', 'gentil')),
  week_starts_monday BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'meta',
  status TEXT NOT NULL DEFAULT 'nao_comecei',
  life_area TEXT,
  reward TEXT,
  aligned_with_goal BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create goal_actions table
CREATE TABLE public.goal_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  area TEXT NOT NULL,
  feeling TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT 'Trophy',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  origin TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Goals RLS
CREATE POLICY "Users can view own goals" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Goal actions RLS (through goal ownership)
CREATE POLICY "Users can view own goal actions" ON public.goal_actions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can insert own goal actions" ON public.goal_actions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can update own goal actions" ON public.goal_actions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can delete own goal actions" ON public.goal_actions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()));

-- Achievements RLS
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own achievements" ON public.achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger for goals
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baixa')),
  life_areas TEXT[],
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  reward TEXT,
  note TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.deadline_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id, item_type)
);

ALTER TABLE public.deadline_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acknowledgments" ON public.deadline_acknowledgments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acknowledgments" ON public.deadline_acknowledgments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own acknowledgments" ON public.deadline_acknowledgments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS rewarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS rewarded_at timestamptz;
CREATE TABLE public.daily_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  summary text[] NOT NULL DEFAULT '{}',
  orientations text[] NOT NULL DEFAULT '{}',
  patterns text[] NOT NULL DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON public.daily_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON public.daily_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON public.daily_insights FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON public.daily_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TABLE IF NOT EXISTS public.habits (
  id text PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text,
  color text,
  category text,
  target_type text NOT NULL DEFAULT 'check',
  target_value numeric,
  active boolean NOT NULL DEFAULT true,
  show_on_dashboard boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  life_area text,
  frequency text,
  frequency_days text[],
  metric_type text,
  metric_unit text,
  metric_time_unit text,
  daily_goal numeric,
  reminder_time text
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;

CREATE POLICY "Users can view own habits"
ON public.habits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
ON public.habits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
ON public.habits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
ON public.habits
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON public.habits(user_id, active);

DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON public.habits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
CREATE TABLE IF NOT EXISTS public.daily_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  mood text NOT NULL DEFAULT '',
  wake_up_time text,
  sleep_time text,
  sleep_hours numeric NOT NULL DEFAULT 0,
  water_intake integer NOT NULL DEFAULT 0,
  exercise_minutes integer NOT NULL DEFAULT 0,
  habit_checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  note_feeling text,
  note_procrastination text,
  note_gratitude text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
ON public.daily_records FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
ON public.daily_records FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
ON public.daily_records FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
ON public.daily_records FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_daily_records_user_date ON public.daily_records(user_id, date);

CREATE TRIGGER update_daily_records_updated_at
BEFORE UPDATE ON public.daily_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix profiles RLS: change from public to authenticated role
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.daily_insights ADD COLUMN IF NOT EXISTS generation_count integer NOT NULL DEFAULT 1;

CREATE TABLE public.life_wheel_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  average_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.life_wheel_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments" ON public.life_wheel_assessments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments" ON public.life_wheel_assessments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON public.life_wheel_assessments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments" ON public.life_wheel_assessments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
-- Add premium columns to profiles (is_premium already exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_since timestamptz,
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS premium_plan text;

-- Create pending_premium table
CREATE TABLE public.pending_premium (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL,
  premium_plan text,
  kiwify_payload jsonb,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for pending_premium (service role only, no user access needed)
ALTER TABLE public.pending_premium ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_premium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon to check email existence"
ON public.pending_premium
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow authenticated to check email existence"
ON public.pending_premium
FOR SELECT
TO authenticated
USING (true);ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;ALTER TABLE public.tasks ADD COLUMN due_time text DEFAULT NULL;
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL DEFAULT 'outro',
  name TEXT NOT NULL,
  kcal NUMERIC,
  carbs_g NUMERIC,
  protein_g NUMERIC,
  fat_g NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.profiles ADD COLUMN daily_kcal_goal numeric DEFAULT NULL;
-- Drop overly permissive SELECT policies
DROP POLICY IF EXISTS "Allow anon to check email existence" ON pending_premium;
DROP POLICY IF EXISTS "Allow authenticated to check email existence" ON pending_premium;

-- Create scoped SELECT policy for authenticated users (own email only)
CREATE POLICY "Users can check own pending status"
  ON pending_premium FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.email()));

-- Create a SECURITY DEFINER function for anon email check (signup flow)
CREATE OR REPLACE FUNCTION public.check_pending_premium(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pending_premium
    WHERE lower(email) = lower(trim(check_email))
      AND processed = false
  )
$$;

-- 1. Protect premium fields on profiles from client-side updates
CREATE OR REPLACE FUNCTION public.protect_premium_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If any premium field changed, revert to old values (only service_role can change these via direct SQL)
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_since IS DISTINCT FROM OLD.premium_since
     OR NEW.premium_expires_at IS DISTINCT FROM OLD.premium_expires_at
     OR NEW.premium_plan IS DISTINCT FROM OLD.premium_plan THEN
    -- Check if current role is service_role
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
      NEW.is_premium := OLD.is_premium;
      NEW.premium_since := OLD.premium_since;
      NEW.premium_expires_at := OLD.premium_expires_at;
      NEW.premium_plan := OLD.premium_plan;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_premium_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_fields();

-- 2. Remove authenticated SELECT on pending_premium (use RPC only)
DROP POLICY IF EXISTS "Users can check own pending status" ON pending_premium;

-- Re-create the trigger (function already exists)
DROP TRIGGER IF EXISTS protect_premium_fields_trigger ON public.profiles;

CREATE TRIGGER protect_premium_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_fields();

-- 1. Revoke UPDATE on premium columns from authenticated role
REVOKE UPDATE (is_premium, premium_since, premium_expires_at, premium_plan)
  ON public.profiles FROM authenticated;

-- 2. Add deny-all policy on pending_premium for authenticated (force RPC usage)
-- First ensure RLS is enabled
ALTER TABLE public.pending_premium ENABLE ROW LEVEL SECURITY;

-- Add a restrictive policy that denies all direct access for authenticated
CREATE POLICY "Deny all direct access for authenticated"
  ON public.pending_premium
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Also deny anon
CREATE POLICY "Deny all direct access for anon"
  ON public.pending_premium
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 3. Fix goal_actions UPDATE policy: add WITH CHECK
DROP POLICY IF EXISTS "Users can update own goal actions" ON public.goal_actions;

CREATE POLICY "Users can update own goal actions"
  ON public.goal_actions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()
  ));
DROP TABLE IF EXISTS public.tasks;ALTER TABLE public.goal_actions ADD COLUMN deadline date DEFAULT NULL;
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
