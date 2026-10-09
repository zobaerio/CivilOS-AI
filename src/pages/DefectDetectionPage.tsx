import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCloudState } from "@/lib/cloudState";
import { toast } from "sonner";
import { Camera, Loader2, Trash2, Download } from "lucide-react";

type Sev = "low" | "medium" | "high" | "critical";
type Defect = { type: string; severity: Sev; location: string; description: string; action: string };
type Report = { id: string; date: string; note: string; thumb: string; summary: string; overallRisk: Sev; defects: Defect[] };

const sevClass: Record<Sev, string> = {
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-accent text-accent-foreground",
  high: "bg-destructive/70 text-destructive-foreground",
  critical: "bg-destructive text-destructive-foreground",
};

function shrink(file: File, max: number, q = 0.82): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", q));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

export default function DefectDetectionPage() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const T = (b: string, e: string) => (bn ? b : e);
  const [reports, setReports] = useCloudState<Report[]>("civilos.defects", []);
  const [img, setImg] = useState<string>("");
  const [thumb, setThumb] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<Report | null>(null);

  const pick = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error(T("শুধু ছবি দিন", "Images only"));
    setImg(await shrink(f, 1600)); setThumb(await shrink(f, 240, 0.7)); setCurrent(null);
  };

  const analyze = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("defect-detect", { body: { dataUrl: img, note, lang } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      const r: Report = { id: crypto.randomUUID(), date: new Date().toISOString(), note, thumb, summary: data.summary, overallRisk: data.overallRisk, defects: data.defects ?? [] };
      setCurrent(r);
      setReports((p) => [r, ...p].slice(0, 30));
    } catch (e: any) {
      toast.error(e?.message || T("বিশ্লেষণ ব্যর্থ", "Analysis failed"));
    } finally { setBusy(false); }
  };

  const exportCsv = () => {
    const rows = [["Date", "Risk", "Defect", "Severity", "Location", "Description", "Action"]];
    reports.forEach((r) => (r.defects.length ? r.defects : [{ type: "-", severity: "-", location: "", description: r.summary, action: "" } as any])
      .forEach((d: Defect) => rows.push([r.date.slice(0, 10), r.overallRisk, d.type, d.severity, d.location, d.description, d.action])));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = "defect-reports.csv"; a.click();
  };

  const View = ({ r }: { r: Report }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{T("সামগ্রিক ঝুঁকি", "Overall risk")}:</span>
        <Badge className={sevClass[r.overallRisk]}>{r.overallRisk}</Badge>
        <span className="text-sm text-muted-foreground">{r.defects.length} {T("টি ত্রুটি", "defect(s)")}</span>
      </div>
      <p className="text-sm">{r.summary}</p>
      {r.defects.map((d, i) => (
        <Card key={i} className="p-3 space-y-1">
          <div className="flex items-center justify-between gap-2"><b>{d.type}</b><Badge className={sevClass[d.severity]}>{d.severity}</Badge></div>
          {d.location && <p className="text-xs text-muted-foreground">{T("অবস্থান", "Location")}: {d.location}</p>}
          <p className="text-sm">{d.description}</p>
          <p className="text-sm"><b>{T("করণীয়", "Action")}:</b> {d.action}</p>
        </Card>
      ))}
    </div>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4 max-w-5xl">
          <div className="flex items-center gap-2"><SidebarTrigger />
            <h1 className="text-xl md:text-2xl font-bold">{T("AI ত্রুটি শনাক্তকরণ", "AI Defect Detection")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{T("সাইটের ছবি দিন — AI ফাটল, হানিকম্ব, মরিচা ধরা রড, স্যাঁতসেঁতে ভাব ও নিরাপত্তা সমস্যা খুঁজবে।", "Upload a site photo — AI looks for cracks, honeycombing, corroded rebar, dampness and safety issues.")}</p>

          <Card className="p-4 space-y-3">
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/40">
              {img ? <img src={img} alt="site" className="max-h-72 rounded" /> : (<><Camera className="h-8 w-8 mb-2 text-primary" /><span className="text-sm">{T("ছবি তুলুন বা বেছে নিন", "Take or choose a photo")}</span></>)}
              <input type="file" accept="image/*" capture="environment" className="hidden" aria-label="site photo" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            <Textarea placeholder={T("নোট (ঐচ্ছিক): যেমন ৩য় তলার কলাম C4", "Note (optional): e.g. 3rd floor column C4")} value={note} onChange={(e) => setNote(e.target.value)} />
            <Button onClick={analyze} disabled={!img || busy} className="w-full sm:w-auto">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{T("বিশ্লেষণ চলছে…", "Analysing…")}</> : T("ত্রুটি খুঁজুন", "Detect defects")}
            </Button>
            {current && <View r={current} />}
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{T("আগের রিপোর্ট", "Past reports")} ({reports.length})</h2>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!reports.length}><Download className="h-4 w-4 mr-1" />CSV</Button>
          </div>
          {reports.map((r) => (
            <Card key={r.id} className="p-3 flex gap-3">
              <img src={r.thumb} alt="" className="w-20 h-20 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span>{new Date(r.date).toLocaleString(bn ? "bn-BD" : "en-GB")}</span>
                  <Badge className={sevClass[r.overallRisk]}>{r.overallRisk}</Badge>
                  <span>{r.defects.length} {T("টি ত্রুটি", "defect(s)")}</span>
                </div>
                {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
                <p className="text-sm line-clamp-2">{r.summary}</p>
                <button className="text-xs text-primary underline" onClick={() => setCurrent(r)}>{T("বিস্তারিত", "Details")}</button>
              </div>
              <Button variant="ghost" size="icon" aria-label="delete" onClick={() => setReports((p) => p.filter((x) => x.id !== r.id))}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </main>
      </div>
    </SidebarProvider>
  );
}
