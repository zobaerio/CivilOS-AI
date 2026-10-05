import { Suspense, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Edges } from "@react-three/drei";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Box, Camera, LayoutGrid } from "lucide-react";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_INPUT, generatePlan, type PlanInput, type Room } from "@/lib/planGenerator";

const FT = 0.3048;
const FLOOR_H = 10 * FT;
const FINISHES = {
  white: { en: "White plaster", bn: "সাদা প্লাস্টার", wall: "#f1f5f9", floor: "#cbd5e1" },
  brick: { en: "Exposed brick", bn: "ইটের দেয়াল", wall: "#b45a3c", floor: "#a8a29e" },
  concrete: { en: "Fair-face concrete", bn: "কংক্রিট", wall: "#9ca3af", floor: "#6b7280" },
  wood: { en: "Warm wood", bn: "কাঠের ফিনিশ", wall: "#e7d3b5", floor: "#a16207" },
} as const;
type FinishKey = keyof typeof FINISHES;
const FURN: Record<string, { w: number; d: number; h: number; c: string }> = {
  Bed: { w: 6, d: 6.5, h: 1.8, c: "#60a5fa" }, Drawing: { w: 7, d: 3, h: 2.6, c: "#f97316" },
  Dining: { w: 5, d: 3, h: 2.5, c: "#a16207" }, Kitchen: { w: 2, d: 6, h: 3, c: "#64748b" },
  Bath: { w: 2, d: 1.5, h: 1.5, c: "#e2e8f0" },
};

function RoomMesh({ r, ox, oz, y, fin, showFurniture, bn }: { r: Room; ox: number; oz: number; y: number; fin: FinishKey; showFurniture: boolean; bn: boolean }) {
  const w = r.w * FT, d = r.h * FT, cx = ox + (r.x + r.w / 2) * FT, cz = oz - (r.y + r.h / 2) * FT;
  const t = 0.12, wallH = FLOOR_H - 0.15, f = FINISHES[fin];
  const key = Object.keys(FURN).find((k) => r.name.includes(k));
  const fu = key ? FURN[key] : null;
  const walls: [number, number, number, number][] = [
    [cx, cz - d / 2, w, t], [cx, cz + d / 2, w, t], [cx - w / 2, cz, t, d], [cx + w / 2, cz, t, d],
  ];
  return (
    <group>
      <mesh position={[cx, y + 0.05, cz]} receiveShadow>
        <boxGeometry args={[w, 0.1, d]} /><meshStandardMaterial color={f.floor} />
      </mesh>
      {walls.map(([x, z, ww, dd], i) => (
        <mesh key={i} position={[x, y + wallH / 2 + 0.1, z]} castShadow>
          <boxGeometry args={[ww, wallH, dd]} /><meshStandardMaterial color={f.wall} transparent opacity={0.85} />
          <Edges color="#0f172a" />
        </mesh>
      ))}
      {showFurniture && fu && (
        <mesh position={[cx, y + 0.1 + (fu.h * FT) / 2, cz]}>
          <boxGeometry args={[Math.min(fu.w * FT, w * 0.7), fu.h * FT, Math.min(fu.d * FT, d * 0.7)]} />
          <meshStandardMaterial color={fu.c} />
        </mesh>
      )}
      <Text position={[cx, y + wallH + 0.4, cz]} fontSize={0.35} color="#0f172a" anchorX="center" outlineWidth={0.02} outlineColor="#ffffff">
        {bn ? r.nameBn : r.name}
      </Text>
    </group>
  );
}

function CameraRig({ view, size }: { view: string; size: number }) {
  const { camera } = useThree();
  const last = useRef("");
  if (last.current !== view) {
    last.current = view;
    const d = size * 2.2;
    const pos: Record<string, [number, number, number]> = { iso: [d, d, d], top: [0, d * 1.6, 0.01], front: [0, d * 0.4, d * 1.3], side: [d * 1.3, d * 0.4, 0] };
    camera.position.set(...pos[view]);
    camera.lookAt(0, 0, 0);
  }
  return null;
}

