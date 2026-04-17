ALTER TABLE public.life_wheel_assessments
  ADD COLUMN IF NOT EXISTS ai_analysis text,
  ADD COLUMN IF NOT EXISTS ai_analysis_generated_at timestamptz;
