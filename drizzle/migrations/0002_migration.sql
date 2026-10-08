CREATE TABLE public.agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_type text NOT NULL CHECK (agent_type IN ('admin','user')),
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_type, key)
);
GRANT SELECT, DELETE ON public.agent_memory TO authenticated;
GRANT ALL ON public.agent_memory TO service_role;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own agent memory" ON public.agent_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own agent memory" ON public.agent_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);