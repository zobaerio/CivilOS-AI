import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bell, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200);
    setItems(data || []); setLoading(false);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
    load();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl md:text-3xl font-bold">Notifications</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild><Link to="/settings/notifications">Settings</Link></Button>
              <Button size="sm" onClick={markAll}><Check className="h-4 w-4"/>Mark all read</Button>
            </div>
          </div>
          {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto"/> :
            items.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground"><Bell className="h-8 w-8 mx-auto mb-2 opacity-30"/>এখনো কোন notification নেই</CardContent></Card> :
            <div className="border rounded-lg divide-y">
              {items.map(n => (
                <div key={n.id} className={`p-4 flex gap-3 ${!n.read ? "bg-accent/5" : ""}`}>
                  <div className={`h-2 w-2 rounded-full mt-2 ${!n.read ? "bg-accent" : "bg-muted"}`}/>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })} · {n.type}</p>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
