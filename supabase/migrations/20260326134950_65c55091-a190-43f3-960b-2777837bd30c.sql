
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
