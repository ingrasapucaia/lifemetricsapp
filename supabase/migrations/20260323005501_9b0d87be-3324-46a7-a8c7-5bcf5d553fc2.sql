ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS rewarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS rewarded_at timestamptz;