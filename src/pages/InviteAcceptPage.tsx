import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function InviteAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => {
    if (!token) return;
    if (loading) return;
    if (!user) { nav(`/auth?redirect=/invite?token=${token}`); return; }
    const { data } = await (supabase as any).from("invitations").select("*, projects(name)").eq("token", token).maybeSingle();
    if (!data) toast.error("Invitation not found or expired");
    setInvite(data);
  })(); }, [token, user, loading]);

  const accept = async () => {
    if (!invite || !user) return;
    setBusy(true);
    const { error: e1 } = await (supabase as any).from("project_members").insert({
      project_id: invite.project_id, user_id: user.id, role: invite.role, invited_by: invite.invited_by, status: "accepted",
    });
    if (e1) { toast.error(e1.message); setBusy(false); return; }
    await (supabase as any).from("invitations").update({ status:"accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id);
    await supabase.from("notifications").insert({
      user_id: invite.invited_by, type: "member_joined",
      title: "নতুন সদস্য যোগ দিয়েছে",
      message: `${user.email} প্রজেক্টে যোগ দিয়েছে`,
    } as any);
    toast.success("যোগদান সফল");
    nav(`/projects/${invite.project_id}`);
  };

  const reject = async () => {
    await (supabase as any).from("invitations").update({ status:"rejected" }).eq("id", invite.id);
    nav("/projects");
  };

  if (loading || !invite) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16">
        <Card className="max-w-md w-full"><CardContent className="pt-6 space-y-4 text-center">
          <h1 className="font-heading text-xl font-bold">Project Invitation</h1>
          <p className="text-sm text-muted-foreground">
            আপনাকে <b>{invite.projects?.name}</b> প্রজেক্টে <b>{invite.role}</b> হিসাবে যোগদানের জন্য আমন্ত্রণ জানানো হয়েছে।
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={reject}>Reject</Button>
            <Button onClick={accept} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : "Accept"}</Button>
          </div>
        </CardContent></Card>
      </main>
      <Footer />
    </div>
  );
}
