CREATE TABLE public.user_workspace (
  user_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_workspace TO authenticated;
GRANT ALL ON public.user_workspace TO service_role;
ALTER TABLE public.user_workspace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own workspace select" ON public.user_workspace FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own workspace insert" ON public.user_workspace FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own workspace update" ON public.user_workspace FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own workspace delete" ON public.user_workspace FOR DELETE TO authenticated USING (auth.uid() = user_id);