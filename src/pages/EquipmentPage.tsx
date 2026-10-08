import { useMemo, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Download, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCloudState } from "@/lib/cloudState";
import { uid } from "@/lib/inventory";

type EqStatus = "working" | "idle" | "repair";
type Equip = { id: string; name: string; ownership: "own" | "rented"; rate: number; status: EqStatus; nextService: string };
type Log = { id: string; date: string; equipmentId: string; hours: number; fuel: number; note: string };
type EqState = { items: Equip[]; logs: Log[] };

// Sample hourly rates in BDT — users should edit to their actual rates.
const DEFAULT: EqState = {
  items: [
    { id: "e1", name: "Concrete Mixer (1 bag)", ownership: "own", rate: 350, status: "working", nextService: "" },
    { id: "e2", name: "Excavator", ownership: "rented", rate: 2500, status: "idle", nextService: "" },
    { id: "e3", name: "Vibrator", ownership: "own", rate: 150, status: "working", nextService: "" },
  ],
  logs: [],
};
const tk = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function EquipmentPage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const bn = lang === "bn";
  const T = (en: string, b: string) => (bn ? b : en);
  const [st, setSt] = useCloudState<EqState>("civilos.equipment", DEFAULT, { merge: true });
  const [eq, setEq] = useState({ name: "", ownership: "own" as Equip["ownership"], rate: "" });
  const [lg, setLg] = useState({ equipmentId: "e1", hours: "", fuel: "", date: today(), note: "" });

  const soon = new Date(); soon.setDate(soon.getDate() + 7);
  const rows = useMemo(() => st.items.map((e) => {
    const l = st.logs.filter((x) => x.equipmentId === e.id);
    const hours = l.reduce((s, x) => s + x.hours, 0), fuel = l.reduce((s, x) => s + x.fuel, 0);
    return { ...e, hours, fuel, cost: hours * e.rate, due: !!e.nextService && new Date(e.nextService) <= soon };
  }), [st]); // eslint-disable-line react-hooks/exhaustive-deps
  const due = rows.filter((r) => r.due);
  const eName = (id: string) => st.items.find((x) => x.id === id)?.name || "—";
  const upd = (id: string, p: Partial<Equip>) => setSt((s) => ({ ...s, items: s.items.map((e) => (e.id === id ? { ...e, ...p } : e)) }));
  const statusLabel: Record<EqStatus, string> = { working: T("Working", "চলছে"), idle: T("Idle", "বসে আছে"), repair: T("Under repair", "মেরামতে") };

  const addEq = () => {
    if (!eq.name) return toast.error(T("Enter a name", "নাম লিখুন"));
    setSt((s) => ({ ...s, items: [...s.items, { id: uid("e"), name: eq.name, ownership: eq.ownership, rate: +eq.rate || 0, status: "idle", nextService: "" }] }));
    setEq({ name: "", ownership: "own", rate: "" });
  };
  const delEq = (id: string) => {
    if (st.logs.some((l) => l.equipmentId === id)) return toast.error(T("This equipment has usage entries — it cannot be deleted", "এই যন্ত্রের ব্যবহারের এন্ট্রি আছে — মোছা যাবে না"));
    setSt((s) => ({ ...s, items: s.items.filter((e) => e.id !== id) }));
  };
  const addLog = () => {
    const hours = +lg.hours;
    if (!(hours > 0) || hours > 24) return toast.error(T("Enter hours between 0 and 24", "০ থেকে ২৪ এর মধ্যে ঘণ্টা লিখুন"));
    setSt((s) => ({ ...s, logs: [{ id: uid("l"), date: lg.date, equipmentId: lg.equipmentId, hours, fuel: +lg.fuel || 0, note: lg.note }, ...s.logs] }));
    setLg({ ...lg, hours: "", fuel: "", note: "" });
    toast.success(T("Usage saved", "ব্যবহার সেভ হয়েছে"));
  };
  const exportCsv = () => {
    const head = "Equipment,Ownership,Rate/hr (BDT),Status,Hours,Fuel (L),Cost (BDT),Next service\n";
    const body = rows.map((r) => [`"${r.name}"`, r.ownership, r.rate, r.status, r.hours, r.fuel, Math.round(r.cost), r.nextService].join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + head + body], { type: "text/csv" })); a.download = "civilos-equipment.csv"; a.click();
  };

  return (
    <SidebarProvider>
      <SEO title="Equipment — CivilOS AI" description="Track construction equipment: owned or rented, hourly cost in BDT, daily usage hours, fuel and service due dates." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger />
              <h1 className="font-heading font-semibold flex items-center gap-2"><Wrench className="h-4 w-4 text-accent" /> {T("Equipment", "যন্ত্রপাতি")}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="p-4 md:p-6 space-y-4 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Equipment", "যন্ত্র")}</p><p className="font-heading font-semibold text-lg">{st.items.length}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Working now", "এখন চলছে")}</p><p className="font-heading font-semibold text-lg">{st.items.filter((e) => e.status === "working").length}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Total hours", "মোট ঘণ্টা")}</p><p className="font-heading font-semibold text-lg">{rows.reduce((s, r) => s + r.hours, 0)}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Running cost", "চালানোর খরচ")}</p><p className="font-heading font-semibold text-lg">{tk(rows.reduce((s, r) => s + r.cost, 0))}</p></Card>
            </div>
            {due.length > 0 && (
              <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm flex gap-2 items-start">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div><span className="font-medium">{T("Service due within 7 days: ", "৭ দিনের মধ্যে সার্ভিসিং: ")}</span>{due.map((r) => `${r.name} (${r.nextService})`).join(", ")}</div>
              </Card>
            )}
            <Tabs defaultValue="list">
              <TabsList><TabsTrigger value="list">{T("Equipment", "যন্ত্রপাতি")}</TabsTrigger><TabsTrigger value="log">{T("Daily usage", "দৈনিক ব্যবহার")}</TabsTrigger></TabsList>
              <TabsContent value="list" className="space-y-3">
                <Card className="p-3 overflow-x-auto">
                  <div className="flex justify-end mb-2"><Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />CSV / Excel</Button></div>
                  <table className="w-full text-sm min-w-[820px]">
                    <thead><tr className="text-xs text-muted-foreground text-left"><th className="p-1">{T("Name", "নাম")}</th><th className="p-1">{T("Own / rented", "নিজের / ভাড়া")}</th><th className="p-1">{T("৳ per hour", "ঘণ্টায় ৳")}</th><th className="p-1">{T("Status", "অবস্থা")}</th><th className="p-1">{T("Next service", "পরের সার্ভিসিং")}</th><th className="p-1">{T("Hours", "ঘণ্টা")}</th><th className="p-1">{T("Cost", "খরচ")}</th><th /></tr></thead>
                    <tbody>{rows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-1"><Input className="h-8" value={r.name} onChange={(e) => upd(r.id, { name: e.target.value })} /></td>
                        <td className="p-1 w-28"><Select value={r.ownership} onValueChange={(v) => upd(r.id, { ownership: v as Equip["ownership"] })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="own">{T("Own", "নিজের")}</SelectItem><SelectItem value="rented">{T("Rented", "ভাড়া")}</SelectItem></SelectContent></Select></td>
                        <td className="p-1 w-24"><Input className="h-8" type="number" min={0} value={r.rate} onChange={(e) => upd(r.id, { rate: Math.max(0, +e.target.value || 0) })} /></td>
                        <td className="p-1 w-36"><Select value={r.status} onValueChange={(v) => upd(r.id, { status: v as EqStatus })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{(["working", "idle", "repair"] as EqStatus[]).map((k) => <SelectItem key={k} value={k}>{statusLabel[k]}</SelectItem>)}</SelectContent></Select></td>
                        <td className="p-1 w-36"><Input className="h-8" type="date" value={r.nextService} onChange={(e) => upd(r.id, { nextService: e.target.value })} /></td>
                        <td className="p-1 whitespace-nowrap">{r.hours} {r.due && <Badge variant="destructive" className="ml-1 text-[10px]">{T("Service", "সার্ভিস")}</Badge>}</td>
                        <td className="p-1 whitespace-nowrap">{tk(r.cost)}</td>
                        <td className="p-1"><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => delEq(r.id)}><Trash2 className="h-4 w-4" /></Button></td>
                      </tr>))}</tbody>
                  </table>
                </Card>
                <Card className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                  <div className="col-span-2 md:col-span-1"><Label className="text-xs">{T("New equipment", "নতুন যন্ত্র")}</Label><Input className="h-9" value={eq.name} onChange={(e) => setEq({ ...eq, name: e.target.value })} placeholder={T("e.g. Roller", "যেমন রোলার")} /></div>
                  <div><Label className="text-xs">{T("Own / rented", "নিজের / ভাড়া")}</Label><Select value={eq.ownership} onValueChange={(v) => setEq({ ...eq, ownership: v as Equip["ownership"] })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="own">{T("Own", "নিজের")}</SelectItem><SelectItem value="rented">{T("Rented", "ভাড়া")}</SelectItem></SelectContent></Select></div>
                  <div><Label className="text-xs">{T("৳ per hour", "ঘণ্টায় ৳")}</Label><Input className="h-9" type="number" value={eq.rate} onChange={(e) => setEq({ ...eq, rate: e.target.value })} /></div>
                  <Button className="h-9" onClick={addEq}><Plus className="h-4 w-4 mr-1" />{T("Add", "যোগ করুন")}</Button>
                </Card>
              </TabsContent>
              <TabsContent value="log" className="space-y-3">
                <Card className="p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                  <div className="col-span-2"><Label className="text-xs">{T("Equipment", "যন্ত্র")}</Label><Select value={lg.equipmentId} onValueChange={(v) => setLg({ ...lg, equipmentId: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{st.items.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">{T("Hours", "ঘণ্টা")}</Label><Input className="h-9" type="number" min={0} max={24} value={lg.hours} onChange={(e) => setLg({ ...lg, hours: e.target.value })} /></div>
                  <div><Label className="text-xs">{T("Fuel (L)", "জ্বালানি (লি.)")}</Label><Input className="h-9" type="number" min={0} value={lg.fuel} onChange={(e) => setLg({ ...lg, fuel: e.target.value })} /></div>
                  <div><Label className="text-xs">{T("Date", "তারিখ")}</Label><Input className="h-9" type="date" value={lg.date} onChange={(e) => setLg({ ...lg, date: e.target.value })} /></div>
                  <div className="col-span-2 md:col-span-1 flex gap-2"><Input className="h-9" value={lg.note} onChange={(e) => setLg({ ...lg, note: e.target.value })} placeholder={T("Note", "মন্তব্য")} /><Button className="h-9" onClick={addLog} aria-label="Add usage"><Plus className="h-4 w-4" /></Button></div>
                </Card>
                <Card className="p-3 overflow-x-auto">
                  {st.logs.length === 0 ? <p className="text-sm text-muted-foreground">{T("No usage recorded yet.", "এখনো কোনো ব্যবহার লেখা হয়নি।")}</p> : (
                    <table className="w-full text-sm min-w-[520px]">
                      <thead><tr className="text-xs text-muted-foreground text-left"><th className="p-1">{T("Date", "তারিখ")}</th><th className="p-1">{T("Equipment", "যন্ত্র")}</th><th className="p-1">{T("Hours", "ঘণ্টা")}</th><th className="p-1">{T("Fuel", "জ্বালানি")}</th><th className="p-1">{T("Note", "মন্তব্য")}</th><th /></tr></thead>
                      <tbody>{st.logs.map((l) => (
                        <tr key={l.id} className="border-t"><td className="p-1 whitespace-nowrap">{l.date}</td><td className="p-1">{eName(l.equipmentId)}</td><td className="p-1">{l.hours}</td><td className="p-1">{l.fuel ? `${l.fuel} L` : "—"}</td><td className="p-1 text-muted-foreground">{l.note}</td>
                          <td className="p-1"><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setSt((s) => ({ ...s, logs: s.logs.filter((x) => x.id !== l.id) }))}><Trash2 className="h-4 w-4" /></Button></td></tr>))}</tbody>
                    </table>)}
                </Card>
              </TabsContent>
            </Tabs>
            <p className="text-xs text-muted-foreground">{user ? T("Saved to your account — available on all your devices.", "আপনার অ্যাকাউন্টে সেভ হচ্ছে — সব ডিভাইসে দেখা যাবে।") : T("Saved on this device only. Sign in to keep it in your account.", "শুধু এই ডিভাইসে সেভ হচ্ছে। অ্যাকাউন্টে রাখতে লগইন করুন।")} {T("Starting rates are samples — edit them to your actual rates.", "শুরুর দরগুলো নমুনা — আপনার আসল দর দিয়ে বদলে নিন।")}</p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
