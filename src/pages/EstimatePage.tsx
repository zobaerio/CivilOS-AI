import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import Building3D from "@/components/Building3D";
import { useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { generateEstimate } from "@/lib/estimateEngine";
import {
  computeBNBCLoads,
  designBeams,
  designColumns,
  designSlabs,
  buildBOQ,
  buildTimeline,
  buildQuotation,
  aiRecommendations,
  BNBC_ZONES,
  BNBC_SOILS,
} from "@/lib/engineering";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download, Lightbulb, Building, Layers, Hammer, Paintbrush, Zap, Droplets,
  DollarSign, Activity, Construction, FileText, Calendar, Box, ShieldCheck, Save, Share2
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useI18n } from "@/lib/i18n";
import { suggestionsBn } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COLORS = ["#1a3a6b", "#2a5298", "#e67e22", "#27ae60", "#8e44ad", "#e74c3c", "#3498db", "#f39c12", "#1abc9c"];

const EstimatePage = () => {
  const location = useLocation();
  const { t, lang, currency, fmt } = useI18n();
  const { user } = useAuth();

  const params = location.state || {
    plotLength: 40, plotWidth: 30, unit: "feet", floors: 1,
    floorHeight: 10, wallThickness: 5, projectType: "single",
    quality: "standard", foundationType: "strip", roofType: "rcc_slab",
    fileName: "Demo House Project",
  };

  const [zone, setZone] = useState<string>("Zone 2 (Dhaka)");
  const [soil, setSoil] = useState<string>("SC");
  const [importance, setImportance] = useState<number>(1.0);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState<string>(params._projectName || params.fileName || "House Project");
  const [district, setDistrict] = useState<string>(params.district || "Dhaka");
  const [rates, setRates] = useState(params.rates || undefined);

  const data = useMemo(() => generateEstimate({ ...params, rates }), [rates, district]);
  const loads = useMemo(() => computeBNBCLoads(data, zone, soil, importance), [data, zone, soil, importance]);
  const beams = useMemo(() => designBeams(data), [data]);
  const columns = useMemo(() => designColumns(data), [data]);
  const slabs = useMemo(() => designSlabs(data), [data]);
  const boq = useMemo(() => buildBOQ(data), [data]);
  const timeline = useMemo(() => buildTimeline(data), [data]);
  const quotation = useMemo(() => buildQuotation(data), [data]);
  const aiRecs = useMemo(() => aiRecommendations(data, loads), [data, loads]);
  const suggestions = lang === "bn" ? suggestionsBn : data.suggestions;

  const totalDuration = Math.max(...timeline.map((p) => p.startMonth + p.durationMonths));

  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportBOQCsv = () => {
    const rows: (string | number)[][] = [["Item", "Qty", "Unit", "Rate (BDT)", "Total (BDT)"]];
    boq.forEach((b) => rows.push([b.item, b.qty, b.unit, b.rate, b.total]));
    rows.push(["", "", "", "TOTAL", boq.reduce((s, b) => s + b.total, 0)]);
    downloadCSV(`${projectName}_BOQ.csv`, rows);
    toast.success("BOQ exported as CSV");
  };

  const exportQuotationCsv = () => {
    const rows: (string | number)[][] = [
      ["Smart House Estimate AI – Contractor Quotation"],
      ["Project", projectName], ["Plot", data.plotSize], ["Floors", data.floors], ["Quality", data.quality],
      [],
      ["Item", "Amount (BDT)", "Justification"],
      ...quotation.justification.map((j) => [j.label, j.amount, j.note]),
      ["Full Project Cost (before profit)", quotation.baseProjectCost, "Materials + Labor + Civil + Finishing + E&P + Transport + Contingency + Overhead"],
      ["TOTAL (with 10% contractor profit)", quotation.total, "Single profit margin — no double counting"],
      [],
      ["Duration (months)", quotation.durationMonths],
      ["Validity (days)", quotation.validityDays],
      ["Payment Terms", quotation.paymentTerms],
    ];
    downloadCSV(`${projectName}_Quotation.csv`, rows);
    toast.success("Quotation exported as CSV");
  };

  const saveProject = async () => {
    if (!user) { toast.info("Please sign in to save projects."); return; }
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: projectName,
        file_name: params.fileName || null,
        inputs: { ...params, _zone: zone, _soil: soil, _importance: importance },
        estimate: data as any,
        bnbc_loads: loads as any,
      };
      if (params._projectId) {
        const { error } = await supabase.from("projects").update(payload).eq("id", params._projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
      toast.success("Project saved to your account");
    } catch (e: any) {
      toast.error(e.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const shareProject = async () => {
    if (!user) { toast.info("Sign in and save the project first to share it."); return; }
    if (!params._projectId) { toast.info("Save the project first, then share."); return; }
    let token = (params as any)._shareToken as string | undefined;
    if (!token) {
      token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const { error } = await supabase.from("projects")
        .update({ share_token: token, is_public: true } as any)
        .eq("id", params._projectId);
      if (error) { toast.error(error.message); return; }
    }
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard!");
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Smart House Estimate AI - Engineering Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Project: ${data.projectName}`, 14, 30);
    doc.text(`Plot: ${data.plotSize} | Floors: ${data.floors} | Quality: ${data.quality}`, 14, 36);
    doc.text(`Total Cost: BDT ${new Intl.NumberFormat("en-IN").format(quotation.total)}`, 14, 42);

    doc.text("BNBC Structural Loads", 14, 52);
    autoTable(doc, {
      startY: 56,
      head: [["Parameter", "Value"]],
      body: [
        ["Seismic Zone", loads.zone],
        ["Zone Factor (Z)", loads.zoneFactor.toString()],
        ["Soil Type", loads.soilType],
        ["Total Dead Load", `${loads.totalDeadLoad} kN`],
        ["Total Live Load", `${loads.totalLiveLoad} kN`],
        ["Wind Pressure", `${loads.windPressure} kN/m²`],
        ["Base Shear", `${loads.baseShear} kN`],
      ],
      styles: { fontSize: 8 },
    });

    let y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.text("BNBC 2020 Load Combinations", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["#", "Combination", "Factored (kN)", "Governs"]],
      body: loads.combos.map((c) => [c.name, c.formula, c.factoredLoad.toString(), c.governs ? "YES" : ""]),
      styles: { fontSize: 8 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
    doc.text("Bill of Quantities (BOQ)", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Item", "Qty", "Unit", "Rate (BDT)", "Total (BDT)"]],
      body: boq.map((b) => [
        b.item,
        new Intl.NumberFormat("en-IN").format(b.qty),
        b.unit,
        new Intl.NumberFormat("en-IN").format(b.rate),
        new Intl.NumberFormat("en-IN").format(b.total),
      ]),
      styles: { fontSize: 8 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text("Contractor Quotation", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Item", "Amount (BDT)", "Justification"]],
      body: [
        ...quotation.justification.map((j) => [j.label, new Intl.NumberFormat("en-IN").format(j.amount), j.note]),
        ["Full Project Cost", new Intl.NumberFormat("en-IN").format(quotation.baseProjectCost), "Sum before contractor profit"],
        ["TOTAL (with profit)", new Intl.NumberFormat("en-IN").format(quotation.total), "Final quotation"],
      ],
      styles: { fontSize: 9 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.text("Disclaimer: AI-based preliminary analysis. Verify with a licensed structural engineer.", 14, y);
    doc.text("Developed by MD Zobaer Hasan | https://zobaer-portfolio.lovable.app", 14, y + 5);

    doc.save(`${data.projectName}_EngineeringReport.pdf`);
  };

  const SectionCard = ({ title, icon: Icon, children, action }: { title: string; icon: any; children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="bg-card rounded-xl shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-accent" />
          </div>
          <h3 className="font-heading font-semibold text-lg">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={projectName ? `${projectName} — Construction Estimate` : "Construction Estimate"}
        description={`AI-generated BNBC 2020 construction estimate${params?.area ? ` for a ${params.area} sqft house` : ""}: full BOQ, structural analysis, and 3D model.`}
        type="article"
      />
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="font-heading text-2xl md:text-3xl font-bold border-0 px-0 h-auto bg-transparent focus-visible:ring-0 shadow-none"
              />
              <p className="text-muted-foreground text-sm">
                {data.plotSize} • {data.floors} {t("est.floor")} • {data.quality} {t("est.quality")} • BNBC 2020
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={saveProject} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : user ? "Save Project" : "Sign in to Save"}
              </Button>
              <Button variant="outline" onClick={shareProject}>
                <Share2 className="h-4 w-4 mr-1" /> Share Link
              </Button>
              <Button onClick={generatePDF}>
                <Download className="h-4 w-4 mr-1" /> {t("est.downloadPdf")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("est.totalArea"), value: `${fmt(data.totalFloorArea)} sqft` },
              { label: t("est.totalCost"), value: currency(quotation.total) },
              { label: t("est.costSqft"), value: currency(Math.round(quotation.total / data.totalFloorArea)) },
              { label: t("est.duration"), value: `~${data.completionMonths} ${t("est.months")}` },
            ].map((c) => (
              <div key={c.label} className="bg-card rounded-xl shadow-card p-4 text-center">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="font-heading font-bold text-lg mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="estimate" className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="h-auto flex-wrap justify-start">
                <TabsTrigger value="estimate"><DollarSign className="h-4 w-4 mr-1" /> Estimate</TabsTrigger>
                <TabsTrigger value="structural"><Activity className="h-4 w-4 mr-1" /> Structural</TabsTrigger>
                <TabsTrigger value="rebar"><Construction className="h-4 w-4 mr-1" /> Rebar</TabsTrigger>
                <TabsTrigger value="boq"><FileText className="h-4 w-4 mr-1" /> BOQ</TabsTrigger>
                <TabsTrigger value="3d"><Box className="h-4 w-4 mr-1" /> 3D View</TabsTrigger>
                <TabsTrigger value="timeline"><Calendar className="h-4 w-4 mr-1" /> Timeline</TabsTrigger>
                <TabsTrigger value="quotation"><ShieldCheck className="h-4 w-4 mr-1" /> Quotation</TabsTrigger>
              </TabsList>
            </div>

            {/* ESTIMATE TAB */}
            <TabsContent value="estimate" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title={t("est.costDist")} icon={DollarSign}>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.costBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {data.costBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => currency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
                <SectionCard title={t("est.catCost")} icon={Layers}>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.costBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} fontSize={10} />
                        <YAxis type="category" dataKey="category" width={80} fontSize={10} />
                        <Tooltip formatter={(v: number) => currency(v)} />
                        <Bar dataKey="amount" fill="hsl(220, 70%, 25%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>
              </div>

              <SectionCard title={t("est.civilWork")} icon={Building}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">{t("est.item")}</th><th className="text-right py-2">{t("est.amount")} (৳)</th></tr></thead>
                    <tbody>
                      {Object.entries(data.civilWork).map(([k, v]) => (
                        <tr key={k} className="border-b border-border/50"><td className="py-2">{k}</td><td className="text-right font-medium">{fmt(v)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SectionCard title={t("est.finishing")} icon={Paintbrush}>
                  <div className="space-y-2 text-sm">
                    {Object.entries(data.finishing).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">৳{fmt(v)}</span></div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title={t("est.electrical")} icon={Zap}>
                  <div className="space-y-2 text-sm">
                    {Object.entries(data.electrical).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{typeof v === "number" && k.includes("Cost") ? `৳${fmt(v)}` : v}</span></div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title={t("est.plumbing")} icon={Droplets}>
                  <div className="space-y-2 text-sm">
                    {Object.entries(data.plumbing).map(([k, v]) => (
                      <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{typeof v === "number" && k.includes("Cost") ? `৳${fmt(v)}` : v}</span></div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <SectionCard title={t("est.aiSuggestions")} icon={Lightbulb}>
                <div className="space-y-3">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="h-6 w-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-muted-foreground">{s}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            {/* STRUCTURAL TAB */}
            <TabsContent value="structural" className="space-y-6">
              <SectionCard title="BNBC 2020 Site & Importance Inputs" icon={ShieldCheck}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Seismic Zone</label>
                    <select value={zone} onChange={(e) => setZone(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-card px-3 text-sm">
                      {Object.entries(BNBC_ZONES).map(([k, v]) => <option key={k} value={k}>{k} (Z={v})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Soil Classification</label>
                    <select value={soil} onChange={(e) => setSoil(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-card px-3 text-sm">
                      {Object.entries(BNBC_SOILS).map(([k, v]) => <option key={k} value={k}>{v.label} (S={v.factor})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Importance Factor (I)</label>
                    <select value={importance} onChange={(e) => setImportance(parseFloat(e.target.value))} className="w-full h-10 rounded-lg border border-input bg-card px-3 text-sm">
                      <option value={1.0}>1.00 — Standard occupancy</option>
                      <option value={1.25}>1.25 — Important / schools</option>
                      <option value={1.5}>1.50 — Essential facilities</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="BNBC 2020 Load Analysis" icon={Activity}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Seismic Zone</p><p className="font-bold mt-1">{loads.zone}</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Zone Factor (Z)</p><p className="font-bold mt-1">{loads.zoneFactor}</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Soil Type</p><p className="font-bold mt-1">{loads.soilType} (S={loads.soilFactor})</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Importance (I)</p><p className="font-bold mt-1">{loads.importanceFactor}</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Dead Load (D)</p><p className="font-bold mt-1">{fmt(loads.totalDeadLoad)} kN</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Live Load (L)</p><p className="font-bold mt-1">{fmt(loads.totalLiveLoad)} kN</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Wind Load (W)</p><p className="font-bold mt-1">{fmt(loads.windLoad)} kN</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Earthquake (E)</p><p className="font-bold mt-1 text-accent">{fmt(loads.baseShear)} kN</p></div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-xs space-y-1 font-mono">
                  <p>Wind Pressure: P = 0.6V² → P = 0.6 × {loads.windSpeed}² = {(0.6 * loads.windSpeed * loads.windSpeed).toFixed(0)} N/m² = {loads.windPressure} kN/m²</p>
                  <p>Cs = (Z·I·2.5)/R = ({loads.zoneFactor}·{loads.importanceFactor}·2.5)/{loads.responseFactor} = {loads.seismicCoeff}</p>
                  <p>Base Shear: V = Cs·W·S = {loads.seismicCoeff} × {fmt(loads.buildingWeight)} × {loads.soilFactor} = {fmt(loads.baseShear)} kN</p>
                </div>
              </SectionCard>

              <SectionCard title="BNBC 2020 Strength Load Combinations" icon={Layers}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">#</th>
                      <th className="text-left py-2">Combination</th>
                      <th className="text-right py-2">Factored Resultant (kN)</th>
                      <th className="text-right py-2">Status</th>
                    </tr></thead>
                    <tbody>
                      {loads.combos.map((c) => (
                        <tr key={c.name} className={`border-b border-border/50 ${c.governs ? "bg-accent/5" : ""}`}>
                          <td className="py-2 font-mono text-xs">{c.name}</td>
                          <td className="py-2 font-mono">{c.formula}</td>
                          <td className="text-right font-semibold">{fmt(c.factoredLoad)}</td>
                          <td className="text-right">
                            {c.governs ? <Badge className="bg-accent">Governs</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reference: BNBC 2020, Part 6, Chapter 2 — Loads on Buildings (clause 2.7.3.1).
                  Resultant = vertical + 0.5 × lateral, used only for ranking. In design, vertical and lateral effects remain separate.
                </p>
              </SectionCard>

              <SectionCard title="Beam Design (Bending & Shear)" icon={Layers}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Span (ft)</th>
                      <th className="text-right py-2">Size (in)</th>
                      <th className="text-right py-2">M = wL²/8 (kN·m)</th>
                      <th className="text-right py-2">V = wL/2 (kN)</th>
                      <th className="text-right py-2">Status</th>
                    </tr></thead>
                    <tbody>
                      {beams.map((b, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2">{b.span}</td>
                          <td className="text-right">{b.width} × {b.depth}</td>
                          <td className="text-right font-medium">{b.maxMoment}</td>
                          <td className="text-right font-medium">{b.maxShear}</td>
                          <td className="text-right">
                            <Badge variant={b.status === "Safe" ? "default" : "destructive"} className={b.status === "Safe" ? "bg-green-600" : ""}>{b.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Column Analysis" icon={Building}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Section</th>
                      <th className="text-right py-2">Axial Load (kN)</th>
                      <th className="text-right py-2">Status</th>
                    </tr></thead>
                    <tbody>
                      {columns.map((c, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 font-medium">{c.size}</td>
                          <td className="text-right">{fmt(c.axialLoad)}</td>
                          <td className="text-right"><Badge className="bg-green-600">{c.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="AI Engineering Recommendations" icon={Lightbulb}>
                <div className="space-y-2">
                  {aiRecs.map((r, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm">
                      <span className="text-accent">▸</span><span className="text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </TabsContent>

            {/* REBAR TAB */}
            <TabsContent value="rebar" className="space-y-6">
              <SectionCard title="Beam Reinforcement" icon={Construction}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Beam (Span)</th>
                      <th className="text-left py-2">Top Bars</th>
                      <th className="text-left py-2">Bottom Bars</th>
                      <th className="text-left py-2">Stirrups</th>
                    </tr></thead>
                    <tbody>
                      {beams.map((b, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 font-medium">{b.span} ft</td>
                          <td>{b.topRebar}</td>
                          <td>{b.bottomRebar}</td>
                          <td>{b.stirrups}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Column Reinforcement" icon={Construction}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Section</th>
                      <th className="text-left py-2">Main Bars</th>
                      <th className="text-left py-2">Ties</th>
                    </tr></thead>
                    <tbody>
                      {columns.map((c, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 font-medium">{c.size}</td>
                          <td>{c.mainBars}</td>
                          <td>{c.ties}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Slab Reinforcement" icon={Construction}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Panel</th>
                      <th className="text-right py-2">Thickness</th>
                      <th className="text-left py-2">Main Rebar</th>
                      <th className="text-left py-2">Distribution</th>
                    </tr></thead>
                    <tbody>
                      {slabs.map((s, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 font-medium">{s.panel}</td>
                          <td className="text-right">{s.thickness}"</td>
                          <td>{s.mainRebar}</td>
                          <td>{s.distRebar}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </TabsContent>

            {/* BOQ TAB */}
            <TabsContent value="boq" className="space-y-6">
              <SectionCard title="Bill of Quantities (BOQ)" icon={FileText} action={
                <Button size="sm" variant="outline" onClick={exportBOQCsv}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              }>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="text-left py-2">Item</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit</th>
                      <th className="text-right py-2">Rate (৳)</th>
                      <th className="text-right py-2">Total (৳)</th>
                    </tr></thead>
                    <tbody>
                      {boq.map((b, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2">{b.item}</td>
                          <td className="text-right">{fmt(b.qty)}</td>
                          <td className="text-right">{b.unit}</td>
                          <td className="text-right">{fmt(b.rate)}</td>
                          <td className="text-right font-semibold">{fmt(b.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/40">
                        <td colSpan={4} className="py-3 text-right font-bold">BOQ TOTAL</td>
                        <td className="text-right font-bold text-accent py-3">৳{fmt(boq.reduce((s, b) => s + b.total, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </TabsContent>

            {/* 3D VIEW TAB */}
            <TabsContent value="3d" className="space-y-6">
              <SectionCard title="Interactive 3D Building Model" icon={Box}>
                <p className="text-xs text-muted-foreground">Drag to rotate • scroll to zoom • right-click to pan</p>
                <Building3D
                  plotLength={params.plotLength}
                  plotWidth={params.plotWidth}
                  floors={params.floors}
                  floorHeight={params.floorHeight}
                />
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-muted/40 rounded-lg p-2 text-center"><span className="text-muted-foreground">Walls</span><br/><span className="font-bold">RCC</span></div>
                  <div className="bg-muted/40 rounded-lg p-2 text-center"><span className="text-muted-foreground">Slabs</span><br/><span className="font-bold">{slabs[0].thickness}"</span></div>
                  <div className="bg-muted/40 rounded-lg p-2 text-center"><span className="text-muted-foreground">Floors</span><br/><span className="font-bold">{params.floors}</span></div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* TIMELINE TAB */}
            <TabsContent value="timeline" className="space-y-6">
              <SectionCard title="Construction Timeline (Gantt)" icon={Calendar}>
                <div className="space-y-3">
                  {timeline.map((p, i) => {
                    const leftPct = (p.startMonth / totalDuration) * 100;
                    const widthPct = (p.durationMonths / totalDuration) * 100;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground">M{p.startMonth.toFixed(1)} – M{(p.startMonth + p.durationMonths).toFixed(1)}</span>
                        </div>
                        <div className="relative h-6 bg-muted/40 rounded-md overflow-hidden">
                          <div
                            className="absolute h-full rounded-md"
                            style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: p.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Month 0</span>
                  <span>Month {Math.ceil(totalDuration)}</span>
                </div>
              </SectionCard>
            </TabsContent>

            {/* QUOTATION TAB */}
            <TabsContent value="quotation" className="space-y-6">
              <SectionCard title="Contractor Quotation — Fully Justified" icon={ShieldCheck} action={
                <Button size="sm" variant="outline" onClick={exportQuotationCsv}><Download className="h-4 w-4 mr-1" /> CSV</Button>
              }>
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-6 space-y-2">
                  {quotation.justification.map((j) => (
                    <div key={j.label} className="border-b border-border/40 last:border-0 pb-2 last:pb-0">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{j.label}</span>
                        <span className="font-semibold">৳{fmt(j.amount)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{j.note}</p>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between text-sm">
                    <span>Full Project Cost (before profit)</span>
                    <span className="font-semibold">৳{fmt(quotation.baseProjectCost)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-1">
                    <span className="font-bold">TOTAL QUOTATION</span>
                    <span className="font-bold text-accent">৳{fmt(quotation.total)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    ✓ Single 10% contractor profit applied on full project cost — overhead/contingency are NOT double counted.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Project Duration</p><p className="font-bold mt-1">{quotation.durationMonths} months</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Quote Validity</p><p className="font-bold mt-1">{quotation.validityDays} days</p></div>
                  <div className="bg-muted/40 rounded-lg p-3"><p className="text-muted-foreground text-xs">Cost / sqft</p><p className="font-bold mt-1">৳{fmt(Math.round(quotation.total / data.totalFloorArea))}</p></div>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Payment Terms</p>
                  <p className="font-medium">{quotation.paymentTerms}</p>
                </div>
                <Button onClick={generatePDF} className="w-full">
                  <Download className="h-4 w-4 mr-1" /> Download Full Quotation (PDF)
                </Button>
              </SectionCard>
            </TabsContent>
          </Tabs>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ This system provides AI-based preliminary structural analysis and estimation. Final engineering design must be verified by a licensed structural engineer.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EstimatePage;
