import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Check, Cpu, Loader2, RefreshCw, ShieldAlert, X, Database, Users, FolderOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import AgentConsole, { callAgent, STATUS_TONE } from "@/components/agent/AgentConsole";

type Task = { id: string; agent_type: string; objective: string; status: string; risk_level: string; created_at: string; result: string | null; error: string | null };
type Step = { id: string; task_id: string; agent_type: string; kind: string; tool: string | null; target: string | null; risk_level: string | null; status: string; error: string | null; created_at: string; input_summary: unknown; result_summary: unknown };
type Approval = { id: string; task_id: string; tool: string; tool_input: Record<string, unknown>; risk_level: string; reason: string | null; status: string; created_at: string };

const time = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const Tone = ({ s }: { s: string }) => <Badge variant="secondary" className={`text-[10px] ${STATUS_TONE[s] || ""}`}>{s.replace("_", " ")}</Badge>;

export default function AdminAgentPage() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [health, setHealth] = useState<Record<string, any> | null>(null);
  const [q, setQ] = useState("");
  const [deciding, setDeciding] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const load = useCallback(async () => {
    const [t, a, s] = await Promise.all([
      supabase.from("agent_tasks").select("id, agent_type, objective, status, risk_level, created_at, result, error").order("created_at", { ascending: false }).limit(50),
      supabase.from("agent_approvals").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("agent_steps").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    setTasks((t.data as Task[]) || []); setApprovals((a.data as Approval[]) || []); setSteps((s.data as Step[]) || []);
  }, []);
  const loadHealth = useCallback(async () => { try { setHealth(await callAgent({ action: "health" })); } catch (e) { toast.error((e as Error).message); } }, []);
  useEffect(() => { if (isAdmin) { load(); loadHealth(); } }, [isAdmin, load, loadHealth]);

  const decide = async (id: string, action: "approve" | "reject") => {
    setDeciding(id);
    try { const r = await callAgent({ action, approval_id: id }); toast[r.status === "failed" ? "error" : "success"](`Task ${r.status}`); }
    catch (e) { toast.error((e as Error).message); }
    finally { setDeciding(null); load(); }
  };

  const audit = useMemo(() => { const s = q.toLowerCase(); return steps.filter((x) => !s || [x.tool, x.kind, x.target, x.status, x.error, x.agent_type].some((v) => v?.toLowerCase().includes(s))); }, [steps, q]);
  const active = tasks.filter((t) => ["planning", "executing", "awaiting_approval", "verifying"].includes(t.status));

  if (!loading && !user) return <Navigate to="/auth" replace />;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  const HealthCard = ({ icon: I, label, value, warn }: { icon: any; label: string; value: any; warn?: boolean }) => (
    <Card className="p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><I className="h-3.5 w-3.5" />{label}</p><p className={`font-heading font-semibold text-lg ${warn ? "text-destructive" : ""}`}>{value ?? "—"}</p></Card>
  );

  return (
    <SidebarProvider>
      <SEO title="AI Operations Control Center — CivilOS AI" description="Admin agent control center" />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger />
              <h1 className="font-heading font-semibold flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> AI Operations Control Center</h1>
            </div>
            <div className="flex items-center gap-2"><Button size="sm" variant="ghost" onClick={() => { load(); loadHealth(); }}><RefreshCw className="h-4 w-4" /></Button><ThemeToggle /></div>
          </header>
          {isAdmin === null ? <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
          <main className="p-4 md:p-6 space-y-4 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <HealthCard icon={Database} label="Database" value={health ? `${health.database} · ${health.db_response_ms}ms` : null} warn={health?.database !== "ok" && !!health} />
              <HealthCard icon={Users} label="Users" value={health?.users} />
              <HealthCard icon={FolderOpen} label="Projects" value={health?.projects} />
              <HealthCard icon={AlertTriangle} label="Agent failures 24h" value={health ? `${health.agent_failures_24h} / ${health.agent_tasks_24h}` : null} warn={!!health?.agent_failures_24h} />
              <HealthCard icon={ShieldAlert} label="Pending approvals" value={approvals.length} warn={approvals.length > 0} />
            </div>

            <Tabs defaultValue="command">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="command">Command Center</TabsTrigger>
                <TabsTrigger value="tasks">Tasks ({active.length} active)</TabsTrigger>
                <TabsTrigger value="approvals">Approvals {approvals.length > 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">{approvals.length}</Badge>}</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
              </TabsList>

              <TabsContent value="command">
                <AgentConsole agentType="admin" onTask={load} examples={["Website slow hocche? System health check koro", "Recent errors dekhao", "Search user zobaer", "Database e kon table gulo ache?"]} />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-2">
                {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
                {tasks.map((t) => (
                  <Card key={t.id} className="p-3">
                    <button className="w-full text-left flex items-start justify-between gap-3" onClick={() => setOpenTask(openTask === t.id ? null : t.id)}>
                      <div className="min-w-0"><p className="text-sm font-medium truncate">{t.objective}</p><p className="text-xs text-muted-foreground">{t.agent_type} agent · {time(t.created_at)} · risk {t.risk_level}</p></div>
                      <Tone s={t.status} />
                    </button>
                    {openTask === t.id && (
                      <ol className="mt-3 border-l pl-4 space-y-2">
                        {steps.filter((s) => s.task_id === t.id).reverse().map((s) => (
                          <li key={s.id} className="text-xs">
                            <span className="font-medium">{s.kind}</span>{s.tool && <> · <code>{s.tool}</code></>}{s.target && <> → {s.target}</>} <span className={s.status === "error" ? "text-destructive" : "text-muted-foreground"}>({s.status}{s.error ? `: ${s.error}` : ""})</span>
                            <span className="text-muted-foreground"> · {time(s.created_at)}</span>
                          </li>
                        ))}
                        {(t.result || t.error) && <li className="text-xs whitespace-pre-wrap text-muted-foreground">{t.error || t.result}</li>}
                      </ol>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="approvals" className="space-y-2">
                {approvals.length === 0 && <p className="text-sm text-muted-foreground">No actions are waiting for approval.</p>}
                {approvals.map((a) => (
                  <Card key={a.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2"><p className="font-medium text-sm">Agent wants to: <code>{a.tool}</code></p><Badge variant="destructive">{a.risk_level}</Badge></div>
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                    <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">{JSON.stringify(a.tool_input, null, 2)}</pre>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={deciding === a.id} onClick={() => decide(a.id, "approve")}><Check className="h-4 w-4 mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" disabled={deciding === a.id} onClick={() => decide(a.id, "reject")}><X className="h-4 w-4 mr-1" />Reject</Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="audit" className="space-y-2">
                <Input placeholder="Search tool, status, target…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
                <Card className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground"><tr className="border-b">{["Time", "Agent", "Step", "Tool", "Target", "Risk", "Status"].map((h) => <th key={h} className="text-left p-2 font-medium">{h}</th>)}</tr></thead>
                    <tbody>{audit.map((s) => (
                      <tr key={s.id} className="border-b last:border-0"><td className="p-2 whitespace-nowrap">{time(s.created_at)}</td><td className="p-2">{s.agent_type}</td><td className="p-2">{s.kind}</td><td className="p-2"><code>{s.tool || "—"}</code></td><td className="p-2 max-w-[160px] truncate">{s.target || "—"}</td><td className="p-2">{s.risk_level || "—"}</td><td className={`p-2 ${s.status === "error" ? "text-destructive" : ""}`}>{s.status}{s.error ? ` — ${s.error}` : ""}</td></tr>
                    ))}</tbody>
                  </table>
                </Card>
              </TabsContent>

              <TabsContent value="automation">
                <Card className="p-6 text-sm text-muted-foreground flex items-start gap-3"><Activity className="h-5 w-5 text-primary shrink-0" />
                  <div>Scheduled and event-triggered automations (daily health check, error-rate alerts, milestone notifications) are planned for the next phase. They will run on the server without needing this page open, each with an owner, on/off switch, retry limit and history.</div>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
