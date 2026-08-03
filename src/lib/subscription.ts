import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type PlanLimits = Record<string, number | boolean>;

export interface Plan {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  sort_order: number;
  is_popular: boolean;
  features: string[];
  limits: PlanLimits;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  start_date: string;
  renewal_date: string | null;
  cancelled_at: string | null;
  payment_provider: string | null;
}

export interface UsageRecord {
  ai_credits: number;
  projects: number;
  boq_generations: number;
  bbs_generations: number;
  drawings: number;
  reports: number;
  storage_mb: number;
}

export const EMPTY_USAGE: UsageRecord = {
  ai_credits: 0, projects: 0, boq_generations: 0, bbs_generations: 0,
  drawings: 0, reports: 0, storage_mb: 0,
};

export const currentPeriod = () => new Date().toISOString().slice(0, 7);

export const formatBDT = (n: number) =>
  `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n)}`;

export const formatLimit = (v: number | boolean | undefined) => {
  if (v === -1) return "Unlimited";
  if (v === true) return "Included";
  if (v === false || v === undefined) return "—";
  return new Intl.NumberFormat().format(Number(v));
};

/**
 * Central subscription/plan/usage state.
 * Plan capability is always read from the database, never from local state.
 */
export function useSubscription() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord>(EMPTY_USAGE);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: planRows } = await supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    const list = ((planRows as any[]) || []).map((p) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
      limits: (p.limits || {}) as PlanLimits,
    })) as Plan[];
    setPlans(list);

    if (user) {
      const [{ data: sub }, { data: use }] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("usage_records").select("*").eq("user_id", user.id).eq("period", currentPeriod()).maybeSingle(),
      ]);
      setSubscription((sub as any) || null);
      setUsage(((use as any) || EMPTY_USAGE) as UsageRecord);
    } else {
      setSubscription(null);
      setUsage(EMPTY_USAGE);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const freePlan = plans.find((p) => p.code === "free") || null;
  const activeSub = subscription && ["active", "trialing"].includes(subscription.status) ? subscription : null;
  const plan = (activeSub ? plans.find((p) => p.id === activeSub.plan_id) : null) || freePlan;

  const limitOf = (key: string): number => {
    const v = plan?.limits?.[key];
    if (typeof v === "number") return v;
    return 0;
  };

  const hasFeature = (key: string): boolean => {
    const v = plan?.limits?.[key];
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    return false;
  };

  const usageOf = (key: keyof UsageRecord) => Number(usage?.[key] ?? 0);

  const percentUsed = (usageKey: keyof UsageRecord, limitKey: string) => {
    const limit = limitOf(limitKey);
    if (limit <= 0) return 0; // unlimited or unset
    return Math.min(100, Math.round((usageOf(usageKey) / limit) * 100));
  };

  const isOverLimit = (usageKey: keyof UsageRecord, limitKey: string) => {
    const limit = limitOf(limitKey);
    if (limit === -1) return false;
    return usageOf(usageKey) >= limit;
  };

  return {
    loading, plans, plan, subscription, activeSub, usage,
    limitOf, hasFeature, usageOf, percentUsed, isOverLimit, reload: load,
  };
}
