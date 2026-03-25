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