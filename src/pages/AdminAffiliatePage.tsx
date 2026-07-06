import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AdminAffiliatePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => { (async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).eq("role","admin").maybeSingle();
    if (!data) { toast.error("Admin only"); nav("/"); return; }
    setIsAdmin(true);
    load();
  })(); }, [user]);

  const load = async () => {
    const { data } = await (supabase as any).from("withdrawals").select("*").order("requested_at",{ascending:false});
    setWithdrawals(data || []);
    setTotalPaid((data||[]).filter((w:any)=>w.status==="paid").reduce((s:number,w:any)=>s+Number(w.amount),0));
  };

  const markPaid = async (id: string) => {
    await (supabase as any).from("withdrawals").update({ status:"paid", paid_at: new Date().toISOString() }).eq("id", id);
    toast.success("Marked as paid"); load();
  };
  const approve = async (id: string) => {
    await (supabase as any).from("withdrawals").update({ status:"approved" }).eq("id", id);
    load();
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container max-w-5xl space-y-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Affiliate Admin</h1>
          <Card><CardHeader><CardTitle className="text-sm">Total Commission Paid</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">৳{totalPaid.toLocaleString()}</CardContent></Card>
          <Card><CardHeader><CardTitle>Withdrawal Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded-lg divide-y">
                {withdrawals.length===0 ? <p className="p-6 text-center text-sm text-muted-foreground">No requests</p> :
                  withdrawals.map(w => (
                    <div key={w.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">৳{Number(w.amount).toLocaleString()} · {w.method}</p>
                        <p className="text-xs text-muted-foreground">{w.account_number} · {new Date(w.requested_at).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">User: {w.user_id.slice(0,8)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{w.status}</Badge>
                        {w.status==="pending" && <Button size="sm" variant="outline" onClick={()=>approve(w.id)}>Approve</Button>}
                        {w.status!=="paid" && <Button size="sm" onClick={()=>markPaid(w.id)}>Mark Paid</Button>}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
