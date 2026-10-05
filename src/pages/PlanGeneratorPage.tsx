import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Wand2, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_INPUT, generatePlan, parsePrompt, type PlanInput, type RoadSide } from "@/lib/planGenerator";
import { toast } from "sonner";

const zoneFill = { front: "hsl(var(--primary) / 0.14)", mid: "hsl(var(--accent) / 0.16)", rear: "hsl(var(--secondary))" };

export default function PlanGeneratorPage() {
  const { lang, currency } = useI18n();
  const bn = lang === "bn";
  const L = (en: string, b: string) => (bn ? b : en);
  const [inp, setInp] = useState<PlanInput>(() => { try { return { ...DEFAULT_INPUT, ...JSON.parse(localStorage.getItem("civilos.plan") || "{}") }; } catch { return DEFAULT_INPUT; } });
  useEffect(() => { localStorage.setItem("civilos.plan", JSON.stringify(inp)); }, [inp]);
  const [prompt, setPrompt] = useState("");
  const plan = useMemo(() => generatePlan(inp), [inp]);
  const set = <K extends keyof PlanInput>(k: K, v: PlanInput[K]) => setInp((p) => ({ ...p, [k]: v }));

  const S = 8; // px per ft
  const pad = 30;
  const W = inp.plotWidth * S, D = inp.plotDepth * S;
  const bx = plan.setbacks.side * S, by = plan.setbacks.rear * S; // building origin (rear at top)
  const bH = plan.buildD * S;

  const downloadSvg = () => {
    const el = document.getElementById("plan-svg");
    if (!el) return;
    const blob = new Blob([el.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "civilos-floor-plan.svg"; a.click();
  };

  const num = (k: keyof PlanInput, label: string, min = 1, max = 200) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={min} max={max} value={inp[k] as number}
        onChange={(e) => set(k, Math.max(min, Math.min(max, Number(e.target.value) || min)) as never)} />
    </div>
  );
  const sw = (k: keyof PlanInput, label: string) => (
    <label className="flex items-center justify-between gap-2 text-sm">
      {label}<Switch checked={inp[k] as boolean} onCheckedChange={(v) => set(k, v as never)} />
    </label>
  );
  const dirs: { v: RoadSide; en: string; bn: string }[] = [
    { v: "north", en: "North", bn: "উত্তর" }, { v: "south", en: "South", bn: "দক্ষিণ" },
    { v: "east", en: "East", bn: "পূর্ব" }, { v: "west", en: "West", bn: "পশ্চিম" },
  ];

  return (
    <SidebarProvider>
      <SEO title="Create Your Own Plan — CivilOS AI" description="Generate a floor plan from plot size, road direction, rooms and floors with feasibility checks." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger />
              <h1 className="font-heading font-semibold flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-accent" /> {L("Create Your Own Plan", "নিজের প্ল্যান তৈরি করুন")}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="p-4 md:p-6 grid lg:grid-cols-[340px_1fr] gap-5">
            <div className="space-y-4">
              <Card className="p-4 space-y-2">
                <Label className="text-xs">{L("Describe in plain words", "সহজ ভাষায় লিখুন")}</Label>
                <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder={L("e.g. 40x60 plot, south road, 3 bed 3 bath, 5 floors", "যেমন: ৪০x৬০ প্লট, দক্ষিণে রাস্তা, ৩ বেড ৩ বাথ, ৫ তলা")} />
                <Button size="sm" className="w-full" onClick={() => { setInp(parsePrompt(prompt, inp)); toast.success(L("Plan updated", "প্ল্যান আপডেট হয়েছে")); }}>
                  <Wand2 className="h-4 w-4 mr-1" /> {L("Generate from text", "লেখা থেকে তৈরি করুন")}
                </Button>
              </Card>
              <Card className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {num("plotWidth", L("Plot width (ft)", "প্লট প্রস্থ (ফুট)"), 15)}
                  {num("plotDepth", L("Plot depth (ft)", "প্লট গভীরতা (ফুট)"), 15)}
                  {num("floors", L("Floors", "তলা"), 1, 20)}
                  <div className="space-y-1">
                    <Label className="text-xs">{L("Road side", "রাস্তার দিক")}</Label>
                    <Select value={inp.road} onValueChange={(v) => set("road", v as RoadSide)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{dirs.map((d) => <SelectItem key={d.v} value={d.v}>{bn ? d.bn : d.en}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {num("bedrooms", L("Bedrooms", "বেডরুম"), 0, 8)}
                  {num("bathrooms", L("Bathrooms", "বাথরুম"), 0, 8)}
                </div>
                <div className="space-y-2 pt-1">
                  {sw("drawing", L("Drawing room", "ড্রয়িং রুম"))}
                  {sw("dining", L("Dining", "ডাইনিং"))}
                  {sw("kitchen", L("Kitchen", "রান্নাঘর"))}
                  {sw("balcony", L("Balcony", "বারান্দা"))}
                  {sw("stair", L("Stair / Lift", "সিঁড়ি / লিফট"))}
                  {sw("parking", L("Ground-floor parking", "নিচতলায় পার্কিং"))}
                </div>
              </Card>
            </div>

            <div className="space-y-4 min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  [L("Plot area", "প্লট এলাকা"), `${Math.round(plan.plotArea)} sft`],
                  [L("Footprint", "ফুটপ্রিন্ট"), `${Math.round(plan.footprint)} sft`],
                  [L("Total built", "মোট নির্মাণ"), `${Math.round(plan.totalBuilt)} sft`],
                  [L("Est. cost", "আনুমানিক খরচ"), currency(plan.estCost)],
                ].map(([k, v]) => (
                  <Card key={k} className="p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-heading font-semibold">{v}</p></Card>
                ))}
              </div>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">{L("Typical floor plan", "সাধারণ তলার প্ল্যান")} · {L("Road", "রাস্তা")}: {dirs.find((d) => d.v === inp.road)?.[bn ? "bn" : "en"]}</p>
                  <div className="flex gap-2"><Button size="sm" variant="outline" asChild><Link to="/bim-studio"><Box className="h-4 w-4 mr-1" /> 3D</Link></Button><Button size="sm" variant="outline" onClick={downloadSvg}><Download className="h-4 w-4 mr-1" /> SVG</Button></div>
                </div>
                <div className="overflow-auto">
                  <svg id="plan-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W + pad * 2} ${D + pad * 2 + 30}`} className="w-full max-h-[70vh]" style={{ fontFamily: "sans-serif" }}>
                    <g transform={`translate(${pad},${pad})`}>
                      <rect width={W} height={D} fill="none" stroke="hsl(var(--muted-foreground))" strokeDasharray="6 4" />
                      {plan.rooms.map((r) => {
                        const x = bx + r.x * S, y = by + bH - (r.y + r.h) * S, w = r.w * S, h = r.h * S;
                        return (
                          <g key={r.name}>
                            <rect x={x} y={y} width={w} height={h} fill={zoneFill[r.zone]} stroke="hsl(var(--foreground))" strokeWidth={2} />
                            <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fontSize={Math.min(13, w / 6)} fill="hsl(var(--foreground))" fontWeight={600}>{bn ? r.nameBn : r.name}</text>
                            <text x={x + w / 2} y={y + h / 2 + 12} textAnchor="middle" fontSize={Math.min(11, w / 7)} fill="hsl(var(--muted-foreground))">{r.w.toFixed(1)}'×{r.h.toFixed(1)}'</text>
                          </g>
                        );
                      })}
                      <rect x={0} y={D + 8} width={W} height={22} fill="hsl(var(--muted))" />
                      <text x={W / 2} y={D + 23} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">{L("ROAD", "রাস্তা")} — {inp.plotWidth}' {L("frontage", "সম্মুখ")}</text>
                    </g>
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {L("Setbacks", "সেটব্যাক")}: {L("front", "সামনে")} {plan.setbacks.front}' · {L("rear", "পেছনে")} {plan.setbacks.rear}' · {L("sides", "পাশে")} {plan.setbacks.side}'
                </p>
              </Card>

              <Card className="p-4 space-y-2">
                <p className="font-semibold text-sm">{L("Feasibility check", "সম্ভাব্যতা যাচাই")}</p>
                {plan.checks.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {c.ok ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                    <span>{bn ? c.bn : c.en}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">{L("Concept layout only — final design must be done by a licensed architect/engineer per BNBC 2022 and local authority (RAJUK etc.) rules.", "এটি শুধু ধারণাগত লেআউট — চূড়ান্ত নকশা BNBC ২০২২ ও স্থানীয় কর্তৃপক্ষ (রাজউক ইত্যাদি) অনুযায়ী লাইসেন্সপ্রাপ্ত স্থপতি/প্রকৌশলী দ্বারা করতে হবে।")}</p>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