export default function BimStudioPage() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const L = (en: string, b: string) => (bn ? b : en);
  const inp: PlanInput = useMemo(() => {
    try { return { ...DEFAULT_INPUT, ...JSON.parse(localStorage.getItem("civilos.plan") || "{}") }; } catch { return DEFAULT_INPUT; }
  }, []);
  const plan = useMemo(() => generatePlan(inp), [inp]);
  const [shown, setShown] = useState(Math.min(inp.floors, 3));
  const [fin, setFin] = useState<FinishKey>("white");
  const [furniture, setFurniture] = useState(true);
  const [view, setView] = useState("iso");
  const ox = -(plan.buildW * FT) / 2, oz = (plan.buildD * FT) / 2;
  const size = Math.max(plan.buildW, plan.buildD) * FT;

  const snapshot = () => {
    const c = document.querySelector<HTMLCanvasElement>("#bim-canvas canvas");
    if (!c) return;
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "civilos-bim.png"; a.click();
  };

  return (
    <SidebarProvider>
      <SEO title="BIM Studio 3D — CivilOS AI" description="3D model of your generated floor plan with finishes, furniture and camera presets." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger />
              <h1 className="font-heading font-semibold flex items-center gap-2"><Box className="h-4 w-4 text-accent" /> BIM Studio 3D</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="p-4 md:p-6 grid lg:grid-cols-[300px_1fr] gap-5">
            <Card className="p-4 space-y-5 h-fit">
              <p className="text-sm text-muted-foreground">
                {L("Model built from your plan", "আপনার প্ল্যান থেকে মডেল")}: {inp.plotWidth}'×{inp.plotDepth}', {inp.bedrooms} {L("bed", "বেড")}, {inp.floors} {L("floors", "তলা")}
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild><Link to="/plan-generator"><LayoutGrid className="h-4 w-4 mr-1" /> {L("Edit plan", "প্ল্যান বদলান")}</Link></Button>
              <div className="space-y-2">
                <Label className="text-xs">{L("Floors shown", "দেখানো তলা")}: {shown} / {inp.floors}</Label>
                <Slider min={1} max={inp.floors} step={1} value={[shown]} onValueChange={([v]) => setShown(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{L("Finish", "ফিনিশ")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(FINISHES) as FinishKey[]).map((k) => (
                    <Button key={k} size="sm" variant={fin === k ? "default" : "outline"} onClick={() => setFin(k)} className="text-xs">
                      {bn ? FINISHES[k].bn : FINISHES[k].en}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{L("Camera", "ক্যামেরা")}</Label>
                <div className="grid grid-cols-4 gap-1">
                  {[["iso", "3D"], ["top", L("Top", "উপর")], ["front", L("Front", "সামনে")], ["side", L("Side", "পাশে")]].map(([v, l]) => (
                    <Button key={v} size="sm" variant={view === v ? "default" : "outline"} className="text-xs px-1" onClick={() => setView(v)}>{l}</Button>
                  ))}
                </div>
              </div>
              <Button size="sm" variant={furniture ? "default" : "outline"} className="w-full" onClick={() => setFurniture(!furniture)}>
                {furniture ? L("Hide furniture", "ফার্নিচার লুকান") : L("Show furniture", "ফার্নিচার দেখান")}
              </Button>
              <Button size="sm" variant="secondary" className="w-full" onClick={snapshot}><Camera className="h-4 w-4 mr-1" /> {L("Save image", "ছবি সংরক্ষণ")}</Button>
            </Card>
            <Card id="bim-canvas" className="h-[60vh] lg:h-[calc(100vh-8rem)] overflow-hidden bg-muted/40">
              <Canvas shadows camera={{ fov: 45, position: [size, size, size] }} gl={{ preserveDrawingBuffer: true }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 20, 10]} intensity={1.1} castShadow />
                <Suspense fallback={null}>
                  <CameraRig view={view} size={size} />
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, (plan.setbacks.front - plan.setbacks.rear) * FT / 2]} receiveShadow>
                    <planeGeometry args={[inp.plotWidth * FT, inp.plotDepth * FT]} />
                    <meshStandardMaterial color="#86efac" />
                  </mesh>
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, oz + plan.setbacks.front * FT + 1.5]}>
                    <planeGeometry args={[inp.plotWidth * FT * 1.4, 3]} />
                    <meshStandardMaterial color="#334155" />
                  </mesh>
                  {Array.from({ length: shown }).map((_, f) =>
                    plan.rooms.map((r) => (
                      <RoomMesh key={`${f}-${r.name}`} r={r} ox={ox} oz={oz} y={f * FLOOR_H} fin={fin} showFurniture={furniture && f === shown - 1} bn={bn && f === shown - 1} />
                    )),
                  )}
                </Suspense>
                <OrbitControls makeDefault target={[0, 0, 0]} />
              </Canvas>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
