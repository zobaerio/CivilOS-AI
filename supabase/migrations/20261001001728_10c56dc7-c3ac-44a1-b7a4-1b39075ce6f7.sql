DROP POLICY IF EXISTS "Plans are public" ON public.plans;
CREATE POLICY "Active plans are public" ON public.plans FOR SELECT USING (is_active = true);