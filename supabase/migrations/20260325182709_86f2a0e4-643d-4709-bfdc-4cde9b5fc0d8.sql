
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
