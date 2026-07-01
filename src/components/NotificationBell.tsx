import { useEffect, useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";

interface Notif {
  id: string; type: string; title: string; message: string | null;
  link: string | null; read: boolean; created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications")
      .select("*").order("created_at", { ascending: false }).limit(30);
    setItems((data as Notif[]) || []);
  };

  useEffect(() => { load(); }, [user]);
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    load();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : items.map((n) => (
            <div key={n.id} className={`py-3 flex gap-3 ${!n.read ? "bg-accent/5 -mx-2 px-2 rounded" : ""}`}>
              <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${!n.read ? "bg-accent" : "bg-muted"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{n.title}</p>
                {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })} · {n.type}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(n.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
