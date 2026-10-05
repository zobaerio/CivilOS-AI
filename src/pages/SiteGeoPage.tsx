import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map as MapIcon, Ruler, Hexagon, Home, Undo2, Trash2, LocateFixed, Download, Search } from "lucide-react";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { DEFAULT_INPUT, generatePlan, type PlanInput } from "@/lib/planGenerator";
import { bearing, distance, landUnits, offset, pathLength, polygonArea, quadArea, SFT_PER_M2, type LatLng } from "@/lib/survey";

type Mode = "distance" | "area";
const FT = 0.3048;
const DHAKA: LatLng = { lat: 23.8103, lng: 90.4125 };

export default function SiteGeoPage() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const T = (en: string, b: string) => (bn ? b : en);
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const drawLayer = useRef<L.LayerGroup | null>(null);
  const planLayer = useRef<L.LayerGroup | null>(null);
  const [mode, setMode] = useState<Mode>("area");
  const [pts, setPts] = useState<LatLng[]>([]);
  const [satellite, setSatellite] = useState(false);
  const [query, setQuery] = useState("");
  const tiles = useRef<{ street: L.TileLayer; sat: L.TileLayer } | null>(null);
  const modeRef = useRef(mode); modeRef.current = mode;

  const inp: PlanInput = useMemo(() => {
    try { return { ...DEFAULT_INPUT, ...JSON.parse(localStorage.getItem("civilos.plan") || "{}") }; } catch { return DEFAULT_INPUT; }
  }, []);

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = L.map(mapEl.current, { zoomControl: true }).setView([DHAKA.lat, DHAKA.lng], 17);
    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20, maxNativeZoom: 19, attribution: "© OpenStreetMap" });
    const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 19, attribution: "© Esri" });
    street.addTo(m);
    tiles.current = { street, sat };
    drawLayer.current = L.layerGroup().addTo(m);
    planLayer.current = L.layerGroup().addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => setPts((p) => [...p, { lat: e.latlng.lat, lng: e.latlng.lng }]));
    map.current = m;
    setTimeout(() => m.invalidateSize(), 200);
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current, t = tiles.current; if (!m || !t) return;
    if (satellite) { m.removeLayer(t.street); t.sat.addTo(m); } else { m.removeLayer(t.sat); t.street.addTo(m); }
  }, [satellite]);

  useEffect(() => {
    const g = drawLayer.current; if (!g) return;
    g.clearLayers();
    const ll = pts.map((p) => [p.lat, p.lng] as [number, number]);
    pts.forEach((p) => L.circleMarker([p.lat, p.lng], { radius: 5, color: "#f97316", fillOpacity: 1 }).addTo(g));
    if (mode === "area" && pts.length >= 3) L.polygon(ll, { color: "#2563eb", fillOpacity: 0.2 }).addTo(g);
    else if (pts.length >= 2) L.polyline(ll, { color: "#2563eb", weight: 3 }).addTo(g);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      L.marker([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2], {
        icon: L.divIcon({ className: "", html: `<span style="background:#fff;color:#0f172a;padding:1px 4px;border-radius:4px;font-size:11px;white-space:nowrap;box-shadow:0 1px 3px #0003">${(distance(a, b) / FT).toFixed(1)} ft</span>` }),
        interactive: false,
      }).addTo(g);
    }
  }, [pts, mode]);

  const placePlan = () => {
    const m = map.current, g = planLayer.current; if (!m || !g) return;
    g.clearLayers();
    const c = m.getCenter(); const center = { lat: c.lat, lng: c.lng };
    const plan = generatePlan(inp);
    // Rotation so road side faces the chosen direction (road at "front" = local -y)
    const rot = { south: 0, north: 180, east: 90, west: -90 }[inp.road] * (Math.PI / 180);
    const toLL = (x: number, y: number) => {
      const ex = x * Math.cos(rot) - y * Math.sin(rot), ny = x * Math.sin(rot) + y * Math.cos(rot);
      const p = offset(center, ex * FT, ny * FT); return [p.lat, p.lng] as [number, number];
    };
    const W = inp.plotWidth, D = inp.plotDepth;
    const rect = (x0: number, y0: number, x1: number, y1: number) => [toLL(x0, y0), toLL(x1, y0), toLL(x1, y1), toLL(x0, y1)];
    L.polygon(rect(-W / 2, -D / 2, W / 2, D / 2), { color: "#16a34a", dashArray: "6 4", fillOpacity: 0.08 }).bindTooltip(T("Plot", "প্লট")).addTo(g);
    const bx0 = -W / 2 + plan.setbacks.side, by0 = -D / 2 + plan.setbacks.front;
    plan.rooms.forEach((r) => {
      L.polygon(rect(bx0 + r.x, by0 + r.y, bx0 + r.x + r.w, by0 + r.y + r.h), { color: "#0f172a", weight: 1, fillColor: "#2563eb", fillOpacity: 0.25 })
        .bindTooltip(bn ? r.nameBn : r.name).addTo(g);
    });
    L.polygon(rect(-W / 2 - 5, -D / 2 - 14, W / 2 + 5, -D / 2 - 2), { color: "#334155", fillColor: "#334155", fillOpacity: 0.5, weight: 0 }).bindTooltip(T("Road", "রাস্তা")).addTo(g);
    m.fitBounds(L.latLngBounds(rect(-W / 2, -D / 2 - 14, W / 2, D / 2)), { padding: [40, 40] });
    toast.success(T("Plan placed at map centre", "ম্যাপের মাঝখানে প্ল্যান বসানো হয়েছে"));
  };

  const locate = () => {
    if (!navigator.geolocation) return toast.error(T("Location not available", "লোকেশন পাওয়া যায়নি"));
    navigator.geolocation.getCurrentPosition(
      (p) => map.current?.setView([p.coords.latitude, p.coords.longitude], 19),
      () => toast.error(T("Location permission denied", "লোকেশনের অনুমতি দেওয়া হয়নি")),
    );
  };
  const search = async () => {
    if (!query.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=bd&q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (!d[0]) return toast.error(T("Place not found", "জায়গা পাওয়া যায়নি"));
      map.current?.setView([+d[0].lat, +d[0].lon], 17);
    } catch { toast.error(T("Search failed", "খোঁজা যায়নি")); }
  };

  const exportGeoJSON = () => {
    if (pts.length < 2) return toast.error(T("Draw at least 2 points", "কমপক্ষে ২টি বিন্দু দিন"));
    const coords = pts.map((p) => [p.lng, p.lat]);
    const geometry = mode === "area" && pts.length >= 3 ? { type: "Polygon", coordinates: [[...coords, coords[0]]] } : { type: "LineString", coordinates: coords };
    const blob = new Blob([JSON.stringify({ type: "FeatureCollection", features: [{ type: "Feature", properties: { name: "CivilOS survey" }, geometry }] }, null, 2)], { type: "application/geo+json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "civilos-survey.geojson"; a.click();
  };

  const areaSft = polygonArea(pts) * SFT_PER_M2;
  const u = landUnits(areaSft);
  const len = pathLength(pts, mode === "area");
  const fmt = (n: number, d = 2) => n.toLocaleString(bn ? "bn-BD" : "en-US", { maximumFractionDigits: d });

  return (
    <SidebarProvider>
      <SEO title="Site Geo & Survey — CivilOS AI" description="Measure land on the map in decimal, katha and bigha, place your house plan on the plot, and use survey calculators." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-[1000]">
            <div className="flex items-center gap-2"><SidebarTrigger />
              <h1 className="font-heading font-semibold flex items-center gap-2"><MapIcon className="h-4 w-4 text-accent" /> {T("Site Geo & Survey", "সাইট ম্যাপ ও সার্ভে")}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="p-4 md:p-6 grid lg:grid-cols-[1fr_340px] gap-5">
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap gap-2">
                <div className="flex gap-1 flex-1 min-w-[200px]">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder={T("Search place, e.g. Mirpur 10", "জায়গা খুঁজুন, যেমন মিরপুর ১০")} />
                  <Button size="icon" variant="outline" onClick={search} aria-label="Search"><Search className="h-4 w-4" /></Button>
                </div>
                <Button size="sm" variant="outline" onClick={locate}><LocateFixed className="h-4 w-4 mr-1" />{T("My location", "আমার লোকেশন")}</Button>
                <Button size="sm" variant={satellite ? "default" : "outline"} onClick={() => setSatellite(!satellite)}>{T("Satellite", "স্যাটেলাইট")}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={mode === "area" ? "default" : "outline"} onClick={() => setMode("area")}><Hexagon className="h-4 w-4 mr-1" />{T("Measure area", "জমির মাপ")}</Button>
                <Button size="sm" variant={mode === "distance" ? "default" : "outline"} onClick={() => setMode("distance")}><Ruler className="h-4 w-4 mr-1" />{T("Measure distance", "দূরত্ব মাপ")}</Button>
                <Button size="sm" variant="outline" onClick={() => setPts((p) => p.slice(0, -1))}><Undo2 className="h-4 w-4 mr-1" />{T("Undo", "পিছনে")}</Button>
                <Button size="sm" variant="outline" onClick={() => setPts([])}><Trash2 className="h-4 w-4 mr-1" />{T("Clear", "মুছুন")}</Button>
                <Button size="sm" variant="secondary" onClick={placePlan}><Home className="h-4 w-4 mr-1" />{T("Show my plan on map", "আমার প্ল্যান ম্যাপে দেখান")}</Button>
                <Button size="sm" variant="outline" onClick={exportGeoJSON}><Download className="h-4 w-4 mr-1" />GeoJSON</Button>
              </div>
              <Card className="overflow-hidden">
                <div ref={mapEl} className="h-[60vh] lg:h-[calc(100vh-14rem)] w-full z-0" />
              </Card>
              <p className="text-xs text-muted-foreground">{T("Tap the map to add corner points. Map measurements are approximate — confirm with a licensed surveyor.", "ম্যাপে ট্যাপ করে কোণের বিন্দু দিন। ম্যাপের মাপ আনুমানিক — চূড়ান্ত মাপ লাইসেন্সধারী সার্ভেয়ার দিয়ে নিশ্চিত করুন।")}</p>
            </div>

            <div className="space-y-4">
              <Card className="p-4 space-y-2">
                <p className="font-semibold text-sm">{mode === "area" ? T("Measured land", "মাপা জমি") : T("Measured distance", "মাপা দূরত্ব")}</p>
                {mode === "area" ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[[T("Square feet", "বর্গফুট"), u.sft], [T("Square metre", "বর্গমিটার"), u.m2], [T("Decimal", "শতাংশ"), u.decimal], [T("Katha", "কাঠা"), u.katha], [T("Bigha", "বিঘা"), u.bigha], [T("Acre", "একর"), u.acre]].map(([k, v]) => (
                      <div key={k as string} className="rounded-md bg-muted/60 p-2"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold">{fmt(v as number, (v as number) < 10 ? 3 : 0)}</p></div>
                    ))}
                  </div>
                ) : null}
                <p className="text-sm">{T("Perimeter / length", "পরিসীমা / দৈর্ঘ্য")}: <b>{fmt(len / FT, 1)} ft</b> ({fmt(len, 1)} m)</p>
                {pts.length >= 2 && <p className="text-xs text-muted-foreground">{T("Last bearing", "শেষ দিক")}: {bearing(pts[pts.length - 2], pts[pts.length - 1]).toFixed(1)}°</p>}
              </Card>
              <SurveyCalculator T={T} fmt={fmt} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function SurveyCalculator({ T, fmt }: { T: (e: string, b: string) => string; fmt: (n: number, d?: number) => string }) {
  const [q, setQ] = useState({ a: 40, b: 60, c: 40, d: 60, diag: 72.1 });
  const [conv, setConv] = useState({ v: 5, unit: "katha" });
  const [lv, setLv] = useState({ bm: 10, bs: 1.5, fs: 2.1 });
  const toSft: Record<string, number> = { sft: 1, m2: SFT_PER_M2, decimal: 435.6, katha: 720, bigha: 14400, acre: 43560 };
  const unitNames: Record<string, string> = { sft: T("sft", "বর্গফুট"), m2: "m²", decimal: T("Decimal", "শতাংশ"), katha: T("Katha", "কাঠা"), bigha: T("Bigha", "বিঘা"), acre: T("Acre", "একর") };
  const quad = quadArea(q.a, q.b, q.c, q.d, q.diag);
  const cu = landUnits(conv.v * toSft[conv.unit]);
  const hi = lv.bm + lv.bs, rl = hi - lv.fs;
  const num = (val: number, on: (n: number) => void, label: string) => (
    <div className="space-y-1"><Label className="text-xs">{label}</Label><Input type="number" value={val} onChange={(e) => on(Number(e.target.value) || 0)} /></div>
  );
  return (
    <Card className="p-4">
      <p className="font-semibold text-sm mb-2">{T("Survey calculator", "সার্ভে ক্যালকুলেটর")}</p>
      <Tabs defaultValue="plot">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="plot" className="text-xs">{T("Plot area", "প্লটের মাপ")}</TabsTrigger>
          <TabsTrigger value="conv" className="text-xs">{T("Units", "একক")}</TabsTrigger>
          <TabsTrigger value="level" className="text-xs">{T("Levelling", "লেভেল")}</TabsTrigger>
        </TabsList>
        <TabsContent value="plot" className="space-y-2">
          <p className="text-xs text-muted-foreground">{T("4 sides + one diagonal (ft), for irregular plots", "৪ বাহু + একটি কর্ণ (ফুট), অসমান প্লটের জন্য")}</p>
          <div className="grid grid-cols-2 gap-2">
            {num(q.a, (a) => setQ({ ...q, a }), T("Side A", "বাহু A"))}{num(q.b, (b) => setQ({ ...q, b }), T("Side B", "বাহু B"))}
            {num(q.c, (c) => setQ({ ...q, c }), T("Side C", "বাহু C"))}{num(q.d, (d) => setQ({ ...q, d }), T("Side D", "বাহু D"))}
          </div>
          {num(q.diag, (diag) => setQ({ ...q, diag }), T("Diagonal A–B corner to C–D corner", "কর্ণ (A-B কোণ থেকে C-D কোণ)"))}
          <p className="text-sm">{T("Area", "ক্ষেত্রফল")}: <b>{fmt(quad, 0)} sft</b> = {fmt(quad / 720, 2)} {T("katha", "কাঠা")} = {fmt(quad / 435.6, 2)} {T("decimal", "শতাংশ")}</p>
          {quad === 0 && <p className="text-xs text-destructive">{T("These sides cannot form a plot — check the diagonal.", "এই মাপে প্লট হয় না — কর্ণ যাচাই করুন।")}</p>}
        </TabsContent>
        <TabsContent value="conv" className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {num(conv.v, (v) => setConv({ ...conv, v }), T("Value", "মান"))}
            <div className="space-y-1"><Label className="text-xs">{T("Unit", "একক")}</Label>
              <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={conv.unit} onChange={(e) => setConv({ ...conv, unit: e.target.value })}>
                {Object.keys(toSft).map((k) => <option key={k} value={k}>{unitNames[k]}</option>)}
              </select>
            </div>
          </div>
          <div className="text-sm space-y-0.5">
            {(Object.keys(toSft) as (keyof typeof cu)[]).map((k) => <p key={k}>{unitNames[k]}: <b>{fmt(cu[k], 3)}</b></p>)}
          </div>
          <p className="text-xs text-muted-foreground">1 {T("katha", "কাঠা")} = 720 sft · 1 {T("decimal", "শতাংশ")} = 435.6 sft · 1 {T("bigha", "বিঘা")} = 20 {T("katha", "কাঠা")}</p>
        </TabsContent>
        <TabsContent value="level" className="space-y-2">
          <p className="text-xs text-muted-foreground">{T("Height of instrument method", "যন্ত্রের উচ্চতা পদ্ধতি")}</p>
          {num(lv.bm, (bm) => setLv({ ...lv, bm }), T("Benchmark RL (m)", "বেঞ্চমার্ক RL (মি)"))}
          <div className="grid grid-cols-2 gap-2">
            {num(lv.bs, (bs) => setLv({ ...lv, bs }), T("Back sight (m)", "ব্যাক সাইট (মি)"))}
            {num(lv.fs, (fs) => setLv({ ...lv, fs }), T("Fore sight (m)", "ফোর সাইট (মি)"))}
          </div>
          <p className="text-sm">HI = <b>{hi.toFixed(3)} m</b> · {T("New RL", "নতুন RL")} = <b>{rl.toFixed(3)} m</b></p>
          <p className="text-xs text-muted-foreground">{rl >= lv.bm ? T("Point is higher than benchmark (fill not needed)", "বিন্দুটি বেঞ্চমার্কের চেয়ে উঁচু") : T(`Point is ${(lv.bm - rl).toFixed(3)} m lower — may need earth filling`, `বিন্দুটি ${(lv.bm - rl).toFixed(3)} মি নিচু — মাটি ভরাট লাগতে পারে`)}</p>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
