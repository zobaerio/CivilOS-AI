import { useEffect, useMemo, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { ExportButtons } from "@/components/ExportButtons";
import {
  Calculator, Loader2, Plus, Trash2, Download, FileSpreadsheet, Printer,
  Copy as CopyIcon, Save, Ruler, History,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type Category = "Civil" | "Sanitary" | "Electrical" | "Finishing";
type RateSource = "PWD" | "LGED" | "Market" | "Custom";
interface BOQItem {
  id: string;
  category: Category;
  item: string;
  unit: string;
  qty: number;
  rate: number;
  source: RateSource;
  notes?: string;
}
interface Measurement {
  id: string;
  itemId: string;
  description: string;
  length: number;
  breadth: number;
  height: number;
  nos: number;
  notes?: string;
}
interface BOQDoc {
  buildingType: string;
  floors: number;
  areaPerFloor: number;
  constructionType: string;
  district: string;
  items: BOQItem[];
  measurements: Measurement[];
  summary?: string;
  assumptions?: string[];
  version: number;
  createdAt: number;
}

const CATEGORIES: Category[] = ["Civil", "Sanitary", "Electrical", "Finishing"];
const RATE_SOURCES: RateSource[] = ["PWD", "LGED", "Market", "Custom"];
const uid = () => Math.random().toString(36).slice(2, 10);
const bdt = (n: number) => `৳ ${(n || 0).toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;

const emptyDoc = (): BOQDoc => ({
  buildingType: "Residential",
  floors: 2,
  areaPerFloor: 1200,
  constructionType: "RCC frame",
  district: "Dhaka",
  items: [],
  measurements: [],
  version: 1,
  createdAt: Date.now(),
});

export default function BOQHubPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<BOQDoc>(emptyDoc);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [linkedProjectId, setLinkedProjectId] = useState<string>("new");
  const [projects, setProjects] = useState<any[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggleCompare = (id: string) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 2 ? [prev[1], id] : [...prev, id]);

  const duplicateFromHistory = async (p: any) => {
    if (!user) return;
    const d = p.estimate as BOQDoc;
    const newName = `${p.name} (copy)`;
    const payload = { ...d, version: 1, createdAt: Date.now() };
    const { error } = await supabase.from("projects").insert({
      user_id: user.id, name: newName, estimate: { __type: "boq", ...payload } as any,
    });
    if (error) return toast.error(error.message);
    toast.success(`Duplicated as "${newName}"`);
    setSaving(s => !s); // trigger reload
  };

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name, estimate, created_at, updated_at").order("updated_at", { ascending: false }).then(({ data }) => {
      const list = data ?? [];
      setProjects(list);
      setHistory(list.filter((p: any) => p.estimate?.__type === "boq"));
    });
  }, [user, saving]);

  const totalsByCategory = useMemo(() => {
    const map: Record<Category, number> = { Civil: 0, Sanitary: 0, Electrical: 0, Finishing: 0 };
    for (const it of doc.items) map[it.category] = (map[it.category] || 0) + (it.qty * it.rate);
    return map;
  }, [doc.items]);
  const grandTotal = useMemo(
    () => doc.items.reduce((s, i) => s + i.qty * i.rate, 0),
    [doc.items]
  );

  // ---------- AI generation ----------
  const generate = async () => {
    if (!doc.floors || !doc.areaPerFloor) return toast.error("Floors and area required");
    setGenerating(true);
    try {
      const desc = `${doc.floors}-storey ${doc.constructionType} ${doc.buildingType.toLowerCase()} building, ` +
        `${doc.areaPerFloor} sft per floor, ${doc.district}, Bangladesh. ` +
        `Provide realistic PWD-schedule rates in BDT for Civil, Sanitary, Electrical, and Finishing works.`;
      const { data, error } = await supabase.functions.invoke("ai-structured", {
        body: { mode: "boq", input: desc },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const r = data.result;
      const items: BOQItem[] = (r?.boq_items ?? []).map((x: any) => ({
        id: uid(),
        category: guessCategory(x.item),
        item: String(x.item ?? ""),
        unit: String(x.unit ?? ""),
        qty: Number(x.qty) || 0,
        rate: Number(x.rate_bdt) || 0,
        source: "PWD",
        notes: x.notes,
      }));
      setDoc(d => ({ ...d, items, summary: r?.summary, assumptions: r?.assumptions ?? [] }));
      toast.success(`Generated ${items.length} items`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const guessCategory = (item: string): Category => {
    const s = item.toLowerCase();
    if (/(pipe|sanit|toilet|water|plumb|septic|fitt)/.test(s)) return "Sanitary";
    if (/(wire|cable|switch|board|electr|light|fan|mcb)/.test(s)) return "Electrical";
    if (/(paint|tile|plaster|finish|door|window|marble|granite)/.test(s)) return "Finishing";
    return "Civil";
  };

  // ---------- Item ops ----------
  const addItem = (category: Category = "Civil") =>
    setDoc(d => ({ ...d, items: [...d.items, { id: uid(), category, item: "", unit: "cft", qty: 0, rate: 0, source: "Custom" }] }));
  const updateItem = (id: string, patch: Partial<BOQItem>) =>
    setDoc(d => ({ ...d, items: d.items.map(i => i.id === id ? { ...i, ...patch } : i) }));
  const removeItem = (id: string) =>
    setDoc(d => ({
      ...d,
      items: d.items.filter(i => i.id !== id),
      measurements: d.measurements.filter(m => m.itemId !== id),
    }));

  // ---------- Measurement ops ----------
  const addMeasurement = (itemId: string) =>
    setDoc(d => ({
      ...d,
      measurements: [...d.measurements, { id: uid(), itemId, description: "", length: 0, breadth: 0, height: 0, nos: 1 }],
    }));
  const updateMeasurement = (id: string, patch: Partial<Measurement>) =>
    setDoc(d => ({ ...d, measurements: d.measurements.map(m => m.id === id ? { ...m, ...patch } : m) }));
  const removeMeasurement = (id: string) =>
    setDoc(d => ({ ...d, measurements: d.measurements.filter(m => m.id !== id) }));
  const applyMeasurementToItem = (itemId: string) => {
    const total = doc.measurements
      .filter(m => m.itemId === itemId)
      .reduce((s, m) => s + (m.length || 1) * (m.breadth || 1) * (m.height || 1) * (m.nos || 1), 0);
    updateItem(itemId, { qty: Number(total.toFixed(2)) });
    toast.success(`Qty updated: ${total.toFixed(2)}`);
  };

  // ---------- Exports ----------
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ["#", "Category", "Item", "Unit", "Qty", "Rate (BDT)", "Amount (BDT)", "Source", "Notes"],
      ...doc.items.map((i, idx) => [idx + 1, i.category, i.item, i.unit, i.qty, i.rate, i.qty * i.rate, i.source, i.notes ?? ""]),
      [],
      ["", "", "", "", "", "TOTAL", grandTotal, "", ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // Set numeric formats
    for (let r = 1; r <= doc.items.length; r++) {
      const rate = ws[XLSX.utils.encode_cell({ r, c: 5 })];
      const amt = ws[XLSX.utils.encode_cell({ r, c: 6 })];
      if (rate) rate.z = "#,##0";
      if (amt) { amt.z = "#,##0"; amt.f = `E${r + 1}*F${r + 1}`; }
    }
    const totalCell = ws[XLSX.utils.encode_cell({ r: doc.items.length + 2, c: 6 })];
    if (totalCell) totalCell.f = `SUM(G2:G${doc.items.length + 1})`;
    ws["!cols"] = [{ wch: 4 }, { wch: 12 }, { wch: 40 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, ws, "BOQ");

    if (doc.measurements.length) {
      const mrows = [
        ["Item", "Description", "L", "B", "H", "Nos", "Qty", "Notes"],
        ...doc.measurements.map(m => {
          const it = doc.items.find(i => i.id === m.itemId);
          return [it?.item ?? "", m.description, m.length, m.breadth, m.height, m.nos, (m.length||1)*(m.breadth||1)*(m.height||1)*(m.nos||1), m.notes ?? ""];
        }),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mrows), "Measurements");
    }
    XLSX.writeFile(wb, `BOQ_${projectName || "project"}_v${doc.version}.xlsx`);
  };

  const exportPDF = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setFontSize(16).text("CivilOS AI — Bill of Quantities", 40, 40);
    pdf.setFontSize(10).setTextColor(100).text(
      `${projectName || doc.buildingType} · ${doc.floors} floors × ${doc.areaPerFloor} sft · ${doc.district} · v${doc.version}`,
      40, 58,
    );
    autoTable(pdf, {
      startY: 80,
      head: [["#", "Category", "Item", "Unit", "Qty", "Rate (৳)", "Amount (৳)", "Src"]],
      body: doc.items.map((i, k) => [
        k + 1, i.category, i.item, i.unit,
        i.qty.toLocaleString(), i.rate.toLocaleString(), (i.qty * i.rate).toLocaleString(), i.source,
      ]),
      foot: [["", "", "", "", "", "TOTAL", grandTotal.toLocaleString(), ""]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
    });
    pdf.save(`BOQ_${projectName || "project"}_v${doc.version}.pdf`);
  };

  // ---------- Save & load ----------
  const saveDoc = async (asNewVersion = false) => {
    if (!user) return toast.error("Please sign in");
    if (!projectName.trim()) return toast.error("Project name required");
    setSaving(true);
    try {
      const payload = { __type: "boq", ...doc, version: asNewVersion ? doc.version + 1 : doc.version };
      if (linkedProjectId === "new") {
        const { data, error } = await supabase.from("projects").insert({
          user_id: user.id, name: projectName, estimate: payload as any,
        }).select().single();
        if (error) throw error;
        setLinkedProjectId(data.id);
        setDoc(d => ({ ...d, version: payload.version }));
        toast.success(`Saved BOQ v${payload.version}`);
      } else {
        const { error } = await supabase.from("projects").update({
          name: projectName, estimate: payload as any,
        }).eq("id", linkedProjectId);
        if (error) throw error;
        setDoc(d => ({ ...d, version: payload.version }));
        toast.success(`Updated BOQ v${payload.version}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const loadDoc = (p: any) => {
    setLinkedProjectId(p.id);
    setProjectName(p.name);
    const d = p.estimate as BOQDoc;
    setDoc({ ...emptyDoc(), ...d, items: d.items ?? [], measurements: d.measurements ?? [] });
    toast.success(`Loaded ${p.name}`);
  };

  const duplicateDoc = () => {
    setDoc(d => ({ ...d, version: d.version + 1, createdAt: Date.now() }));
    setLinkedProjectId("new");
    setProjectName(n => n ? `${n} (copy)` : "");
    toast.success("Duplicated — save to create new project");
  };

  if (authLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <>
      <SEO
        title="BOQ & Quantity Surveying Hub — CivilOS AI"
        description="AI-powered BOQ generator, measurement sheet, PWD/LGED rate integration, Excel & PDF exports — Bangladesh."
        url="/boq-hub"
      />
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b flex items-center justify-between px-3 sm:px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger />
                <Calculator className="h-4 w-4 text-accent" />
                <h1 className="font-heading text-sm sm:text-base font-bold truncate">BOQ &amp; Quantity Surveying Hub</h1>
              </div>
              <ThemeToggle />
            </header>

            <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto space-y-4">
              <Tabs defaultValue="generator" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                  <TabsTrigger value="generator" className="text-xs sm:text-sm">Generator</TabsTrigger>
                  <TabsTrigger value="boq" className="text-xs sm:text-sm">BOQ ({doc.items.length})</TabsTrigger>
                  <TabsTrigger value="measure" className="text-xs sm:text-sm">Measurement</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
                </TabsList>

                {/* GENERATOR */}
                <TabsContent value="generator">
                  <Card className="p-4 space-y-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Project name</Label>
                        <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Mirpur duplex..." />
                      </div>
                      <div className="space-y-1">
                        <Label>Link to project</Label>
                        <Select value={linkedProjectId} onValueChange={setLinkedProjectId}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">➕ New project</SelectItem>
                            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Building type</Label>
                        <Select value={doc.buildingType} onValueChange={(v) => setDoc(d => ({ ...d, buildingType: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Residential", "Commercial", "Industrial", "Infrastructure"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Floors</Label>
                        <Input type="number" value={doc.floors} onChange={(e) => setDoc(d => ({ ...d, floors: +e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Area per floor (sft)</Label>
                        <Input type="number" value={doc.areaPerFloor} onChange={(e) => setDoc(d => ({ ...d, areaPerFloor: +e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Construction type</Label>
                        <Select value={doc.constructionType} onValueChange={(v) => setDoc(d => ({ ...d, constructionType: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["RCC frame", "Load-bearing brick", "Steel frame", "Composite"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>District</Label>
                        <Input value={doc.district} onChange={(e) => setDoc(d => ({ ...d, district: e.target.value }))} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={generate} disabled={generating}>
                        {generating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</> : <>Generate BOQ with AI</>}
                      </Button>
                      <Button variant="outline" onClick={() => addItem()}><Plus className="h-4 w-4 mr-1" /> Add item</Button>
                    </div>

                    {doc.summary && (
                      <div className="rounded-md border bg-muted/30 p-3 text-xs sm:text-sm">
                        <p className="font-semibold mb-1">AI summary</p>
                        <p className="text-muted-foreground">{doc.summary}</p>
                        {doc.assumptions && doc.assumptions.length > 0 && (
                          <ul className="list-disc pl-5 mt-2 text-muted-foreground">
                            {doc.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {CATEGORIES.map(c => (
                        <Card key={c} className="p-3">
                          <p className="text-[10px] uppercase text-muted-foreground">{c}</p>
                          <p className="font-heading font-bold text-sm">{bdt(totalsByCategory[c])}</p>
                        </Card>
                      ))}
                      <Card className="p-3 bg-primary/10 border-primary/30">
                        <p className="text-[10px] uppercase text-primary">Grand total</p>
                        <p className="font-heading font-bold text-sm">{bdt(grandTotal)}</p>
                      </Card>
                    </div>
                  </Card>
                </TabsContent>

                {/* BOQ TABLE */}
                <TabsContent value="boq" className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => addItem()}><Plus className="h-4 w-4 mr-1" /> Row</Button>
                    <Button size="sm" variant="outline" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
                    <Button size="sm" variant="outline" onClick={exportPDF}><Download className="h-4 w-4 mr-1" /> PDF</Button>
                    <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
                    <Button size="sm" variant="outline" onClick={duplicateDoc}><CopyIcon className="h-4 w-4 mr-1" /> Duplicate</Button>
                    <Button size="sm" onClick={() => saveDoc(false)} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save v{doc.version}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => saveDoc(true)} disabled={saving}>
                      Save as v{doc.version + 1}
                    </Button>
                  </div>
                  <ExportButtons
                    data={doc.items.map((i, idx) => ({
                      'ক্রমিক নং': idx + 1,
                      'ক্যাটাগরি': i.category,
                      'কাজের বিবরণ': i.item,
                      'একক': i.unit,
                      'পরিমাণ': i.qty,
                      'একক দর (৳)': i.rate,
                      'মোট মূল্য (৳)': i.qty * i.rate,
                      'উৎস': i.source,
                      'মন্তব্য': i.notes ?? '',
                    }))}
                    sheetName="BOQ"
                    fileName={`CivilOS_BOQ_v${doc.version}`}
                    title="Bill of Quantities — CivilOS AI"
                  />

                  <Card className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm border-collapse min-w-[900px]">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-2 text-left w-8">#</th>
                          <th className="p-2 text-left w-24">Category</th>
                          <th className="p-2 text-left">Item description</th>
                          <th className="p-2 w-16">Unit</th>
                          <th className="p-2 w-20 text-right">Qty</th>
                          <th className="p-2 w-24 text-right">Rate ৳</th>
                          <th className="p-2 w-28 text-right">Amount ৳</th>
                          <th className="p-2 w-20">Source</th>
                          <th className="p-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.items.length === 0 && (
                          <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No items yet — generate with AI or add manually.</td></tr>
                        )}
                        {doc.items.map((i, k) => (
                          <tr key={i.id} className="border-b hover:bg-muted/20">
                            <td className="p-1 text-center text-xs text-muted-foreground">{k + 1}</td>
                            <td className="p-1">
                              <Select value={i.category} onValueChange={(v: Category) => updateItem(i.id, { category: v })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="p-1"><Input className="h-8 text-xs" value={i.item} onChange={(e) => updateItem(i.id, { item: e.target.value })} /></td>
                            <td className="p-1"><Input className="h-8 text-xs" value={i.unit} onChange={(e) => updateItem(i.id, { unit: e.target.value })} /></td>
                            <td className="p-1"><Input type="number" className="h-8 text-xs text-right" value={i.qty} onChange={(e) => updateItem(i.id, { qty: +e.target.value })} /></td>
                            <td className="p-1"><Input type="number" className="h-8 text-xs text-right" value={i.rate} onChange={(e) => updateItem(i.id, { rate: +e.target.value })} /></td>
                            <td className="p-1 text-right font-medium">{(i.qty * i.rate).toLocaleString()}</td>
                            <td className="p-1">
                              <Select value={i.source} onValueChange={(v: RateSource) => updateItem(i.id, { source: v })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{RATE_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="p-1 text-center">
                              <button onClick={() => removeItem(i.id)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {doc.items.length > 0 && (
                        <tfoot className="bg-muted/30 font-bold">
                          <tr>
                            <td colSpan={6} className="p-2 text-right">Grand total</td>
                            <td className="p-2 text-right">{grandTotal.toLocaleString()}</td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </Card>
                </TabsContent>

                {/* MEASUREMENT */}
                <TabsContent value="measure" className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Linked measurement sheet. Add L × B × H × Nos for any item, then "Apply" to update its quantity.
                  </p>
                  {doc.items.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">Add BOQ items first.</Card>}
                  {doc.items.map((i) => {
                    const rows = doc.measurements.filter(m => m.itemId === i.id);
                    return (
                      <Card key={i.id} className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold flex items-center gap-2 min-w-0"><Ruler className="h-4 w-4 text-accent shrink-0" /> <span className="truncate">{i.item || "(unnamed item)"}</span></p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => addMeasurement(i.id)}><Plus className="h-3.5 w-3.5 mr-1" /> Row</Button>
                            <Button size="sm" onClick={() => applyMeasurementToItem(i.id)} disabled={rows.length === 0}>Apply → Qty</Button>
                          </div>
                        </div>
                        {rows.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse min-w-[700px]">
                              <thead className="bg-muted/40"><tr>
                                <th className="p-1.5 text-left">Description</th>
                                <th className="p-1.5 w-20 text-right">L</th>
                                <th className="p-1.5 w-20 text-right">B</th>
                                <th className="p-1.5 w-20 text-right">H</th>
                                <th className="p-1.5 w-16 text-right">Nos</th>
                                <th className="p-1.5 w-20 text-right">Qty</th>
                                <th className="p-1.5">Notes</th>
                                <th className="p-1.5 w-8"></th>
                              </tr></thead>
                              <tbody>
                                {rows.map(m => (
                                  <tr key={m.id} className="border-b">
                                    <td className="p-1"><Input className="h-7 text-xs" value={m.description} onChange={(e) => updateMeasurement(m.id, { description: e.target.value })} /></td>
                                    <td className="p-1"><Input type="number" className="h-7 text-xs text-right" value={m.length} onChange={(e) => updateMeasurement(m.id, { length: +e.target.value })} /></td>
                                    <td className="p-1"><Input type="number" className="h-7 text-xs text-right" value={m.breadth} onChange={(e) => updateMeasurement(m.id, { breadth: +e.target.value })} /></td>
                                    <td className="p-1"><Input type="number" className="h-7 text-xs text-right" value={m.height} onChange={(e) => updateMeasurement(m.id, { height: +e.target.value })} /></td>
                                    <td className="p-1"><Input type="number" className="h-7 text-xs text-right" value={m.nos} onChange={(e) => updateMeasurement(m.id, { nos: +e.target.value })} /></td>
                                    <td className="p-1 text-right font-medium">{((m.length||1)*(m.breadth||1)*(m.height||1)*(m.nos||1)).toFixed(2)}</td>
                                    <td className="p-1"><Input className="h-7 text-xs" value={m.notes ?? ""} onChange={(e) => updateMeasurement(m.id, { notes: e.target.value })} /></td>
                                    <td className="p-1 text-center"><button onClick={() => removeMeasurement(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </TabsContent>

                {/* HISTORY */}
                <TabsContent value="history" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-accent" />
                    <p className="text-sm">Saved BOQs ({history.length})</p>
                  </div>
                  {history.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">No saved BOQs yet.</Card>}
                  {history.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Tick up to 2 BOQs to compare side-by-side. {compareIds.length > 0 && <button className="underline" onClick={() => setCompareIds([])}>clear</button>}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {history.map((p) => {
                      const d = p.estimate as BOQDoc;
                      const total = (d.items ?? []).reduce((s, i) => s + i.qty * i.rate, 0);
                      const checked = compareIds.includes(p.id);
                      return (
                        <Card key={p.id} className={`p-3 space-y-2 ${checked ? "ring-2 ring-primary" : ""}`}>
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{p.name}</p>
                              <p className="text-[11px] text-muted-foreground">v{d.version} · {d.items?.length ?? 0} items · {new Date(p.updated_at).toLocaleDateString()}</p>
                            </div>
                            <label className="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                              <input type="checkbox" checked={checked} onChange={() => toggleCompare(p.id)} /> compare
                            </label>
                          </div>
                          <p className="text-lg font-heading font-bold">{bdt(total)}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => loadDoc(p)}>Load</Button>
                            <Button size="sm" variant="outline" onClick={() => duplicateFromHistory(p)}><CopyIcon className="h-3.5 w-3.5" /></Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {compareIds.length === 2 && (() => {
                    const [a, b] = compareIds.map(id => history.find(h => h.id === id)).filter(Boolean);
                    if (!a || !b) return null;
                    const totalsOf = (p: any) => {
                      const m: Record<string, number> = { Civil: 0, Sanitary: 0, Electrical: 0, Finishing: 0 };
                      for (const i of (p.estimate.items ?? []) as BOQItem[]) m[i.category] = (m[i.category] || 0) + i.qty * i.rate;
                      m.__total = Object.values(m).reduce((s, n) => s + n, 0);
                      return m;
                    };
                    const ta = totalsOf(a), tb = totalsOf(b);
                    const rows = [...CATEGORIES, "__total"] as const;
                    return (
                      <Card className="p-4 space-y-2">
                        <p className="font-semibold text-sm">BOQ comparison</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm border-collapse min-w-[500px]">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="p-2 text-left">Category</th>
                                <th className="p-2 text-right truncate max-w-[160px]">{a.name} v{a.estimate.version}</th>
                                <th className="p-2 text-right truncate max-w-[160px]">{b.name} v{b.estimate.version}</th>
                                <th className="p-2 text-right">Δ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map(k => {
                                const delta = tb[k] - ta[k];
                                const isTotal = k === "__total";
                                return (
                                  <tr key={k} className={`border-b ${isTotal ? "bg-muted/30 font-bold" : ""}`}>
                                    <td className="p-2">{isTotal ? "Grand total" : k}</td>
                                    <td className="p-2 text-right">{bdt(ta[k])}</td>
                                    <td className="p-2 text-right">{bdt(tb[k])}</td>
                                    <td className={`p-2 text-right ${delta > 0 ? "text-destructive" : delta < 0 ? "text-emerald-600" : ""}`}>
                                      {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${bdt(delta)}`}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    );
                  })()}
                </TabsContent>
              </Tabs>

              <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-3 text-xs">
                <p className="font-semibold text-orange-800 dark:text-orange-200">⚠️ Engineering disclaimer</p>
                <p className="text-orange-700/80 dark:text-orange-200/80">
                  AI-generated estimates use approximate PWD/LGED-basis rates. Verify with the latest published schedule
                  and site conditions before tender submission or construction. Not a substitute for a licensed engineer.
                </p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
