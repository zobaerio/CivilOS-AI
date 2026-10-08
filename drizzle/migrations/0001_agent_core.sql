CREATE TABLE public.agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type text NOT NULL CHECK (agent_type IN ('admin','user')),
  user_id uuid NOT NULL,
  objective text NOT NULL,
  interpreted_intent text,
  status text NOT NULL DEFAULT 'received',
  risk_level text NOT NULL DEFAULT 'LOW',
  approval_required boolean NOT NULL DEFAULT false,
  result text,
  error text,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);
GRANT SELECT ON public.agent_tasks TO authenticated;
GRANT ALL ON public.agent_tasks TO service_role;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own agent tasks" ON public.agent_tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (agent_type = 'admin' AND public.has_role(auth.uid(),'admin')));

CREATE TABLE public.agent_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  agent_type text NOT NULL,
  actor_user_id uuid NOT NULL,
  kind text NOT NULL,
  tool text,
  target text,
  risk_level text,
  input_summary jsonb,
  result_summary jsonb,
  status text NOT NULL DEFAULT 'ok',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_steps TO authenticated;
GRANT ALL ON public.agent_steps TO service_role;
ALTER TABLE public.agent_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own agent steps" ON public.agent_steps FOR SELECT TO authenticated
  USING (auth.uid() = actor_user_id OR public.has_role(auth.uid(),'admin'));
CREATE INDEX agent_steps_task_idx ON public.agent_steps(task_id, created_at);

CREATE TABLE public.agent_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  tool text NOT NULL,
  tool_input jsonb NOT NULL,
  risk_level text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agent_approvals TO authenticated;
GRANT ALL ON public.agent_approvals TO service_role;
ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins see approvals" ON public.agent_approvals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_feature_settings (
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, feature_key)
);
GRANT SELECT ON public.user_feature_settings TO authenticated;
GRANT ALL ON public.user_feature_settings TO service_role;
ALTER TABLE public.user_feature_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own feature settings" ON public.user_feature_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);