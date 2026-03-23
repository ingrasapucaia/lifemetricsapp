
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
