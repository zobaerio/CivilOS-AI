import { useEffect, useMemo, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Plus, Trash2, Download, Save, Loader2, RotateCcw,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Row = { name: string; qty: number; unit: string; rate: number };
type Analysis = {
  id: string;
  type: string;
  unit: string;      // per-unit basis (CUM / SFT / RFT ...)
  materials: Row[];
  labour: Row[];
  equipment: Row[];
  overheadPct: number;
  profitPct: number;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const bdt = (n: number) => `৳ ${(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981"];

// ---------- Bangladesh default catalog (per 1 unit) ----------
const CATALOG: Record<string, Omit<Analysis, "id">> = {
  "RCC Work (1:1.5:3) — Column/Beam/Slab": {
    type: "RCC Work (1:1.5:3) — Column/Beam/Slab", unit: "CUM",
    materials: [
      { name: "Cement (OPC)", qty: 8.0, unit: "bag", rate: 560 },
      { name: "Sand (FM 2.5)", qty: 14, unit: "cft", rate: 55 },
      { name: "Stone chips ¾″", qty: 28, unit: "cft", rate: 220 },
      { name: "MS Rod 60 grade", qty: 110, unit: "kg", rate: 95 },
      { name: "Shuttering (ply+timber)", qty: 1, unit: "lot", rate: 900 },
    ],
    labour: [
      { name: "Mason", qty: 1.2, unit: "day", rate: 950 },
      { name: "Rod binder", qty: 1.5, unit: "day", rate: 900 },
      { name: "Helper", qty: 3.0, unit: "day", rate: 650 },
    ],
    equipment: [
      { name: "Concrete mixer", qty: 0.3, unit: "day", rate: 1500 },
      { name: "Vibrator", qty: 0.3, unit: "day", rate: 800 },
    ],
    overheadPct: 10, profitPct: 10,
  },
  "RCC Footing (1:2:4)": {
    type: "RCC Footing (1:2:4)", unit: "CUM",
    materials: [
      { name: "Cement", qty: 6.5, unit: "bag", rate: 560 },
      { name: "Sand", qty: 15, unit: "cft", rate: 55 },
      { name: "Stone chips", qty: 30, unit: "cft", rate: 220 },
      { name: "MS Rod", qty: 80, unit: "kg", rate: 95 },
    ],
    labour: [
      { name: "Mason", qty: 1.0, unit: "day", rate: 950 },
      { name: "Helper", qty: 2.5, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Mixer", qty: 0.25, unit: "day", rate: 1500 }],
    overheadPct: 10, profitPct: 10,
  },
  "Brickwork 1st class (1:4)": {
    type: "Brickwork 1st class (1:4)", unit: "CUM",
    materials: [
      { name: "1st class bricks", qty: 500, unit: "nos", rate: 12 },
      { name: "Cement", qty: 2.5, unit: "bag", rate: 560 },
      { name: "Sand (local)", qty: 12, unit: "cft", rate: 45 },
    ],
    labour: [
      { name: "Mason", qty: 0.9, unit: "day", rate: 950 },
      { name: "Helper", qty: 1.8, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Scaffolding", qty: 1, unit: "lot", rate: 120 }],
    overheadPct: 8, profitPct: 10,
  },
  "Brickwork (1:6)": {
    type: "Brickwork (1:6)", unit: "CUM",
    materials: [
      { name: "Bricks", qty: 500, unit: "nos", rate: 11 },
      { name: "Cement", qty: 1.7, unit: "bag", rate: 560 },
      { name: "Sand", qty: 12, unit: "cft", rate: 45 },
    ],
    labour: [
      { name: "Mason", qty: 0.9, unit: "day", rate: 950 },
      { name: "Helper", qty: 1.8, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Scaffolding", qty: 1, unit: "lot", rate: 100 }],
    overheadPct: 8, profitPct: 10,
  },
  "Plaster 12 mm (1:4)": {
    type: "Plaster 12 mm (1:4)", unit: "SFT",
    materials: [
      { name: "Cement", qty: 0.035, unit: "bag", rate: 560 },
      { name: "Sand", qty: 0.15, unit: "cft", rate: 45 },
    ],
    labour: [
      { name: "Mason", qty: 0.02, unit: "day", rate: 950 },
      { name: "Helper", qty: 0.03, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Scaffolding", qty: 1, unit: "sft", rate: 2 }],
    overheadPct: 8, profitPct: 8,
  },
  "Plaster 20 mm (1:6)": {
    type: "Plaster 20 mm (1:6)", unit: "SFT",
    materials: [
      { name: "Cement", qty: 0.05, unit: "bag", rate: 560 },
      { name: "Sand", qty: 0.22, unit: "cft", rate: 45 },
    ],
    labour: [
      { name: "Mason", qty: 0.025, unit: "day", rate: 950 },
      { name: "Helper", qty: 0.04, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Scaffolding", qty: 1, unit: "sft", rate: 2.5 }],
    overheadPct: 8, profitPct: 8,
  },
  "Emulsion Paint (2 coats + primer)": {
    type: "Emulsion Paint (2 coats + primer)", unit: "SFT",
    materials: [
      { name: "Primer", qty: 0.01, unit: "ltr", rate: 320 },
      { name: "Emulsion paint", qty: 0.02, unit: "ltr", rate: 480 },
      { name: "Putty", qty: 0.05, unit: "kg", rate: 60 },
    ],
    labour: [
      { name: "Painter", qty: 0.015, unit: "day", rate: 850 },
      { name: "Helper", qty: 0.015, unit: "day", rate: 600 },
    ],
    equipment: [{ name: "Brushes/rollers", qty: 1, unit: "sft", rate: 0.5 }],
    overheadPct: 6, profitPct: 10,
  },
  "Distemper Paint": {
    type: "Distemper Paint", unit: "SFT",
    materials: [
      { name: "Distemper", qty: 0.02, unit: "kg", rate: 220 },
      { name: "Putty", qty: 0.04, unit: "kg", rate: 55 },
    ],
    labour: [
      { name: "Painter", qty: 0.012, unit: "day", rate: 750 },
      { name: "Helper", qty: 0.012, unit: "day", rate: 550 },
    ],
    equipment: [{ name: "Brush", qty: 1, unit: "sft", rate: 0.3 }],
    overheadPct: 5, profitPct: 8,
  },
  "Enamel Paint (metal/wood)": {
    type: "Enamel Paint (metal/wood)", unit: "SFT",
    materials: [
      { name: "Primer", qty: 0.012, unit: "ltr", rate: 380 },
      { name: "Enamel paint", qty: 0.025, unit: "ltr", rate: 620 },
    ],
    labour: [
      { name: "Painter", qty: 0.02, unit: "day", rate: 900 },
      { name: "Helper", qty: 0.02, unit: "day", rate: 600 },
    ],
    equipment: [{ name: "Brushes", qty: 1, unit: "sft", rate: 0.5 }],
    overheadPct: 6, profitPct: 10,
  },
  "Excavation — Manual (soft soil)": {
    type: "Excavation — Manual (soft soil)", unit: "CUM",
    materials: [],
    labour: [
      { name: "Digger (labour)", qty: 0.35, unit: "day", rate: 650 },
      { name: "Supervisor", qty: 0.02, unit: "day", rate: 1200 },
    ],
    equipment: [{ name: "Tools & tackle", qty: 1, unit: "cum", rate: 40 }],
    overheadPct: 6, profitPct: 8,
  },
  "Excavation — Machine (hard soil)": {
    type: "Excavation — Machine (hard soil)", unit: "CUM",
    materials: [],
    labour: [
      { name: "Operator asst.", qty: 0.05, unit: "day", rate: 700 },
      { name: "Supervisor", qty: 0.02, unit: "day", rate: 1200 },
    ],
    equipment: [
      { name: "Excavator", qty: 0.02, unit: "hr", rate: 2500 },
      { name: "Fuel", qty: 0.7, unit: "ltr", rate: 108 },
    ],
    overheadPct: 8, profitPct: 10,
  },
  "Floor Tile Work (600×600 vitrified)": {
    type: "Floor Tile Work (600×600 vitrified)", unit: "SFT",
    materials: [
      { name: "Vitrified tile", qty: 1.05, unit: "sft", rate: 85 },
      { name: "Cement", qty: 0.05, unit: "bag", rate: 560 },
      { name: "Sand", qty: 0.15, unit: "cft", rate: 45 },
      { name: "Tile adhesive/grout", qty: 0.05, unit: "kg", rate: 45 },
    ],
    labour: [
      { name: "Tiles mason", qty: 0.04, unit: "day", rate: 1000 },
      { name: "Helper", qty: 0.05, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Cutter", qty: 1, unit: "sft", rate: 1 }],
    overheadPct: 8, profitPct: 10,
  },
  "Wall Tile Work (ceramic)": {
    type: "Wall Tile Work (ceramic)", unit: "SFT",
    materials: [
      { name: "Ceramic wall tile", qty: 1.05, unit: "sft", rate: 55 },
      { name: "Cement", qty: 0.06, unit: "bag", rate: 560 },
      { name: "Sand", qty: 0.15, unit: "cft", rate: 45 },
    ],
    labour: [
      { name: "Tiles mason", qty: 0.05, unit: "day", rate: 1000 },
      { name: "Helper", qty: 0.06, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Cutter/scaffold", qty: 1, unit: "sft", rate: 1.5 }],
    overheadPct: 8, profitPct: 10,
  },
  "Waterproofing (SBR + cement slurry)": {
    type: "Waterproofing (SBR + cement slurry)", unit: "SFT",
    materials: [
      { name: "SBR latex", qty: 0.05, unit: "ltr", rate: 380 },
      { name: "Cement", qty: 0.03, unit: "bag", rate: 560 },
      { name: "Waterproof chemical", qty: 0.05, unit: "kg", rate: 220 },
    ],
    labour: [
      { name: "Applicator", qty: 0.02, unit: "day", rate: 950 },
      { name: "Helper", qty: 0.02, unit: "day", rate: 650 },
    ],
    equipment: [{ name: "Brush/roller", qty: 1, unit: "sft", rate: 0.8 }],
    overheadPct: 8, profitPct: 12,
  },
};

const CATALOG_KEYS = Object.keys(CATALOG);
const newAnalysis = (key: string): Analysis => ({ id: uid(), ...structuredClone(CATALOG[key]) });

// ---------- component ----------
export default function RateAnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>("local");
  const [setName, setSetName] = useState("My rate set");
  const [analyses, setAnalyses] = useState<Analysis[]>([newAnalysis(CATALOG_KEYS[0])]);
  const [activeId, setActiveId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);
  useEffect(() => { setActiveId(analyses[0]?.id ?? ""); }, [analyses.length === 0]);

  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name, estimate").order("updated_at", { ascending: false })
      .then(({ data }) => setProjects(data ?? []));
    // load local backup
    const raw = localStorage.getItem("civilos_rate_analysis");
    if (raw) try { const p = JSON.parse(raw); if (p.analyses?.length) { setAnalyses(p.analyses); setSetName(p.setName ?? "My rate set"); } } catch {}
  }, [user]);

  useEffect(() => {
    localStorage.setItem("civilos_rate_analysis", JSON.stringify({ setName, analyses }));
  }, [setName, analyses]);

  const active = analyses.find(a => a.id === activeId) ?? analyses[0];

  // ---------- totals ----------
  const sum = (rows: Row[]) => rows.reduce((s, r) => s + (r.qty || 0) * (r.rate || 0), 0);
  const totals = useMemo(() => {
    if (!active) return { mat: 0, lab: 0, eq: 0, base: 0, oh: 0, pr: 0, final: 0 };
    const mat = sum(active.materials);
    const lab = sum(active.labour);
    const eq = sum(active.equipment);
    const base = mat + lab + eq;
    const oh = base * (active.overheadPct / 100);
    const pr = (base + oh) * (active.profitPct / 100);
    return { mat, lab, eq, base, oh, pr, final: base + oh + pr };
  }, [active]);

  const pieData = [
    { name: "Material", value: totals.mat },
    { name: "Labour", value: totals.lab },
    { name: "Equipment", value: totals.eq },
    { name: "Overhead + Profit", value: totals.oh + totals.pr },
  ].filter(d => d.value > 0);

  const barData = analyses.map(a => {
    const mat = sum(a.materials), lab = sum(a.labour), eq = sum(a.equipment);
    const base = mat + lab + eq;
    const oh = base * (a.overheadPct / 100);
    const pr = (base + oh) * (a.profitPct / 100);
    return { name: a.type.length > 22 ? a.type.slice(0, 22) + "…" : a.type, rate: Math.round(base + oh + pr), unit: a.unit };
  });

  // ---------- row ops ----------
  const patch = (fn: (a: Analysis) => Analysis) =>
    setAnalyses(list => list.map(a => a.id === active?.id ? fn(a) : a));
  const addRow = (k: "materials" | "labour" | "equipment") =>
    patch(a => ({ ...a, [k]: [...a[k], { name: "", qty: 0, unit: "", rate: 0 }] }));
  const updateRow = (k: "materials" | "labour" | "equipment", i: number, r: Partial<Row>) =>
    patch(a => ({ ...a, [k]: a[k].map((x, idx) => idx === i ? { ...x, ...r } : x) }));
  const removeRow = (k: "materials" | "labour" | "equipment", i: number) =>
    patch(a => ({ ...a, [k]: a[k].filter((_, idx) => idx !== i) }));

  const addAnalysis = (key: string) => {
    const a = newAnalysis(key);
    setAnalyses(list => [...list, a]);
    setActiveId(a.id);
  };
  const removeAnalysis = (id: string) => {
    setAnalyses(list => list.filter(a => a.id !== id));
    if (activeId === id) setActiveId(analyses[0]?.id ?? "");
  };
  const resetActive = () => {
    if (!active) return;
    const key = CATALOG_KEYS.find(k => CATALOG[k].type === active.type) ?? CATALOG_KEYS[0];
    patch(() => ({ id: active.id, ...structuredClone(CATALOG[key]) }));
    toast.success("Reset to Bangladesh market defaults");
  };

  // ---------- save to project ----------
  const saveSet = async () => {
    if (!user) return toast.error("Please sign in");
    if (projectId === "local") return toast.success("Saved locally");
    setSaving(true);
    try {
      const proj = projects.find(p => p.id === projectId);
      const merged = { ...(proj?.estimate ?? {}), __rateSet: { setName, analyses, updatedAt: Date.now() } };
      const { error } = await supabase.from("projects").update({ estimate: merged as any }).eq("id", projectId);
      if (error) throw error;
      toast.success(`Saved to project "${proj?.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };
  const loadFromProject = (id: string) => {
    setProjectId(id);
    if (id === "local") return;
    const proj = projects.find(p => p.id === id);
    const rs = proj?.estimate?.__rateSet;
    if (rs?.analyses?.length) { setAnalyses(rs.analyses); setSetName(rs.setName ?? "My rate set"); toast.success("Loaded rate set"); }
    else toast.info("No saved rate set — using current");
  };

  // ---------- PDF ----------
  const exportPDF = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setFontSize(16).text("CivilOS AI — Rate Analysis Report", 40, 40);
    pdf.setFontSize(10).setTextColor(100).text(`${setName} · ${new Date().toLocaleDateString()}`, 40, 58);

    let y = 78;
    for (const a of analyses) {
      const mat = sum(a.materials), lab = sum(a.labour), eq = sum(a.equipment);
      const base = mat + lab + eq;
      const oh = base * (a.overheadPct / 100), pr = (base + oh) * (a.profitPct / 100);
      const final = base + oh + pr;
      pdf.setFontSize(11).setTextColor(20).text(`${a.type}  —  per ${a.unit}`, 40, y); y += 6;
      const groups: [string, Row[]][] = [["Materials", a.materials], ["Labour", a.labour], ["Equipment", a.equipment]];
      for (const [label, rows] of groups) {
        if (!rows.length) continue;
        autoTable(pdf, {
          startY: y + 6,
          head: [[label, "Qty", "Unit", "Rate (৳)", "Amount (৳)"]],
          body: rows.map(r => [r.name, r.qty, r.unit, r.rate.toLocaleString(), (r.qty * r.rate).toLocaleString()]),
          styles: { fontSize: 8 }, headStyles: { fillColor: [30, 64, 175] }, margin: { left: 40, right: 40 },
        });
        // @ts-ignore
        y = (pdf as any).lastAutoTable.finalY + 4;
      }
      autoTable(pdf, {
        startY: y + 4,
        body: [
          ["Material", bdt(mat)], ["Labour", bdt(lab)], ["Equipment", bdt(eq)],
          [`Overhead (${a.overheadPct}%)`, bdt(oh)], [`Profit (${a.profitPct}%)`, bdt(pr)],
          [`FINAL RATE per ${a.unit}`, bdt(final)],
        ],
        styles: { fontSize: 9 }, columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } },
        margin: { left: 40, right: 40 },
      });
      // @ts-ignore
      y = (pdf as any).lastAutoTable.finalY + 18;
      if (y > 720) { pdf.addPage(); y = 40; }
    }
    pdf.save(`RateAnalysis_${setName.replace(/\s+/g, "_")}.pdf`);
  };

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <>
      <SEO title="Rate Analysis Center — CivilOS AI" description="Editable Bangladesh rate analysis for RCC, brickwork, plaster, paint, excavation, tiles and waterproofing." url="/rate-analysis" />
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b flex items-center justify-between px-3 sm:px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger />
                <ClipboardList className="h-4 w-4 text-accent" />
                <h1 className="font-heading text-sm sm:text-base font-bold truncate">Rate Analysis Center</h1>
              </div>
              <ThemeToggle />
            </header>

            <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto space-y-4">
              {/* Top controls */}
              <Card className="p-3 sm:p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Rate set name</Label>
                  <Input value={setName} onChange={e => setSetName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Save to project</Label>
                  <Select value={projectId} onValueChange={loadFromProject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">📁 Local only (browser)</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Add analysis type</Label>
                  <Select value="" onValueChange={addAnalysis}>
                    <SelectTrigger><SelectValue placeholder="＋ Pick a work type…" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {CATALOG_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button className="flex-1" onClick={saveSet} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save
                  </Button>
                  <Button variant="outline" onClick={exportPDF}><Download className="h-4 w-4 mr-1" /> PDF</Button>
                </div>
              </Card>

              {analyses.length === 0 && (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  No analyses. Pick a work type above to begin.
                </Card>
              )}

              {analyses.length > 0 && active && (
                <Tabs value={activeId} onValueChange={setActiveId} className="space-y-3">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <TabsList className="h-auto flex-wrap">
                      {analyses.map(a => (
                        <TabsTrigger key={a.id} value={a.id} className="text-xs">
                          {a.type.length > 30 ? a.type.slice(0, 30) + "…" : a.type}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {analyses.map(a => (
                    <TabsContent key={a.id} value={a.id} className="space-y-4">
                      {/* Summary + charts */}
                      <div className="grid gap-3 lg:grid-cols-3">
                        <Card className="p-4 space-y-2 lg:col-span-1">
                          <p className="text-xs uppercase text-muted-foreground">Final rate per {a.unit}</p>
                          <p className="font-heading font-bold text-3xl text-primary">{bdt(totals.final)}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                            <div><span className="text-muted-foreground">Material:</span> <b>{bdt(totals.mat)}</b></div>
                            <div><span className="text-muted-foreground">Labour:</span> <b>{bdt(totals.lab)}</b></div>
                            <div><span className="text-muted-foreground">Equipment:</span> <b>{bdt(totals.eq)}</b></div>
                            <div><span className="text-muted-foreground">Base:</span> <b>{bdt(totals.base)}</b></div>
                            <div><span className="text-muted-foreground">OH ({a.overheadPct}%):</span> <b>{bdt(totals.oh)}</b></div>
                            <div><span className="text-muted-foreground">Profit ({a.profitPct}%):</span> <b>{bdt(totals.pr)}</b></div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={resetActive}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset</Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => removeAnalysis(a.id)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Remove</Button>
                          </div>
                        </Card>

                        <Card className="p-3 lg:col-span-1">
                          <p className="text-xs font-semibold mb-1">Cost breakdown</p>
                          <div className="h-56">
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} label={(e: any) => `${e.name} ${((e.percent || 0) * 100).toFixed(0)}%`}>
                                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <RTooltip formatter={(v: any) => bdt(Number(v))} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>

                        <Card className="p-3 lg:col-span-1">
                          <p className="text-xs font-semibold mb-1">All work types comparison</p>
                          <div className="h-56">
                            <ResponsiveContainer>
                              <BarChart data={barData} margin={{ left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="name" fontSize={9} interval={0} angle={-20} textAnchor="end" height={50} />
                                <YAxis fontSize={9} />
                                <RTooltip formatter={(v: any, _n: any, p: any) => [bdt(Number(v)) + ` /${p.payload.unit}`, "Rate"]} />
                                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      </div>

                      {/* Per-unit basis controls */}
                      <Card className="p-3 grid gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Unit basis</Label>
                          <Select value={a.unit} onValueChange={v => patch(x => ({ ...x, unit: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["CUM", "SFT", "CFT", "RFT", "SQM", "KG", "NOS"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Overhead %</Label>
                          <Input type="number" value={a.overheadPct} onChange={e => patch(x => ({ ...x, overheadPct: +e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Profit %</Label>
                          <Input type="number" value={a.profitPct} onChange={e => patch(x => ({ ...x, profitPct: +e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input value={a.type} onChange={e => patch(x => ({ ...x, type: e.target.value }))} />
                        </div>
                      </Card>

                      {/* Three editable tables */}
                      {(["materials", "labour", "equipment"] as const).map(kind => (
                        <RowTable key={kind} title={kind}
                          rows={a[kind]}
                          onAdd={() => addRow(kind)}
                          onUpdate={(i, r) => updateRow(kind, i, r)}
                          onRemove={i => removeRow(kind, i)}
                        />
                      ))}

                      <ExportButtons
                        data={exportRows(a)}
                        sheetName="Rate Analysis"
                        fileName={`RateAnalysis_${a.type.replace(/\s+/g, "_")}`}
                        title={`Rate Analysis — ${a.type} (per ${a.unit})`}
                      />

                    </TabsContent>
                  ))}
                </Tabs>
              )}

              <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-3 text-xs">
                <p className="font-semibold text-orange-800 dark:text-orange-200">⚠️ Rate disclaimer</p>
                <p className="text-orange-700/80 dark:text-orange-200/80">
                  Default rates reflect approximate Bangladesh market values. Verify against current PWD/LGED schedules
                  and local suppliers before contract pricing.
                </p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}

// ---------- editable row table ----------
function RowTable({ title, rows, onAdd, onUpdate, onRemove }: {
  title: string; rows: Row[];
  onAdd: () => void; onUpdate: (i: number, r: Partial<Row>) => void; onRemove: (i: number) => void;
}) {
  const total = rows.reduce((s, r) => s + (r.qty || 0) * (r.rate || 0), 0);
  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold capitalize">{title}</p>
        <Button size="sm" variant="outline" onClick={onAdd}><Plus className="h-3.5 w-3.5 mr-1" /> Row</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[600px]">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-1.5 text-left">Item</th>
              <th className="p-1.5 w-20 text-right">Qty</th>
              <th className="p-1.5 w-16">Unit</th>
              <th className="p-1.5 w-24 text-right">Rate ৳</th>
              <th className="p-1.5 w-28 text-right">Amount ৳</th>
              <th className="p-1.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="p-3 text-center text-muted-foreground">No rows</td></tr>}
            {rows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="p-1"><Input className="h-7 text-xs" value={r.name} onChange={e => onUpdate(i, { name: e.target.value })} /></td>
                <td className="p-1"><Input type="number" className="h-7 text-xs text-right" value={r.qty} onChange={e => onUpdate(i, { qty: +e.target.value })} /></td>
                <td className="p-1"><Input className="h-7 text-xs" value={r.unit} onChange={e => onUpdate(i, { unit: e.target.value })} /></td>
                <td className="p-1"><Input type="number" className="h-7 text-xs text-right" value={r.rate} onChange={e => onUpdate(i, { rate: +e.target.value })} /></td>
                <td className="p-1 text-right font-medium">{((r.qty || 0) * (r.rate || 0)).toLocaleString()}</td>
                <td className="p-1 text-center"><button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-muted/30 font-bold">
              <tr><td colSpan={4} className="p-1.5 text-right">Subtotal</td><td className="p-1.5 text-right">{total.toLocaleString()}</td><td /></tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}
