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
import { AlertTriangle, Download, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCloudState } from "@/lib/cloudState";
import { DEFAULT_INVENTORY, stockSummary, uid, type Inventory, type POStatus, type TxnType } from "@/lib/inventory";

const tk = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function InventoryPage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const bn = lang === "bn";
  const T = (en: string, b: string) => (bn ? b : en);
  const [inv, setInv] = useCloudState<Inventory>("civilos.inventory", DEFAULT_INVENTORY, { merge: true });
  const rows = useMemo(() => stockSummary(inv), [inv]);
  const low = rows.filter((r) => r.low);
  const totalValue = rows.reduce((s, r) => s + Math.max(0, r.value), 0);
  const mName = (id: string) => { const m = inv.materials.find((x) => x.id === id); return m ? (bn ? m.nameBn : m.name) : "—"; };
  const mUnit = (id: string) => inv.materials.find((x) => x.id === id)?.unit || "";
  const vName = (id: string) => inv.vendors.find((x) => x.id === id)?.name || "—";

  // ---- forms ----
  const [tx, setTx] = useState({ materialId: "m1", type: "in" as TxnType, qty: "", date: today(), note: "" });
  const [mat, setMat] = useState({ name: "", unit: "", rate: "", minStock: "" });
  const [ven, setVen] = useState({ name: "", phone: "", items: "" });
  const [po, setPo] = useState({ vendorId: "", materialId: "m1", qty: "", rate: "" });

  const addTxn = () => {
    const qty = +tx.qty;
    if (!qty || qty <= 0) return toast.error(T("Enter a quantity", "পরিমাণ লিখুন"));
    const r = rows.find((x) => x.id === tx.materialId);
    if (tx.type !== "in" && r && qty > r.stock) return toast.error(T(`Only ${r.stock} ${r.unit} in stock`, `স্টকে আছে মাত্র ${r.stock} ${r.unit}`));
    setInv((s) => ({ ...s, txns: [{ id: uid("t"), date: tx.date, materialId: tx.materialId, type: tx.type, qty, note: tx.note }, ...s.txns] }));
    setTx({ ...tx, qty: "", note: "" });
    toast.success(T("Entry saved", "এন্ট্রি সেভ হয়েছে"));
  };
  const addMat = () => {
    if (!mat.name || !mat.unit) return toast.error(T("Name and unit are required", "নাম ও একক দরকার"));
    setInv((s) => ({ ...s, materials: [...s.materials, { id: uid("m"), name: mat.name, nameBn: mat.name, unit: mat.unit, rate: +mat.rate || 0, minStock: +mat.minStock || 0 }] }));
    setMat({ name: "", unit: "", rate: "", minStock: "" });
  };
  const updMat = (id: string, p: Record<string, unknown>) => setInv((s) => ({ ...s, materials: s.materials.map((m) => (m.id === id ? { ...m, ...p } : m)) }));
  const delMat = (id: string) => {
    if (inv.txns.some((t) => t.materialId === id) || inv.pos.some((p) => p.materialId === id)) return toast.error(T("This material has entries — it cannot be deleted", "এই মালামালের এন্ট্রি আছে — মোছা যাবে না"));
    setInv((s) => ({ ...s, materials: s.materials.filter((m) => m.id !== id) }));
  };
  const addVen = () => {
    if (!ven.name) return toast.error(T("Vendor name is required", "সরবরাহকারীর নাম দরকার"));
    setInv((s) => ({ ...s, vendors: [...s.vendors, { id: uid("v"), ...ven }] }));
    setVen({ name: "", phone: "", items: "" });
  };
  const addPo = () => {
    if (!po.vendorId) return toast.error(T("Add/select a vendor first", "আগে সরবরাহকারী যোগ/নির্বাচন করুন"));
    if (!(+po.qty > 0)) return toast.error(T("Enter a quantity", "পরিমাণ লিখুন"));
    const m = inv.materials.find((x) => x.id === po.materialId);
    setInv((s) => ({ ...s, pos: [{ id: uid("p"), no: `PO-${String(s.pos.length + 1).padStart(3, "0")}`, date: today(), vendorId: po.vendorId, materialId: po.materialId, qty: +po.qty, rate: +po.rate || m?.rate || 0, status: "draft" }, ...s.pos] }));
    setPo({ ...po, qty: "", rate: "" });
  };
  const setPoStatus = (id: string, status: POStatus) => setInv((s) => {
    const p = s.pos.find((x) => x.id === id);
    if (!p || p.status === "received") return s;
    const txns = status === "received" ? [{ id: uid("t"), date: today(), materialId: p.materialId, type: "in" as TxnType, qty: p.qty, note: `${p.no} — ${vName(p.vendorId)}`, poId: p.id }, ...s.txns] : s.txns;
    return { ...s, txns, pos: s.pos.map((x) => (x.id === id ? { ...x, status } : x)) };
  });

  const exportCsv = () => {
    const head = "Material,Unit,Rate (BDT),Received,Used,Wastage,Wastage %,In stock,Min stock,Value (BDT),Status\n";
    const body = rows.map((r) => [`"${bn ? r.nameBn : r.name}"`, r.unit, r.rate, r.received, r.used, r.wasted, r.wastagePct.toFixed(1), r.stock, r.minStock, Math.round(r.value), r.low ? "LOW" : "OK"].join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + head + body], { type: "text/csv" })); a.download = "civilos-inventory.csv"; a.click();
  };

  const typeLabel: Record<TxnType, string> = { in: T("Stock in", "মাল এসেছে"), out: T("Used", "ব্যবহার"), wastage: T("Wastage", "অপচয়") };
  const statusLabel: Record<POStatus, string> = { draft: T("Draft", "খসড়া"), ordered: T("Ordered", "অর্ডার দেওয়া"), received: T("Received", "পাওয়া গেছে"), cancelled: T("Cancelled", "বাতিল") };

  return (
    <SidebarProvider>
      <SEO title="Inventory & Materials — CivilOS AI" description="Track construction material stock in BDT: stock in/out, wastage, low-stock alerts, vendors and purchase orders." />
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2"><SidebarTrigger />
              <h1 className="font-heading font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-accent" /> {T("Inventory & Materials", "মালামাল ও স্টক")}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="p-4 md:p-6 space-y-4 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Materials", "মালামাল")}</p><p className="font-heading font-semibold text-lg">{inv.materials.length}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Stock value", "স্টকের মূল্য")}</p><p className="font-heading font-semibold text-lg">{tk(totalValue)}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Low stock", "স্টক কম")}</p><p className={`font-heading font-semibold text-lg ${low.length ? "text-destructive" : ""}`}>{low.length}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">{T("Open POs", "চলমান অর্ডার")}</p><p className="font-heading font-semibold text-lg">{inv.pos.filter((p) => p.status === "draft" || p.status === "ordered").length}</p></Card>
            </div>

            {low.length > 0 && (
              <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm flex gap-2 items-start">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div><span className="font-medium">{T("Low stock: ", "স্টক কম: ")}</span>{low.map((r) => `${bn ? r.nameBn : r.name} (${r.stock}/${r.minStock} ${r.unit})`).join(", ")}</div>
              </Card>
            )}

            <Tabs defaultValue="stock">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="stock">{T("Stock", "স্টক")}</TabsTrigger>
                <TabsTrigger value="entries">{T("In / Out", "আসা / ব্যবহার")}</TabsTrigger>
                <TabsTrigger value="po">{T("Purchase orders", "ক্রয় আদেশ")}</TabsTrigger>
                <TabsTrigger value="vendors">{T("Vendors", "সরবরাহকারী")}</TabsTrigger>
              </TabsList>

              <TabsContent value="stock" className="space-y-3">
                <Card className="p-3 overflow-x-auto">
                  <div className="flex justify-end mb-2"><Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />CSV / Excel</Button></div>
                  <table className="w-full text-sm min-w-[760px]">
                    <thead><tr className="text-xs text-muted-foreground text-left">
                      <th className="p-1">{T("Material", "মালামাল")}</th><th className="p-1">{T("Unit", "একক")}</th><th className="p-1">{T("Rate ৳", "দর ৳")}</th><th className="p-1">{T("Min", "সর্বনিম্ন")}</th><th className="p-1">{T("In stock", "স্টকে")}</th><th className="p-1">{T("Wastage", "অপচয়")}</th><th className="p-1">{T("Value", "মূল্য")}</th><th />
                    </tr></thead>
                    <tbody>{rows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-1"><Input className="h-8" value={bn ? r.nameBn : r.name} onChange={(e) => updMat(r.id, bn ? { nameBn: e.target.value } : { name: e.target.value })} /></td>
                        <td className="p-1 w-20"><Input className="h-8" value={r.unit} onChange={(e) => updMat(r.id, { unit: e.target.value })} /></td>
                        <td className="p-1 w-24"><Input className="h-8" type="number" min={0} value={r.rate} onChange={(e) => updMat(r.id, { rate: Math.max(0, +e.target.value || 0) })} /></td>
                        <td className="p-1 w-24"><Input className="h-8" type="number" min={0} value={r.minStock} onChange={(e) => updMat(r.id, { minStock: Math.max(0, +e.target.value || 0) })} /></td>
                        <td className="p-1 whitespace-nowrap">{r.stock.toLocaleString("en-IN")} {r.unit} {r.low && <Badge variant="destructive" className="ml-1 text-[10px]">{T("Low", "কম")}</Badge>}</td>
                        <td className="p-1 whitespace-nowrap">{r.wasted} ({r.wastagePct.toFixed(1)}%)</td>
                        <td className="p-1 whitespace-nowrap">{tk(r.value)}</td>
                        <td className="p-1"><Button size="icon" variant="ghost" onClick={() => delMat(r.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button></td>
                      </tr>))}</tbody>
                  </table>
                </Card>
                <Card className="p-3 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div className="col-span-2"><Label className="text-xs">{T("New material", "নতুন মালামাল")}</Label><Input className="h-9" value={mat.name} onChange={(e) => setMat({ ...mat, name: e.target.value })} placeholder={T("e.g. Tiles", "যেমন টাইলস")} /></div>
                  <div><Label className="text-xs">{T("Unit", "একক")}</Label><Input className="h-9" value={mat.unit} onChange={(e) => setMat({ ...mat, unit: e.target.value })} placeholder="sft" /></div>
                  <div><Label className="text-xs">{T("Rate ৳", "দর ৳")}</Label><Input className="h-9" type="number" value={mat.rate} onChange={(e) => setMat({ ...mat, rate: e.target.value })} /></div>
                  <div className="flex gap-2"><div className="flex-1"><Label className="text-xs">{T("Min stock", "সর্বনিম্ন")}</Label><Input className="h-9" type="number" value={mat.minStock} onChange={(e) => setMat({ ...mat, minStock: e.target.value })} /></div><Button className="h-9 self-end" onClick={addMat} aria-label="Add material"><Plus className="h-4 w-4" /></Button></div>
                </Card>
              </TabsContent>

              <TabsContent value="entries" className="space-y-3">
                <Card className="p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                  <div className="col-span-2"><Label className="text-xs">{T("Material", "মালামাল")}</Label>
                    <Select value={tx.materialId} onValueChange={(v) => setTx({ ...tx, materialId: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{inv.materials.map((m) => <SelectItem key={m.id} value={m.id}>{bn ? m.nameBn : m.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">{T("Type", "ধরন")}</Label>
                    <Select value={tx.type} onValueChange={(v) => setTx({ ...tx, type: v as TxnType })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{(["in", "out", "wastage"] as TxnType[]).map((k) => <SelectItem key={k} value={k}>{typeLabel[k]}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">{T("Qty", "পরিমাণ")} ({mUnit(tx.materialId)})</Label><Input className="h-9" type="number" min={0} value={tx.qty} onChange={(e) => setTx({ ...tx, qty: e.target.value })} /></div>
                  <div><Label className="text-xs">{T("Date", "তারিখ")}</Label><Input className="h-9" type="date" value={tx.date} onChange={(e) => setTx({ ...tx, date: e.target.value })} /></div>
                  <div className="col-span-2 md:col-span-1 flex gap-2"><Input className="h-9" value={tx.note} onChange={(e) => setTx({ ...tx, note: e.target.value })} placeholder={T("Note", "মন্তব্য")} /><Button className="h-9" onClick={addTxn}><Plus className="h-4 w-4" /></Button></div>
                </Card>
                <Card className="p-3 overflow-x-auto">
                  {inv.txns.length === 0 ? <p className="text-sm text-muted-foreground">{T("No entries yet. Record material arriving at site, used, or wasted.", "এখনো কোনো এন্ট্রি নেই। সাইটে মাল আসা, ব্যবহার বা অপচয় লিখুন।")}</p> : (
                    <table className="w-full text-sm min-w-[560px]">
                      <thead><tr className="text-xs text-muted-foreground text-left"><th className="p-1">{T("Date", "তারিখ")}</th><th className="p-1">{T("Material", "মালামাল")}</th><th className="p-1">{T("Type", "ধরন")}</th><th className="p-1">{T("Qty", "পরিমাণ")}</th><th className="p-1">{T("Note", "মন্তব্য")}</th><th /></tr></thead>
                      <tbody>{inv.txns.map((t) => (
                        <tr key={t.id} className="border-t">
                          <td className="p-1 whitespace-nowrap">{t.date}</td><td className="p-1">{mName(t.materialId)}</td>
                          <td className="p-1"><Badge variant={t.type === "in" ? "default" : t.type === "wastage" ? "destructive" : "secondary"} className="text-[10px]">{typeLabel[t.type]}</Badge></td>
                          <td className="p-1 whitespace-nowrap">{t.qty} {mUnit(t.materialId)}</td><td className="p-1 text-muted-foreground">{t.note}</td>
                          <td className="p-1">{!t.poId && <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setInv((s) => ({ ...s, txns: s.txns.filter((x) => x.id !== t.id) }))}><Trash2 className="h-4 w-4" /></Button>}</td>
                        </tr>))}</tbody>
                    </table>)}
                </Card>
              </TabsContent>

              <TabsContent value="po" className="space-y-3">
                <Card className="p-3 grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                  <div><Label className="text-xs">{T("Vendor", "সরবরাহকারী")}</Label>
                    <Select value={po.vendorId} onValueChange={(v) => setPo({ ...po, vendorId: v })}><SelectTrigger className="h-9"><SelectValue placeholder={T("Select", "নির্বাচন")} /></SelectTrigger>
                      <SelectContent>{inv.vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">{T("Material", "মালামাল")}</Label>
                    <Select value={po.materialId} onValueChange={(v) => setPo({ ...po, materialId: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{inv.materials.map((m) => <SelectItem key={m.id} value={m.id}>{bn ? m.nameBn : m.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">{T("Qty", "পরিমাণ")} ({mUnit(po.materialId)})</Label><Input className="h-9" type="number" value={po.qty} onChange={(e) => setPo({ ...po, qty: e.target.value })} /></div>
                  <div><Label className="text-xs">{T("Rate ৳", "দর ৳")}</Label><Input className="h-9" type="number" value={po.rate} placeholder={String(inv.materials.find((m) => m.id === po.materialId)?.rate ?? "")} onChange={(e) => setPo({ ...po, rate: e.target.value })} /></div>
                  <Button className="h-9" onClick={addPo}><Plus className="h-4 w-4 mr-1" />{T("Create PO", "অর্ডার তৈরি")}</Button>
                </Card>
                {inv.vendors.length === 0 && <p className="text-xs text-muted-foreground">{T("Add a vendor in the Vendors tab first.", "আগে সরবরাহকারী ট্যাবে একজন সরবরাহকারী যোগ করুন।")}</p>}
                <Card className="p-3 overflow-x-auto">
                  {inv.pos.length === 0 ? <p className="text-sm text-muted-foreground">{T("No purchase orders yet. Marking an order Received adds it to stock automatically.", "এখনো কোনো ক্রয় আদেশ নেই। অর্ডার \"পাওয়া গেছে\" করলে নিজে থেকেই স্টকে যোগ হয়।")}</p> : (
                    <table className="w-full text-sm min-w-[640px]">
                      <thead><tr className="text-xs text-muted-foreground text-left"><th className="p-1">PO</th><th className="p-1">{T("Vendor", "সরবরাহকারী")}</th><th className="p-1">{T("Material", "মালামাল")}</th><th className="p-1">{T("Qty", "পরিমাণ")}</th><th className="p-1">{T("Amount", "টাকা")}</th><th className="p-1">{T("Status", "অবস্থা")}</th></tr></thead>
                      <tbody>{inv.pos.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-1 whitespace-nowrap">{p.no}<div className="text-[10px] text-muted-foreground">{p.date}</div></td>
                          <td className="p-1">{vName(p.vendorId)}</td><td className="p-1">{mName(p.materialId)}</td>
                          <td className="p-1 whitespace-nowrap">{p.qty} {mUnit(p.materialId)}</td><td className="p-1 whitespace-nowrap">{tk(p.qty * p.rate)}</td>
                          <td className="p-1 w-40">{p.status === "received" || p.status === "cancelled" ? <Badge variant={p.status === "received" ? "default" : "secondary"} className="text-[10px]">{statusLabel[p.status]}</Badge> : (
                            <Select value={p.status} onValueChange={(v) => setPoStatus(p.id, v as POStatus)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>{(["draft", "ordered", "received", "cancelled"] as POStatus[]).map((s) => <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>)}</SelectContent></Select>)}</td>
                        </tr>))}</tbody>
                    </table>)}
                </Card>
              </TabsContent>

              <TabsContent value="vendors" className="space-y-3">
                <Card className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                  <div><Label className="text-xs">{T("Name", "নাম")}</Label><Input className="h-9" value={ven.name} onChange={(e) => setVen({ ...ven, name: e.target.value })} /></div>
                  <div><Label className="text-xs">{T("Phone", "ফোন")}</Label><Input className="h-9" value={ven.phone} onChange={(e) => setVen({ ...ven, phone: e.target.value })} placeholder="01XXXXXXXXX" /></div>
                  <div><Label className="text-xs">{T("Supplies", "যা সরবরাহ করে")}</Label><Input className="h-9" value={ven.items} onChange={(e) => setVen({ ...ven, items: e.target.value })} placeholder={T("Cement, rod", "সিমেন্ট, রড")} /></div>
                  <Button className="h-9" onClick={addVen}><Plus className="h-4 w-4 mr-1" />{T("Add vendor", "যোগ করুন")}</Button>
                </Card>
                <Card className="p-3">
                  {inv.vendors.length === 0 ? <p className="text-sm text-muted-foreground">{T("No vendors yet.", "এখনো কোনো সরবরাহকারী নেই।")}</p> : (
                    <div className="divide-y">{inv.vendors.map((v) => (
                      <div key={v.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                        <div><p className="font-medium">{v.name}</p><p className="text-xs text-muted-foreground">{[v.phone, v.items].filter(Boolean).join(" · ")}</p></div>
                        {!inv.pos.some((p) => p.vendorId === v.id) && <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setInv((s) => ({ ...s, vendors: s.vendors.filter((x) => x.id !== v.id) }))}><Trash2 className="h-4 w-4" /></Button>}
                      </div>))}</div>)}
                </Card>
              </TabsContent>
            </Tabs>
            <p className="text-xs text-muted-foreground">{user ? T("Saved to your account — available on all your devices.", "আপনার অ্যাকাউন্টে সেভ হচ্ছে — সব ডিভাইসে দেখা যাবে।") : T("Saved on this device only. Sign in to keep it in your account.", "শুধু এই ডিভাইসে সেভ হচ্ছে। অ্যাকাউন্টে রাখতে লগইন করুন।")} {T("Starting rates are samples — edit them to today's market price.", "শুরুর দরগুলো নমুনা — আজকের বাজারদর অনুযায়ী বদলে নিন।")}</p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
