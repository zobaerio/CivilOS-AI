import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Hammer, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";

interface SiteLog {
  id: string;
  log_date: string;
  weather: string | null;
  activities: string | null;
  issues: string | null;
  manpower: { role: string; count: number }[];
  materials: { name: string; qty: string }[];
}

export default function SiteDiaryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SiteLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState("Sunny");
  const [activities, setActivities] = useState("");
  const [issues, setIssues] = useState("");
  const [manpower, setManpower] = useState<{ role: string; count: number }[]>([{ role: "Mason", count: 0 }]);
  const [materials, setMaterials] = useState<{ name: string; qty: string }[]>([{ name: "Cement (bag)", qty: "" }]);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("site_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(30);
    setLogs((data ?? []) as unknown as SiteLog[]);
    setLoading(false);
  };
  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("site_logs").insert({
      user_id: user.id,
      log_date: logDate,
      weather, activities, issues,
      manpower: manpower.filter(m => m.role && m.count > 0),
      materials: materials.filter(m => m.name && m.qty),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Site log saved");
    setActivities(""); setIssues("");
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("site_logs").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <SidebarProvider>
      <SEO title="Site Diary — CivilOS AI" description="Daily site log with manpower, materials, activities and issues tracking." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger /><h1 className="font-heading font-semibold flex items-center gap-2"><Hammer className="h-4 w-4 text-accent" /> Site Diary</h1></div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto space-y-4">
            <Card className="p-4 space-y-3">
              <h2 className="font-semibold">New entry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Date</label><Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} /></div>
                <div><label className="text-xs text-muted-foreground">Weather</label><Input value={weather} onChange={(e) => setWeather(e.target.value)} /></div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Manpower</label>
                {manpower.map((m, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input placeholder="Role" value={m.role} onChange={(e) => { const c = [...manpower]; c[i].role = e.target.value; setManpower(c); }} />
                    <Input type="number" className="w-24" placeholder="Count" value={m.count || ""} onChange={(e) => { const c = [...manpower]; c[i].count = +e.target.value; setManpower(c); }} />
                    <Button size="icon" variant="ghost" onClick={() => setManpower(manpower.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setManpower([...manpower, { role: "", count: 0 }])}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Materials used</label>
                {materials.map((m, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input placeholder="Material" value={m.name} onChange={(e) => { const c = [...materials]; c[i].name = e.target.value; setMaterials(c); }} />
                    <Input className="w-32" placeholder="Quantity" value={m.qty} onChange={(e) => { const c = [...materials]; c[i].qty = e.target.value; setMaterials(c); }} />
                    <Button size="icon" variant="ghost" onClick={() => setMaterials(materials.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setMaterials([...materials, { name: "", qty: "" }])}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>

              <div><label className="text-xs text-muted-foreground">Activities</label><Textarea rows={3} value={activities} onChange={(e) => setActivities(e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground">Issues / delays</label><Textarea rows={2} value={issues} onChange={(e) => setIssues(e.target.value)} /></div>

              <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</> : "Save log"}</Button>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3">Recent logs</h2>
              {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
                logs.length === 0 ? <p className="text-sm text-muted-foreground">No logs yet.</p> :
                <div className="space-y-2">
                  {logs.map(l => (
                    <div key={l.id} className="border rounded p-3 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{l.log_date} · {l.weather}</p>
                          {l.activities && <p className="text-muted-foreground mt-1">{l.activities}</p>}
                          {l.issues && <p className="text-destructive text-xs mt-1">⚠ {l.issues}</p>}
                          <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                            <span>Manpower: {l.manpower?.length ?? 0}</span>
                            <span>Materials: {l.materials?.length ?? 0}</span>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => del(l.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
