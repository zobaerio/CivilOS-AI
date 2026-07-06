import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const TYPES = [
  { key: "deadline_alerts", label: "Project deadline alerts" },
  { key: "team_invites", label: "Team invitations" },
  { key: "member_joined", label: "Member joined project" },
  { key: "boq_updates", label: "BOQ updates" },
  { key: "material_price", label: "Material price alerts" },
  { key: "document_uploads", label: "Document uploads" },
  { key: "email_enabled", label: "Send email notifications" },
];

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [s, setS] = useState<any>(null);

  useEffect(() => { (async () => {
    if (!user) return;
    let { data } = await (supabase as any).from("notification_settings").select("*").eq("user_id", user.id).maybeSingle();
    if (!data) {
      const { data: n } = await (supabase as any).from("notification_settings").insert({ user_id: user.id }).select().single();
      data = n;
    }
    setS(data);
  })(); }, [user]);

  const update = async (patch: any) => {
    setS({ ...s, ...patch });
    const { error } = await (supabase as any).from("notification_settings").update(patch).eq("user_id", user!.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container max-w-2xl space-y-4">
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Notification Settings</h1>
          {!s ? <p>Loading…</p> : (
            <Card><CardContent className="pt-6 space-y-4">
              {TYPES.map(t => (
                <div key={t.key} className="flex items-center justify-between">
                  <Label>{t.label}</Label>
                  <Switch checked={!!s[t.key]} onCheckedChange={(v)=>update({[t.key]: v})}/>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <Label>Deadline reminder</Label>
                <Select value={String(s.deadline_days_before)} onValueChange={v=>update({deadline_days_before: Number(v)})}>
                  <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="1">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent></Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
