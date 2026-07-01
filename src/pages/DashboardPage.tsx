import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderOpen, Plus, TrendingUp, Layers, Activity, ArrowRight, Sparkles,
  Calculator, FileText, Hammer, Search, Upload, Receipt, Bot, ClipboardList,
  Crown,
} from "lucide-react";
import SEO from "@/components/SEO";

interface ProjectRow {
  id: string;
  name: string;
  file_name: string | null;
  updated_at: string;
}

const quickActions = [
  { icon: Plus, label: "New Project", to: "/upload" },
  { icon: Calculator, label: "New BOQ", to: "/boq" },
  { icon: Bot, label: "AI Chat", to: "/ai-assistant" },
  { icon: Upload, label: "Upload File", to: "/file-assistant" },
  { icon: Hammer, label: "Site Report", to: "/site-diary" },
  { icon: Receipt, label: "New Invoice", to: "/invoices" },
];

const upcomingModules = [
  { icon: Sparkles, name: "AI Engineering Chat", desc: "Ask any civil engineering question", to: "/ai-assistant" },
  { icon: Calculator, name: "BOQ Generator", desc: "Auto BOQ + rate analysis", to: "/boq" },
  { icon: FileText, name: "Tender Analysis", desc: "AI-powered tender summaries", to: "/tender" },
  { icon: Hammer, name: "Site Diary", desc: "Daily progress & material logs", to: "/site-diary" },
];

const DashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, file_name, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5);
      setProjects((data as ProjectRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Engineer";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const stats = [
    { label: "Active Projects", value: projects.length, icon: FolderOpen, color: "text-blue-500" },
    { label: "BOQs Generated", value: projects.length, icon: Calculator, color: "text-emerald-500" },
    { label: "AI Queries Today", value: 0, icon: Sparkles, color: "text-purple-500" },
    { label: "Pending Tasks", value: 0, icon: ClipboardList, color: "text-amber-500" },
  ];

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/projects?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      <SEO title="Dashboard" description="CivilOS AI workspace — manage projects, estimates, and engineering modules." />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 h-14 flex items-center gap-2 border-b bg-background/95 backdrop-blur px-3 md:px-6">
              <SidebarTrigger />
              <form onSubmit={onSearch} className="relative flex-1 max-w-md hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects, BOQ, tenders…"
                  className="pl-8 h-9 text-sm"
                />
              </form>
              <div className="flex-1 sm:hidden" />
              <Button size="sm" variant="outline" asChild className="hidden md:inline-flex gap-1.5">
                <Link to="/#pricing"><Crown className="h-3.5 w-3.5 text-amber-500" /> Upgrade</Link>
              </Button>
              <NotificationBell />
              <ThemeToggle />
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/upload"><Plus className="h-4 w-4 mr-1" /> New</Link>
              </Button>
            </header>

            <main className="flex-1 p-4 md:p-6 space-y-6 overflow-x-hidden">
              {/* Hero card */}
              <section className="rounded-2xl border bg-gradient-to-br from-primary/5 via-accent/5 to-background p-5 md:p-8">
                <div className="max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 text-accent px-3 py-1 text-xs font-medium">
                    <Sparkles className="h-3 w-3" /> CivilOS AI Platform
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold">
                    The AI Operating System for Civil Engineers
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Manage projects, estimates, BNBC loads, tenders, BOQ and site activities — all in one workspace.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild><Link to="/upload">Start New Project <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
                    <Button variant="outline" asChild><Link to="/projects">View All Projects</Link></Button>
                  </div>
                </div>
              </section>

              {/* Stats */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className="font-heading text-2xl md:text-3xl font-bold">{s.value}</p>
                  </div>
                ))}
              </section>

              {/* Project management section */}
              <section className="rounded-xl border bg-card">
                <div className="flex items-center justify-between p-4 md:p-5 border-b">
                  <div>
                    <h3 className="font-heading text-base md:text-lg font-semibold">Recent Projects</h3>
                    <p className="text-xs text-muted-foreground">Your latest estimates & BNBC reports</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/projects">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                </div>
                <div className="p-4 md:p-5">
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                      <p className="font-medium text-sm">No projects yet</p>
                      <p className="text-xs text-muted-foreground">Upload a design to get started.</p>
                      <Button size="sm" asChild><Link to="/upload"><Plus className="h-4 w-4 mr-1" /> Create Project</Link></Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {projects.map((p) => (
                        <Link
                          key={p.id}
                          to="/projects"
                          className="block rounded-lg border bg-background p-4 hover:border-accent hover:shadow-sm transition-all"
                        >
                          <p className="font-semibold text-sm truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{p.file_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Updated {new Date(p.updated_at).toLocaleDateString()}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Upcoming modules */}
              <section className="rounded-xl border bg-card p-4 md:p-5 space-y-4">
                <div>
                  <h3 className="font-heading text-base md:text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" /> Coming Soon
                  </h3>
                  <p className="text-xs text-muted-foreground">More modules rolling out across the platform</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {upcomingModules.map((m) => (
                    <div key={m.name} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                      <m.icon className="h-5 w-5 text-accent" />
                      <p className="text-sm font-semibold leading-tight">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default DashboardPage;
