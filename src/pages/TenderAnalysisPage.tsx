import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Save, AlertTriangle, Calendar, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";

interface TenderResult {
  summary: string;
  boq_items: { item: string; unit: string; qty: number; notes?: string }[];
  risks: { title: string; severity: "low" | "medium" | "high"; detail: string }[];
  deadlines: { event: string; date: string; notes?: string }[];
}

const sevColor: Record<string, string> = { low: "bg-secondary", medium: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300", high: "bg-destructive/20 text-destructive" };

export default function TenderAnalysisPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TenderResult | null>(null);

  const analyze = async () => {
    if (!text.trim()) return toast.error("Tender text paste করুন");
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-structured", {
        body: { mode: "tender", input: text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result as TenderResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally { setLoading(false); }
  };

  const save = async () => {
    if (!result || !user) return;
    const { error } = await supabase.from("tender_analyses").insert({
      user_id: user.id,
      title: title || "Untitled tender",
      source_text: text.slice(0, 20000),
      summary: result.summary,
      boq_items: result.boq_items,
      risks: result.risks,
      deadlines: result.deadlines,
    });
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <SidebarProvider>
      <SEO title="Tender Analysis — CivilOS AI" description="AI tender document analyzer: summary, BOQ extraction, risks, deadlines." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger /><h1 className="font-heading font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Tender Analysis</h1></div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto space-y-4">
            <Card className="p-4 space-y-3">
              <Input placeholder="Tender title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste tender notice / NOA / specifications text here..." />
              <Button onClick={analyze} disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : "Analyze with AI"}
              </Button>
            </Card>

            {result && (
              <div className="space-y-4">
                <Card className="p-4 space-y-2">
                  <div className="flex justify-between items-start"><h2 className="font-semibold">Executive Summary</h2><Button size="sm" variant="outline" onClick={save}><Save className="h-4 w-4 mr-1" /> Save</Button></div>
                  <p className="text-sm">{result.summary}</p>
                </Card>

                {result.risks?.length > 0 && (
                  <Card className="p-4 space-y-2">
                    <h2 className="font-semibold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Risks</h2>
                    <ul className="space-y-2">
                      {result.risks.map((r, k) => (
                        <li key={k} className="border rounded p-2">
                          <div className="flex items-center gap-2"><Badge className={sevColor[r.severity] ?? ""}>{r.severity}</Badge><span className="font-medium text-sm">{r.title}</span></div>
                          <p className="text-xs text-muted-foreground mt-1">{r.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {result.deadlines?.length > 0 && (
                  <Card className="p-4 space-y-2">
                    <h2 className="font-semibold flex items-center gap-1"><Calendar className="h-4 w-4" /> Deadlines</h2>
                    <ul className="space-y-1 text-sm">
                      {result.deadlines.map((d, k) => (
                        <li key={k} className="flex gap-2"><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{d.date}</span><span>{d.event}</span></li>
                      ))}
                    </ul>
                  </Card>
                )}

                {result.boq_items?.length > 0 && (
                  <Card className="p-4 space-y-2">
                    <h2 className="font-semibold flex items-center gap-1"><ListChecks className="h-4 w-4" /> BOQ Items</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="text-left p-1">Item</th><th className="p-1">Unit</th><th className="text-right p-1">Qty</th></tr></thead>
                        <tbody>{result.boq_items.map((i, k) => <tr key={k} className="border-b"><td className="p-1">{i.item}</td><td className="p-1 text-center">{i.unit}</td><td className="p-1 text-right">{i.qty}</td></tr>)}</tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
