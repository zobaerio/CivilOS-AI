import { supabase } from "@/integrations/supabase/client";
import type { Plan } from "@/lib/subscription";

/**
 * Payment abstraction layer.
 * Today only the `manual` provider (bKash / Nagad / bank transfer with admin
 * verification) is configured. A card gateway can be added by implementing the
 * PaymentProvider interface below and registering it in `providers`.
 */
export interface CheckoutInput {
  userId: string;
  plan: Plan;
  cycle: "monthly" | "yearly";
  method: string;
  transactionId: string;
  senderNumber: string;
}

export interface PaymentProvider {
  id: string;
  label: string;
  /** creates a payment record and returns its id; never grants access itself */
  checkout: (input: CheckoutInput) => Promise<{ paymentId: string; status: string }>;
}

export const MANUAL_PAYMENT_NUMBER = "+8801832313998";

export const VAT_RATE = 0; // set > 0 when VAT registration is active

export const priceFor = (plan: Plan, cycle: "monthly" | "yearly") =>
  cycle === "yearly" ? Number(plan.price_yearly) : Number(plan.price_monthly);

export const totalFor = (plan: Plan, cycle: "monthly" | "yearly") => {
  const base = priceFor(plan, cycle);
  const vat = Math.round(base * VAT_RATE);
  return { base, vat, total: base + vat };
};

const manualProvider: PaymentProvider = {
  id: "manual",
  label: "bKash / Nagad / Bank transfer",
  async checkout({ userId, plan, cycle, method, transactionId, senderNumber }) {
    const { total } = totalFor(plan, cycle);
    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        amount: total,
        currency: plan.currency || "BDT",
        billing_cycle: cycle,
        payment_provider: "manual",
        payment_method: method,
        transaction_id: transactionId.trim(),
        sender_number: senderNumber.trim(),
        status: "pending",
      })
      .select("id, status")
      .single();
    if (error) throw error;
    return { paymentId: data.id, status: data.status };
  },
};

export const providers: Record<string, PaymentProvider> = {
  manual: manualProvider,
};

export const paymentService = {
  checkout: (input: CheckoutInput, providerId = "manual") => {
    const provider = providers[providerId];
    if (!provider) throw new Error("Payment provider not configured");
    return provider.checkout(input);
  },
};

export const subscriptionService = {
  /** users may only cancel their own subscription; upgrades require verified payment */
  async cancel(subscriptionId: string) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", subscriptionId);
    if (error) throw error;
  },
};

/** admin-only: verify a payment and activate the matching subscription */
export const billingService = {
  async approvePayment(payment: {
    id: string; user_id: string; plan_id: string | null; billing_cycle: string;
  }) {
    const now = new Date();
    const renewal = new Date(now);
    if (payment.billing_cycle === "yearly") renewal.setFullYear(renewal.getFullYear() + 1);
    else renewal.setMonth(renewal.getMonth() + 1);

    const { data: existing } = await supabase
      .from("subscriptions").select("id").eq("user_id", payment.user_id).maybeSingle();

    if (existing) {
      const { error } = await supabase.from("subscriptions").update({
        plan_id: payment.plan_id!,
        status: "active",
        billing_cycle: payment.billing_cycle,
        start_date: now.toISOString(),
        renewal_date: renewal.toISOString(),
        cancelled_at: null,
        payment_provider: "manual",
      }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: payment.user_id,
        plan_id: payment.plan_id!,
        status: "active",
        billing_cycle: payment.billing_cycle,
        renewal_date: renewal.toISOString(),
        payment_provider: "manual",
      });
      if (error) throw error;
    }

    const { error: payErr } = await supabase.from("payments").update({
      status: "verified", verified_at: now.toISOString(),
    }).eq("id", payment.id);
    if (payErr) throw payErr;
  },

  async rejectPayment(paymentId: string, note: string) {
    const { error } = await supabase.from("payments")
      .update({ status: "failed", admin_note: note })
      .eq("id", paymentId);
    if (error) throw error;
  },
};
