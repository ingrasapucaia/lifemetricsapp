
-- 1. Protect premium fields on profiles from client-side updates
CREATE OR REPLACE FUNCTION public.protect_premium_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If any premium field changed, revert to old values (only service_role can change these via direct SQL)
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_since IS DISTINCT FROM OLD.premium_since
     OR NEW.premium_expires_at IS DISTINCT FROM OLD.premium_expires_at
     OR NEW.premium_plan IS DISTINCT FROM OLD.premium_plan THEN
    -- Check if current role is service_role
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
      NEW.is_premium := OLD.is_premium;
      NEW.premium_since := OLD.premium_since;
      NEW.premium_expires_at := OLD.premium_expires_at;
      NEW.premium_plan := OLD.premium_plan;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_premium_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_fields();

-- 2. Remove authenticated SELECT on pending_premium (use RPC only)
DROP POLICY IF EXISTS "Users can check own pending status" ON pending_premium;
