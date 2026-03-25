
ALTER TABLE public.daily_insights ADD COLUMN IF NOT EXISTS generation_count integer NOT NULL DEFAULT 1;
