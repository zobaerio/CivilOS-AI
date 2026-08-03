
-- PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BDT',
  sort_order int NOT NULL DEFAULT 0,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are public" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins insert plans" ON public.plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update plans" ON public.plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete plans" ON public.plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  start_date timestamptz NOT NULL DEFAULT now(),
  renewal_date timestamptz,
  cancelled_at timestamptz,
  payment_provider text,
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own free subscription" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update subscriptions" ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users cancel own subscription" ON public.subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status IN ('cancelled','active'));

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  payment_provider text NOT NULL DEFAULT 'manual',
  payment_method text,
  transaction_id text,
  sender_number text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  invoice_number text NOT NULL DEFAULT 'INV-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,10)),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins update payments" ON public.payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- USAGE RECORDS
CREATE TABLE public.usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL DEFAULT to_char(now(),'YYYY-MM'),
  ai_credits int NOT NULL DEFAULT 0,
  projects int NOT NULL DEFAULT 0,
  boq_generations int NOT NULL DEFAULT 0,
  bbs_generations int NOT NULL DEFAULT 0,
  drawings int NOT NULL DEFAULT 0,
  reports int NOT NULL DEFAULT 0,
  storage_mb numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);
GRANT SELECT, INSERT, UPDATE ON public.usage_records TO authenticated;
GRANT ALL ON public.usage_records TO service_role;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own usage" ON public.usage_records FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own usage" ON public.usage_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own usage" ON public.usage_records FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at triggers
CREATE TRIGGER plans_set_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER usage_set_updated_at BEFORE UPDATE ON public.usage_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEED PLANS
INSERT INTO public.plans (code,name,tagline,price_monthly,price_yearly,sort_order,is_popular,features,limits) VALUES
('free','Free','For students & first estimates',0,0,1,false,
 '["Basic BOQ generator","BNBC 2022 load summary","Community support"]'::jsonb,
 '{"projects":3,"ai_credits":50,"team_members":1,"storage_mb":200,"drawings":3,"boq":5,"bbs":2,"reports":3,"estimates":5,"ai_writer":false,"ai_drawing":false,"ai_insights":false,"analytics":false,"tender":false,"finance":false,"procurement":false,"team":false,"export_excel":false,"priority_support":false}'::jsonb),
('starter','Starter','For freelance engineers',499,4990,2,false,
 '["15 projects","BOQ + Rate Analysis","Material calculator & BBS","PDF & CSV export","Email support"]'::jsonb,
 '{"projects":15,"ai_credits":1000,"team_members":2,"storage_mb":5000,"drawings":25,"boq":50,"bbs":25,"reports":25,"estimates":50,"ai_writer":false,"ai_drawing":false,"ai_insights":false,"analytics":false,"tender":true,"finance":false,"procurement":false,"team":false,"export_excel":true,"priority_support":false}'::jsonb),
('professional','Professional','For consultants & contractors',1999,19990,3,true,
 '["Unlimited projects","All AI modules incl. AI Drawing & AI Writer","Advanced BOQ, BBS & Rate Analysis","Tender tools & analytics","Cash flow & finance modules","Team collaboration","Priority support"]'::jsonb,
 '{"projects":-1,"ai_credits":10000,"team_members":10,"storage_mb":50000,"drawings":-1,"boq":-1,"bbs":-1,"reports":-1,"estimates":-1,"ai_writer":true,"ai_drawing":true,"ai_insights":true,"analytics":true,"tender":true,"finance":true,"procurement":true,"team":true,"export_excel":true,"priority_support":true}'::jsonb),
('business','Business','For construction companies',4999,49990,4,false,
 '["Everything in Professional","Unlimited team seats","Company management & roles","Advanced analytics & reporting","Priority AI processing","Dedicated account manager"]'::jsonb,
 '{"projects":-1,"ai_credits":-1,"team_members":-1,"storage_mb":-1,"drawings":-1,"boq":-1,"bbs":-1,"reports":-1,"estimates":-1,"ai_writer":true,"ai_drawing":true,"ai_insights":true,"analytics":true,"tender":true,"finance":true,"procurement":true,"team":true,"export_excel":true,"priority_support":true}'::jsonb);
