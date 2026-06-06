
-- Site diary entries
CREATE TABLE public.site_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  weather text,
  manpower jsonb DEFAULT '[]'::jsonb,
  materials jsonb DEFAULT '[]'::jsonb,
  activities text,
  issues text,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_logs TO authenticated;
GRANT ALL ON public.site_logs TO service_role;
ALTER TABLE public.site_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own site logs" ON public.site_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_site_logs_updated BEFORE UPDATE ON public.site_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tender analyses
CREATE TABLE public.tender_analyses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  source_text text,
  summary text,
  boq_items jsonb DEFAULT '[]'::jsonb,
  risks jsonb DEFAULT '[]'::jsonb,
  deadlines jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tender_analyses TO authenticated;
GRANT ALL ON public.tender_analyses TO service_role;
ALTER TABLE public.tender_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tender analyses" ON public.tender_analyses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_tender_analyses_updated BEFORE UPDATE ON public.tender_analyses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
