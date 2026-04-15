import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { generateEstimate } from "@/lib/estimateEngine";
import { Button } from "@/components/ui/button";
import { Download, Lightbulb, Building, Layers, Hammer, Paintbrush, Zap, Droplets, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useI18n } from "@/lib/i18n";
import { suggestionsBn } from "@/lib/i18n";

const COLORS = ["#1a3a6b", "#2a5298", "#e67e22", "#27ae60", "#8e44ad", "#e74c3c", "#3498db", "#f39c12", "#1abc9c"];

const EstimatePage = () => {
  const location = useLocation();
  const { t, lang, currency, fmt } = useI18n();

  const params = location.state || {
    plotLength: 40, plotWidth: 30, unit: "feet", floors: 1,
    floorHeight: 10, wallThickness: 5, projectType: "single",
    quality: "standard", foundationType: "strip", roofType: "rcc_slab",
    fileName: "Demo House Project",
  };

  const data = useMemo(() => generateEstimate(params), []);

  const suggestions = lang === "bn" ? suggestionsBn : data.suggestions;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Smart House Estimate AI - Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Project: ${data.projectName}`, 14, 34);
    doc.text(`Plot: ${data.plotSize} | Floors: ${data.floors} | Quality: ${data.quality}`, 14, 40);
    doc.text(`Total Area: ${new Intl.NumberFormat("en-IN").format(data.totalFloorArea)} sqft | Total Cost: BDT ${new Intl.NumberFormat("en-IN").format(data.totalCost)}`, 14, 46);
    doc.text(`Cost/sqft: BDT ${new Intl.NumberFormat("en-IN").format(data.costPerSqft)} | Duration: ~${data.completionMonths} months`, 14, 52);

    let y = 62;
    doc.setFontSize(12);
    doc.text("Material Estimate", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Material", "Qty", "Unit", "Rate (BDT)", "Total (BDT)"]],
      body: Object.entries(data.materials).map(([k, v]) => [k, new Intl.NumberFormat("en-IN").format(v.qty), v.unit, new Intl.NumberFormat("en-IN").format(v.rate), new Intl.NumberFormat("en-IN").format(v.total)]),
      styles: { fontSize: 8 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Labor Estimate", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Labor", "Days", "Rate/Day (BDT)", "Total (BDT)"]],
      body: Object.entries(data.labor).map(([k, v]) => [k, v.days, new Intl.NumberFormat("en-IN").format(v.rate), new Intl.NumberFormat("en-IN").format(v.total)]),
      styles: { fontSize: 8 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text("Cost Breakdown", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Category", "Amount (BDT)"]],
      body: data.costBreakdown.map((c) => [c.category, new Intl.NumberFormat("en-IN").format(c.amount)]),
      styles: { fontSize: 8 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.text("Note: This is an approximate estimate. Final BOQ should be verified by a licensed civil engineer.", 14, y);
    doc.text("Developed by Md Zobaer Hasan | © 2026 Smart House Estimate AI", 14, y + 6);

    doc.save(`${data.projectName}_Estimate.pdf`);
  };

  const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-card rounded-xl shadow-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <h3 className="font-heading font-semibold text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{data.projectName}</h1>
              <p className="text-muted-foreground text-sm">{data.plotSize} • {data.floors} {t("est.floor")} • {data.quality} {t("est.quality")}</p>
            </div>
            <Button onClick={generatePDF}>
              <Download className="h-4 w-4 mr-1" /> {t("est.downloadPdf")}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("est.totalArea"), value: `${fmt(data.totalFloorArea)} sqft` },
              { label: t("est.totalCost"), value: currency(data.totalCost) },
              { label: t("est.costSqft"), value: currency(data.costPerSqft) },
              { label: t("est.duration"), value: `~${data.completionMonths} ${t("est.months")}` },
            ].map((c) => (
              <div key={c.label} className="bg-card rounded-xl shadow-card p-4 text-center">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="font-heading font-bold text-lg mt-1">{c.value}</p>
              </div>
            ))}
          </div>

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

          <SectionCard title={t("est.materialEst")} icon={Layers}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">{t("est.material")}</th><th className="text-right py-2">{t("est.qty")}</th><th className="text-right py-2">{t("est.unit")}</th><th className="text-right py-2">{t("est.rate")} (৳)</th><th className="text-right py-2">{t("est.total")} (৳)</th></tr></thead>
                <tbody>
                  {Object.entries(data.materials).map(([k, v]) => (
                    <tr key={k} className="border-b border-border/50">
                      <td className="py-2">{k}</td><td className="text-right">{fmt(v.qty)}</td><td className="text-right">{v.unit}</td><td className="text-right">{fmt(v.rate)}</td><td className="text-right font-medium">{fmt(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title={t("est.laborEst")} icon={Hammer}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">{t("est.laborType")}</th><th className="text-right py-2">{t("est.days")}</th><th className="text-right py-2">{t("est.rateDay")} (৳)</th><th className="text-right py-2">{t("est.total")} (৳)</th></tr></thead>
                <tbody>
                  {Object.entries(data.labor).map(([k, v]) => (
                    <tr key={k} className="border-b border-border/50">
                      <td className="py-2">{k}</td><td className="text-right">{v.days}</td><td className="text-right">{fmt(v.rate)}</td><td className="text-right font-medium">{fmt(v.total)}</td>
                    </tr>
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

          <SectionCard title={t("est.roomwise")} icon={Building}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">{t("est.room")}</th><th className="text-right py-2">{t("est.length")}</th><th className="text-right py-2">{t("est.width")}</th><th className="text-right py-2">{t("est.area")}</th><th className="text-right py-2">{t("est.doors")}</th><th className="text-right py-2">{t("est.windows")}</th></tr></thead>
                <tbody>
                  {data.rooms.map((r) => (
                    <tr key={r.name} className="border-b border-border/50">
                      <td className="py-2">{r.name}</td><td className="text-right">{r.length.toFixed(0)}</td><td className="text-right">{r.width.toFixed(0)}</td><td className="text-right">{r.area.toFixed(0)}</td><td className="text-right">{r.doors}</td><td className="text-right">{r.windows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

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

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">{t("est.disclaimer")}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EstimatePage;
