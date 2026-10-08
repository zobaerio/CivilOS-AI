CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.agent_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('health_check','failed_tasks_report')),
  frequency text NOT NULL CHECK (frequency IN ('hourly','daily','weekly')),
  enabled boolean NOT NULL DEFAULT true,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  last_status text,
  last_result jsonb,
  fail_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_automations TO authenticated;
GRANT ALL ON public.agent_automations TO service_role;
ALTER TABLE public.agent_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read automations" ON public.agent_automations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.agent_cron_key (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  key text NOT NULL DEFAULT encode(gen_random_bytes(32),'hex')
);
GRANT ALL ON public.agent_cron_key TO service_role;
ALTER TABLE public.agent_cron_key ENABLE ROW LEVEL SECURITY;
INSERT INTO public.agent_cron_key (id) VALUES (1);