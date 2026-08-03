import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import SEO from "@/components/SEO";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { billingService } from "@/lib/billing";
import { formatBDT } from "@/lib/subscription";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ShieldAlert, Receipt } from "lucide-react";

interface Row {
  id: string; user_id: string; plan_id: string | null; amount: number;
  billing_cycle: string; payment_method: string | null; transaction_id: string | null;
  sender_number: string | null; status: string; invoice_number: string; created_at: string;
}

export default function AdminBillingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: role } = await supabase.from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!role);
      if (!role) { setLoading(false); return; }
      await load();
    })();
    // eslint-disable-next-line
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [{ data: pays }, { data: pl }] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("plans").select("id,name"),
    ]);
    setRows((pays as Row[]) || []);
    setPlans(Object.fromEntries(((pl as any[]) || []).map((p) => [p.id, p.name])));
    setLoading(false);
  };

  const approve = async (r: Row) => {
    setBusy(r.id);
    try {
      await billingService.approvePayment(r);
      toast({ title: "Payment verified", description: "Subscription activated." });
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally { setBusy(null); }
  };

  const reject = async (r: Row) => {
    setBusy(r.id);
    try {
      await billingService.rejectPayment(r.id, "Payment could not be verified. Please contact support.");
      toast({ title: "Payment rejected" });
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally { setBusy(null); }
  };

  return (
    <>
      <SEO title="Admin · Payments" description="Verify subscription payments." />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 h-14 flex items-center gap-2 border-b bg-background/95 backdrop-blur px-3 md:px-6">
              <SidebarTrigger />
              <h1 className="flex-1 font-heading text-base md:text-lg font-semibold truncate">Payment Verification</h1>
              <NotificationBell />
              <ThemeToggle />
            </header>
            <main className="flex-1 p-4 md:p-6 space-y-3 max-w-4xl w-full mx-auto">
              {loading ? (
                <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></>
              ) : isAdmin === false ? (
                <div className="rounded-xl border bg-card p-10 text-center space-y-2">
                  <ShieldAlert className="h-9 w-9 mx-auto text-muted-foreground/50" />
                  <p className="font-medium text-sm">Admin access required</p>
                </div>
              ) : rows.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center space-y-2">
                  <Receipt className="h-9 w-9 mx-auto text-muted-foreground/40" />
                  <p className="font-medium text-sm">No payments submitted yet</p>
                </div>
              ) : rows.map((r) => (
                <div key={r.id} className="rounded-xl border bg-card p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold">
                      {plans[r.plan_id || ""] || "—"} · {r.billing_cycle} · {formatBDT(Number(r.amount))}
                    </p>
                    <p className="text-[11px] text-muted-foreground break-all">
                      {r.invoice_number} · {r.payment_method} · TrxID {r.transaction_id} · from {r.sender_number}
                    </p>
                    <p className="text-[11px] text-muted-foreground break-all">
                      user {r.user_id} · {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{r.status}</Badge>
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" disabled={busy === r.id} onClick={() => approve(r)}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Verify
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => reject(r)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
