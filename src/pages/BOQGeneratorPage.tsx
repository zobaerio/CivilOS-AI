import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calculator, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { ExportButtons } from "@/components/ExportButtons";

interface BOQItem { item: string; unit: string; qty: number; rate_bdt: number; amount_bdt: number; notes?: string }
interface BOQResult { summary: string; boq_items: BOQItem[]; total_bdt: number; assumptions: string[] }

export default function BOQGeneratorPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BOQResult | null>(null);

  const generate = async () => {
    if (!input.trim()) return toast.error("Project description দিন");
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-structured", {
        body: { mode: "boq", input },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result as BOQResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "BOQ generation failed");
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!result) return;
    const rows = [
      ["Item", "Unit", "Qty", "Rate (BDT)", "Amount (BDT)", "Notes"],
      ...result.boq_items.map(i => [i.item, i.unit, i.qty, i.rate_bdt, i.amount_bdt, i.notes ?? ""]),
      [], ["Total", "", "", "", result.total_bdt, ""],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "boq.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SidebarProvider>
      <SEO title="BOQ Generator — CivilOS AI" description="AI-powered Bill of Quantities generator with PWD rate analysis." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger /><h1 className="font-heading font-semibold flex items-center gap-2"><Calculator className="h-4 w-4 text-accent" /> BOQ Generator</h1></div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto space-y-4">
            <Card className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Project এর scope বর্ণনা দিন (size, floors, structure type, finish level). AI PWD rate অনুযায়ী BOQ generate করবে।</p>
              <Textarea rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Example: 2-storey RCC residential building, 1200 sft per floor, brick masonry, standard finish, Dhaka..." />
              <Button onClick={generate} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <>Generate BOQ</>}
              </Button>
            </Card>

            {result && (
              <Card className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm">{result.summary}</p>
                  <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead><tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Item</th><th className="p-2">Unit</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Rate</th><th className="text-right p-2">Amount</th>
                    </tr></thead>
                    <tbody>
                      {result.boq_items.map((i, k) => (
                        <tr key={k} className="border-b">
                          <td className="p-2">{i.item}{i.notes && <div className="text-xs text-muted-foreground">{i.notes}</div>}</td>
                          <td className="p-2 text-center">{i.unit}</td>
                          <td className="p-2 text-right">{i.qty}</td>
                          <td className="p-2 text-right">{i.rate_bdt?.toLocaleString()}</td>
                          <td className="p-2 text-right font-medium">{i.amount_bdt?.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/30"><td colSpan={4} className="p-2 text-right">Total (BDT)</td><td className="p-2 text-right">{result.total_bdt?.toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>
                <ExportButtons
                  data={result.boq_items.map((i, idx) => ({
                    'ক্রমিক নং': idx + 1,
                    'কাজের বিবরণ': i.item,
                    'একক': i.unit,
                    'পরিমাণ': i.qty,
                    'একক দর (৳)': i.rate_bdt,
                    'মোট মূল্য (৳)': i.amount_bdt,
                    'মন্তব্য': i.notes ?? '',
                  }))}
                  sheetName="BOQ"
                  fileName="CivilOS_BOQ"
                  title="Bill of Quantities — CivilOS AI"
                />
                {result.assumptions?.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Assumptions:</p>
                    <ul className="list-disc pl-5 space-y-0.5">{result.assumptions.map((a, k) => <li key={k}>{a}</li>)}</ul>
                  </div>
                )}
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
