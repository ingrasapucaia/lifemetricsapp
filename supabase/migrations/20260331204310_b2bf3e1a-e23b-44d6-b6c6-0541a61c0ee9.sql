
-- 1. Revoke UPDATE on premium columns from authenticated role
REVOKE UPDATE (is_premium, premium_since, premium_expires_at, premium_plan)
  ON public.profiles FROM authenticated;

-- 2. Add deny-all policy on pending_premium for authenticated (force RPC usage)
-- First ensure RLS is enabled
ALTER TABLE public.pending_premium ENABLE ROW LEVEL SECURITY;

-- Add a restrictive policy that denies all direct access for authenticated
CREATE POLICY "Deny all direct access for authenticated"
  ON public.pending_premium
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Also deny anon
CREATE POLICY "Deny all direct access for anon"
  ON public.pending_premium
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- 3. Fix goal_actions UPDATE policy: add WITH CHECK
DROP POLICY IF EXISTS "Users can update own goal actions" ON public.goal_actions;

CREATE POLICY "Users can update own goal actions"
  ON public.goal_actions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM goals WHERE goals.id = goal_actions.goal_id AND goals.user_id = auth.uid()
  ));
