
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
