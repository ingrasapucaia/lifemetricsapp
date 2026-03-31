
-- Re-create the trigger (function already exists)
DROP TRIGGER IF EXISTS protect_premium_fields_trigger ON public.profiles;

CREATE TRIGGER protect_premium_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_fields();
