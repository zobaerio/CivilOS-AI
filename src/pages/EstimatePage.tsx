import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLocation } from "react-router-dom";
import { useMemo, useRef } from "react";
import { generateEstimate } from "@/lib/estimateEngine";
import { Button } from "@/components/ui/button";
import { Download, Lightbulb, Building, Layers, Hammer, Paintbrush, Zap, Droplets, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["#1a3a6b", "#2a5298", "#e67e22", "#27ae60", "#8e44ad", "#e74c3c", "#3498db", "#f39c12", "#1abc9c"];

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

const EstimatePage = () => {
  const location = useLocation();
  const params = location.state || {
    plotLength: 40, plotWidth: 30, unit: "feet", floors: 1,
    floorHeight: 10, wallThickness: 5, projectType: "single",
    quality: "standard", foundationType: "strip", roofType: "rcc_slab",
    fileName: "Demo House Project",
  };

  const data = useMemo(() => generateEstimate(params), []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Smart House Estimate AI - Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Project: ${data.projectName}`, 14, 34);
    doc.text(`Plot: ${data.plotSize} | Floors: ${data.floors} | Quality: ${data.quality}`, 14, 40);
    doc.text(`Total Area: ${fmt(data.totalFloorArea)} sqft | Total Cost: ₹${fmt(data.totalCost)}`, 14, 46);
    doc.text(`Cost/sqft: ₹${fmt(data.costPerSqft)} | Duration: ~${data.completionMonths} months`, 14, 52);

    let y = 62;
    doc.setFontSize(12);
    doc.text("Material Estimate", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Material", "Qty", "Unit", "Rate (₹)", "Total (₹)"]],
      body: Object.entries(data.materials).map(([k, v]) => [k, fmt(v.qty), v.unit, fmt(v.rate), fmt(v.total)]),
      styles: { fontSize: 8 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Labor Estimate", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Labor", "Days", "Rate/Day (₹)", "Total (₹)"]],
      body: Object.entries(data.labor).map(([k, v]) => [k, v.days, fmt(v.rate), fmt(v.total)]),
      styles: { fontSize: 8 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.text("Cost Breakdown", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Category", "Amount (₹)"]],
      body: data.costBreakdown.map((c) => [c.category, fmt(c.amount)]),
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{data.projectName}</h1>
              <p className="text-muted-foreground text-sm">{data.plotSize} • {data.floors} Floor(s) • {data.quality} Quality</p>
            </div>
            <Button onClick={generatePDF}>
              <Download className="h-4 w-4 mr-1" /> Download PDF Report
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Area", value: `${fmt(data.totalFloorArea)} sqft` },
              { label: "Total Cost", value: `₹${fmt(data.totalCost)}` },
              { label: "Cost/sqft", value: `₹${fmt(data.costPerSqft)}` },
              { label: "Est. Duration", value: `~${data.completionMonths} months` },
            ].map((c) => (
              <div key={c.label} className="bg-card rounded-xl shadow-card p-4 text-center">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="font-heading font-bold text-lg mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Cost Distribution" icon={DollarSign}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.costBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {data.costBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `₹${fmt(v)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Category-wise Cost" icon={Layers}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.costBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <YAxis type="category" dataKey="category" width={80} fontSize={10} />
                    <Tooltip formatter={(v: number) => `₹${fmt(v)}`} />
                    <Bar dataKey="amount" fill="hsl(220, 70%, 25%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Civil Work */}
          <SectionCard title="Civil Work Estimate" icon={Building}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">Item</th><th className="text-right py-2">Amount (₹)</th></tr></thead>
                <tbody>
                  {Object.entries(data.civilWork).map(([k, v]) => (
                    <tr key={k} className="border-b border-border/50"><td className="py-2">{k}</td><td className="text-right font-medium">{fmt(v)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Materials */}
          <SectionCard title="Material Estimate" icon={Layers}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">Material</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Unit</th><th className="text-right py-2">Rate (₹)</th><th className="text-right py-2">Total (₹)</th></tr></thead>
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

          {/* Labor */}
          <SectionCard title="Labor Estimate" icon={Hammer}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">Labor Type</th><th className="text-right py-2">Days</th><th className="text-right py-2">Rate/Day (₹)</th><th className="text-right py-2">Total (₹)</th></tr></thead>
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

          {/* Finishing + Electrical + Plumbing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Finishing" icon={Paintbrush}>
              <div className="space-y-2 text-sm">
                {Object.entries(data.finishing).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">₹{fmt(v)}</span></div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Electrical" icon={Zap}>
              <div className="space-y-2 text-sm">
                {Object.entries(data.electrical).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{typeof v === "number" && k.includes("Cost") ? `₹${fmt(v)}` : v}</span></div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Plumbing" icon={Droplets}>
              <div className="space-y-2 text-sm">
                {Object.entries(data.plumbing).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{typeof v === "number" && k.includes("Cost") ? `₹${fmt(v)}` : v}</span></div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Room-wise */}
          <SectionCard title="Room-wise Details" icon={Building}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground"><th className="text-left py-2">Room</th><th className="text-right py-2">L (ft)</th><th className="text-right py-2">W (ft)</th><th className="text-right py-2">Area (sqft)</th><th className="text-right py-2">Doors</th><th className="text-right py-2">Windows</th></tr></thead>
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

          {/* AI Suggestions */}
          <SectionCard title="AI Suggestions" icon={Lightbulb}>
            <div className="space-y-3">
              {data.suggestions.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="h-6 w-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Disclaimer */}
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ This is an approximate estimate based on standard civil engineering formulas. Final structural design and BOQ should be verified by a licensed civil engineer.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EstimatePage;
