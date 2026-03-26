
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
