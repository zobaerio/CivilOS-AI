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
  const [error, setError] = useState("");

  useEffect(() => { (async () => {
    if (!token) { setError("Invitation link is invalid."); return; }
    if (loading) return;
    if (!user) { nav(`/auth?redirect=/invite?token=${token}`); return; }
    const { data } = await (supabase as any).from("invitations").select("*, projects(name)").eq("token", token).maybeSingle();
    if (!data) { setError("Invitation not found, expired, or assigned to another email."); return; }
    setInvite(data);
  })(); }, [token, user, loading, nav]);

  const accept = async () => {
    if (!invite || !user) return;
    setBusy(true);
    const { data: projectId, error: acceptError } = await (supabase as any).rpc("accept_project_invitation", { _token: token });
    if (acceptError || !projectId) { toast.error(acceptError?.message || "Could not accept invitation"); setBusy(false); return; }
    toast.success("যোগদান সফল");
    nav(`/projects/${projectId}`);
  };

  const reject = async () => {
    if (!token) return;
    const { error: declineError } = await (supabase as any).rpc("decline_project_invitation", { _token: token });
    if (declineError) { toast.error(declineError.message); return; }
    nav("/projects");
  };

  if (loading || (!invite && !error)) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="max-w-md"><CardContent className="pt-6 text-center space-y-4"><h1 className="text-xl font-bold">Invitation unavailable</h1><p className="text-sm text-muted-foreground">{error}</p><Button onClick={() => nav("/projects")}>Go to projects</Button></CardContent></Card></div>;

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
