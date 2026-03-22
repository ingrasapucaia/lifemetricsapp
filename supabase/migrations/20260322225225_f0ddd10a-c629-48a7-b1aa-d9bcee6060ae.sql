
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
