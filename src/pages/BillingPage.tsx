import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import SEO from "@/components/SEO";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, formatBDT, formatLimit, type Plan } from "@/lib/subscription";
import { paymentService, subscriptionService, totalFor, MANUAL_PAYMENT_NUMBER } from "@/lib/billing";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Loader2, CreditCard, Download, AlertTriangle, Receipt } from "lucide-react";

interface PaymentRow {
  id: string; amount: number; currency: string; billing_cycle: string;
  payment_method: string | null; transaction_id: string | null; status: string;
  invoice_number: string; created_at: string; plan_id: string | null; admin_note: string | null;
}

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  verified: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
};

const LIMIT_ROWS: { key: string; label: string }[] = [
  { key: "projects", label: "Projects" },
  { key: "ai_credits", label: "AI credits / month" },
  { key: "team_members", label: "Team members" },
  { key: "storage_mb", label: "Storage (MB)" },
  { key: "drawings", label: "Drawing analyses" },
  { key: "boq", label: "BOQ generations" },
  { key: "bbs", label: "BBS generations" },
  { key: "reports", label: "Reports" },
];

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, plans, plan, subscription, activeSub, usage, limitOf, percentUsed, reload } = useSubscription();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [method, setMethod] = useState("bkash");
  const [txn, setTxn] = useState("");
  const [sender, setSender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payLoading, setPayLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  const loadPayments = async () => {
    if (!user) return;
    setPayLoading(true);
    const { data } = await supabase.from("payments").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setPayments((data as PaymentRow[]) || []);
    setPayLoading(false);
  };
  useEffect(() => { loadPayments(); /* eslint-disable-next-line */ }, [user]);

  const planName = (id: string | null) => plans.find((p) => p.id === id)?.name || "—";

  const submitCheckout = async () => {
    if (!user || !checkoutPlan) return;
    if (!txn.trim() || !sender.trim()) {
      toast({ title: "Missing details", description: "Transaction ID and sender number are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.checkout({
        userId: user.id, plan: checkoutPlan, cycle, method,
        transactionId: txn, senderNumber: sender,
      });
      toast({
        title: "Payment submitted",
        description: "We're verifying your payment. Your plan activates as soon as it's confirmed.",
      });
      setCheckoutPlan(null); setTxn(""); setSender("");
      await loadPayments();
      await reload();
    } catch (e: any) {
      toast({ title: "Could not submit payment", description: e?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelSub = async () => {
    if (!activeSub) return;
    try {
      await subscriptionService.cancel(activeSub.id);
      toast({ title: "Subscription cancelled", description: "You keep access until the renewal date." });
      reload();
    } catch (e: any) {
      toast({ title: "Cancellation failed", description: e?.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const downloadInvoice = (p: PaymentRow) => {
    const lines = [
      "CIVILOS AI — INVOICE", "",
      `Invoice: ${p.invoice_number}`,
      `Date: ${new Date(p.created_at).toLocaleString()}`,
      `Plan: ${planName(p.plan_id)} (${p.billing_cycle})`,
      `Amount: ৳${p.amount} ${p.currency}`,
      `Method: ${p.payment_method || "—"}`,
      `Transaction ID: ${p.transaction_id || "—"}`,
      `Status: ${p.status}`, "",
      "CivilOS AI — The AI Operating System for Civil Engineers",
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.invoice_number}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const usageBars = [
    { label: "AI credits", used: usage.ai_credits, limit: limitOf("ai_credits"), pct: percentUsed("ai_credits", "ai_credits") },
    { label: "Projects", used: usage.projects, limit: limitOf("projects"), pct: percentUsed("projects", "projects") },
    { label: "Storage (MB)", used: Math.round(usage.storage_mb), limit: limitOf("storage_mb"), pct: percentUsed("storage_mb", "storage_mb") },
  ];

  return (
    <>
      <SEO title="Plans & Billing" description="Manage your CivilOS AI subscription, packages, usage limits and invoices." />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 h-14 flex items-center gap-2 border-b bg-background/95 backdrop-blur px-3 md:px-6">
              <SidebarTrigger />
              <h1 className="flex-1 font-heading text-base md:text-lg font-semibold truncate">Plans &amp; Billing</h1>
              <NotificationBell />
              <ThemeToggle />
            </header>

            <main className="flex-1 p-4 md:p-6 space-y-6 overflow-x-hidden max-w-6xl w-full mx-auto">
              {/* Current plan */}
              <section className="rounded-2xl border bg-card p-4 md:p-6">
                {loading ? (
                  <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-64" /></div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Your plan</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-heading text-2xl font-bold">{plan?.name || "Free"}</h2>
                        <Badge variant="outline" className={statusColor[subscription?.status || "active"]}>
                          {subscription?.status || "active"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activeSub?.renewal_date
                          ? `Renews ${new Date(activeSub.renewal_date).toLocaleDateString()}`
                          : "No renewal date — free plan"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Payment method: {activeSub?.payment_provider ? "bKash / Nagad (manual)" : "—"}
                      </p>
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <Button size="sm" onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}>
                          <Crown className="h-3.5 w-3.5 mr-1" /> Change plan
                        </Button>
                        {activeSub && (
                          <Button size="sm" variant="outline" onClick={cancelSub}>Cancel subscription</Button>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-xs text-muted-foreground">Usage this month</p>
                      {usageBars.map((u) => (
                        <div key={u.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{u.label}</span>
                            <span className="text-muted-foreground">
                              {u.used} / {formatLimit(u.limit)}
                            </span>
                          </div>
                          <Progress value={u.pct} className="h-1.5" />
                          {u.pct >= 85 && (
                            <p className="text-[11px] text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {u.label} is {u.pct}% used — consider upgrading.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Plans */}
              <section id="plans" className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-heading text-lg md:text-xl font-bold">Packages</h2>
                    <p className="text-xs text-muted-foreground">All prices in Bangladeshi Taka (৳).</p>
                  </div>
                  <div className="inline-flex rounded-lg border p-0.5 bg-muted/50">
                    {(["monthly", "yearly"] as const).map((c) => (
                      <button key={c} onClick={() => setCycle(c)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          cycle === c ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
                        {c === "monthly" ? "Monthly" : "Yearly · 2 months free"}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {plans.map((p) => {
                      const isCurrent = plan?.id === p.id;
                      const price = cycle === "yearly" ? p.price_yearly : p.price_monthly;
                      const currentPrice = plan ? (cycle === "yearly" ? plan.price_yearly : plan.price_monthly) : 0;
                      const isDowngrade = price < currentPrice;
                      return (
                        <div key={p.id}
                          className={`relative rounded-2xl border bg-card p-5 flex flex-col ${
                            p.is_popular ? "border-accent ring-1 ring-accent/40" : ""}`}>
                          {p.is_popular && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              Popular
                            </span>
                          )}
                          {isCurrent && (
                            <Badge variant="outline" className="absolute top-3 right-3 text-[10px]">Current</Badge>
                          )}
                          <p className="font-heading text-base font-bold">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.tagline}</p>
                          <p className="flex items-baseline gap-1 mt-3">
                            <span className="font-heading text-2xl font-bold">{price > 0 ? formatBDT(price) : "৳0"}</span>
                            <span className="text-[11px] text-muted-foreground">/{cycle === "yearly" ? "year" : "month"}</span>
                          </p>
                          <ul className="mt-4 space-y-1.5 flex-1">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-start gap-1.5 text-xs">
                                <Check className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" /><span>{f}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-4 space-y-1 border-t pt-3">
                            {LIMIT_ROWS.map((r) => (
                              <div key={r.key} className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">{r.label}</span>
                                <span className="font-medium">{formatLimit(p.limits[r.key] as any)}</span>
                              </div>
                            ))}
                          </div>
                          <Button
                            className="mt-4 w-full"
                            variant={p.is_popular ? "default" : "outline"}
                            disabled={isCurrent || p.code === "free"}
                            onClick={() => { setCheckoutPlan(p); }}
                          >
                            {isCurrent ? "Current plan" : p.code === "free" ? "Free forever" : isDowngrade ? "Downgrade" : "Upgrade"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* History */}
              <section className="rounded-2xl border bg-card">
                <Tabs defaultValue="payments">
                  <div className="p-4 border-b">
                    <TabsList>
                      <TabsTrigger value="payments" className="text-xs">Payment history</TabsTrigger>
                      <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="payments" className="p-4 space-y-2 mt-0">
                    {payLoading ? (
                      <Skeleton className="h-16 w-full" />
                    ) : payments.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <Receipt className="h-9 w-9 mx-auto text-muted-foreground/40" />
                        <p className="text-sm font-medium">No payments yet</p>
                        <p className="text-xs text-muted-foreground">Your purchases will appear here.</p>
                      </div>
                    ) : payments.map((p) => (
                      <div key={p.id} className="rounded-lg border p-3 flex flex-wrap items-center gap-2 justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{planName(p.plan_id)} · {p.billing_cycle}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {new Date(p.created_at).toLocaleString()} · {p.payment_method} · TrxID {p.transaction_id}
                          </p>
                          {p.admin_note && <p className="text-[11px] text-destructive">{p.admin_note}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{formatBDT(Number(p.amount))}</span>
                          <Badge variant="outline" className={statusColor[p.status]}>{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="invoices" className="p-4 space-y-2 mt-0">
                    {payments.filter((p) => p.status === "verified").length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <Receipt className="h-9 w-9 mx-auto text-muted-foreground/40" />
                        <p className="text-sm font-medium">No invoices found</p>
                      </div>
                    ) : payments.filter((p) => p.status === "verified").map((p) => (
                      <div key={p.id} className="rounded-lg border p-3 flex items-center gap-2 justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.invoice_number}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()} · {formatBDT(Number(p.amount))}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => downloadInvoice(p)}>
                          <Download className="h-3.5 w-3.5 mr-1" /> Download
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </section>

              <p className="text-[11px] text-muted-foreground text-center pb-4">
                Payments are verified manually by our team, usually within a few hours.
                Need help? <Link to="/contact" className="underline">Contact support</Link>.
              </p>
            </main>
          </div>
        </div>
      </SidebarProvider>

      {/* Checkout */}
      <Dialog open={!!checkoutPlan} onOpenChange={(o) => !o && setCheckoutPlan(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Checkout
            </DialogTitle>
            <DialogDescription>Complete your {checkoutPlan?.name} subscription.</DialogDescription>
          </DialogHeader>

          {checkoutPlan && (() => {
            const { base, vat, total } = totalFor(checkoutPlan, cycle);
            return (
              <div className="space-y-4">
                <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{checkoutPlan.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Billing cycle</span><span className="font-medium capitalize">{cycle}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span>{formatBDT(base)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">VAT / fees</span><span>{formatBDT(vat)}</span></div>
                  <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Total</span><span>{formatBDT(total)}</span></div>
                </div>

                <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1">
                  <p className="font-semibold">How to pay</p>
                  <p>Send <strong>{formatBDT(total)}</strong> to <strong>{MANUAL_PAYMENT_NUMBER}</strong> (bKash / Nagad — Send Money), then enter the Transaction ID below.</p>
                  <p className="text-muted-foreground">Your plan activates right after our team verifies the payment.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bkash">bKash</SelectItem>
                        <SelectItem value="nagad">Nagad</SelectItem>
                        <SelectItem value="rocket">Rocket</SelectItem>
                        <SelectItem value="bank">Bank transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sender number / account</Label>
                    <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Transaction ID</Label>
                    <Input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="e.g. 9F7AB2C1D3" />
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCheckoutPlan(null)} disabled={submitting}>Cancel</Button>
            <Button onClick={submitCheckout} disabled={submitting}>
              {submitting ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing…</>) : "Confirm payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
