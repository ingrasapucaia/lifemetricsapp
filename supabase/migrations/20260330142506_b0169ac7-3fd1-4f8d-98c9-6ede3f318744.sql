ALTER TABLE public.pending_premium ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon to check email existence"
ON public.pending_premium
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow authenticated to check email existence"
ON public.pending_premium
FOR SELECT
TO authenticated
USING (true);