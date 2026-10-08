import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCloudState } from "@/lib/cloudState";
import {
  DEFAULT_FINANCE, billDue, billNet, cashFlowSummary, invoiceDue, invoiceTotal, monthlySeries,
  type BillStatus, type Finance, type InvoiceStatus,
} from "@/lib/finance";
import { uid } from "@/lib/inventory";

const tk = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function FinancePage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const bn = lang === "bn";
  const T = (en: string, b: string) => (bn ? b : en);
  const [fin, setFin] = useCloudState<Finance>("civilos.finance", DEFAULT_FINANCE, { merge: true });
  const { pathname } = useLocation();
  const tabFor = (p: string) => (p === "/contractor-bills" ? "bills" : p === "/payments" ? "payments" : p === "/cash-flow" ? "cash" : "invoices");
  const [tab, setTab] = useState(tabFor(pathname));
  useEffect(() => setTab(tabFor(pathname)), [pathname]);

  const sum = useMemo(() => cashFlowSummary(fin), [fin]);
  const series = useMemo(() => monthlySeries(fin, 6), [fin]);
  const maxBar = Math.max(1, ...series.flatMap((s) => [s.inflow, s.outflow]));

  const invLabel: Record<InvoiceStatus, string> = { draft: T("Draft", "খসড়া"), sent: T("Sent", "পাঠানো"), paid: T("Paid", "পরিশোধিত"), cancelled: T("Cancelled", "বাতিল") };
  const billLabel: Record<BillStatus, string> = { submitted: T("Submitted", "জমা"), checked: T("Checked", "যাচাইকৃত"), approved: T("Approved", "অনুমোদিত"), paid: T("Paid", "পরিশোধিত") };

  // ---- invoice form ----
  const [iv, setIv] = useState({ client: "", description: "", amount: "", vatPct: "0" });
  const addInvoice = () => {
    if (!iv.client || !(+iv.amount > 0)) return toast.error(T("Client and amount are required", "ক্লায়েন্ট ও টাকার পরিমাণ দরকার"));
    setFin((s) => ({ ...s, invoices: [{ id: uid("i"), no: `INV-${String(s.invoices.length + 1).padStart(3, "0")}`, date: today(), client: iv.client, description: iv.description, amount: +iv.amount, vatPct: +iv.vatPct || 0, status: "draft", paidAmount: 0 }, ...s.invoices] }));
    setIv({ client: "", description: "", amount: "", vatPct: "0" });
    toast.success(T("Invoice created", "ইনভয়েস তৈরি হয়েছে"));
  };
  const setInvStatus = (id: string, status: InvoiceStatus) => setFin((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)) }));

  // ---- contractor bill form ----
  const [cb, setCb] = useState({ contractor: "", work: "", gross: "", deductionPct: "5" });
  const addBill = () => {
    if (!cb.contractor || !(+cb.gross > 0)) return toast.error(T("Contractor and amount are required", "ঠিকাদার ও টাকার পরিমাণ দরকার"));
    setFin((s) => ({ ...s, bills: [{ id: uid("b"), no: `CB-${String(s.bills.length + 1).padStart(3, "0")}`, date: today(), contractor: cb.contractor, work: cb.work, gross: +cb.gross, deductionPct: +cb.deductionPct || 0, status: "submitted", paidAmount: 0 }, ...s.bills] }));
    setCb({ contractor: "", work: "", gross: "", deductionPct: "5" });
    toast.success(T("Bill saved", "বিল সেভ হয়েছে"));
  };
  const setBillStatus = (id: string, status: BillStatus) => setFin((s) => ({ ...s, bills: s.bills.map((b) => (b.id === id ? { ...b, status } : b)) }));

  // ---- payment form ----
  const [pay, setPay] = useState({ kind: "invoice" as "invoice" | "bill", refId: "", amount: "", method: "bKash", note: "" });
  const payTargets = pay.kind === "invoice" ? fin.invoices.filter((i) => invoiceDue(i) > 0 && i.status !== "cancelled") : fin.bills.filter((b) => billDue(b) > 0);
  const addPayment = () => {
    const amt = +pay.amount;
    if (!pay.refId || !(amt > 0)) return toast.error(T("Select a bill/invoice and enter an amount", "বিল/ইনভয়েস নির্বাচন করে টাকার পরিমাণ লিখুন"));
    const due = pay.kind === "invoice" ? invoiceDue(fin.invoices.find((i) => i.id === pay.refId)!) : billDue(fin.bills.find((b) => b.id === pay.refId)!);
    if (amt > due + 0.01) return toast.error(T(`Due is only ${tk(due)}`, `বাকি আছে মাত্র ${tk(due)}`));
    setFin((s) => ({
      ...s,
      payments: [{ id: uid("p"), date: today(), kind: pay.kind, refId: pay.refId, amount: amt, method: pay.method, note: pay.note }, ...s.payments],
      invoices: pay.kind === "invoice" ? s.invoices.map((i) => (i.id === pay.refId ? { ...i, paidAmount: i.paidAmount + amt, status: i.paidAmount + amt >= invoiceTotal(i) - 0.01 ? "paid" : i.status } : i)) : s.invoices,
      bills: pay.kind === "bill" ? s.bills.map((b) => (b.id === pay.refId ? { ...b, paidAmount: b.paidAmount + amt, status: b.paidAmount + amt >= billNet(b) - 0.01 ? "paid" : b.status } : b)) : s.bills,
    }));
    setPay({ ...pay, refId: "", amount: "", note: "" });
    toast.success(T("Payment recorded", "পেমেন্ট লেখা হয়েছে"));
  };
  const refName = (kind: string, refId: string) =>
    kind === "invoice" ? fin.invoices.find((i) => i.id === refId)?.no || "—" : fin.bills.find((b) => b.id === refId)?.no || "—";

  // ---- cash entry form ----
  const [ce, setCe] = useState({ kind: "inflow" as "inflow" | "outflow", category: "", amount: "", note: "" });
  const addCash = () => {
    if (!ce.category || !(+ce.amount > 0)) return toast.error(T("Category and amount are required", "খাত ও টাকার পরিমাণ দরকার"));
    setFin((s) => ({ ...s, cash: [{ id: uid("c"), date: today(), kind: ce.kind, category: ce.category, amount: +ce.amount, note: ce.note }, ...s.cash] }));
    setCe({ kind: ce.kind, category: "", amount: "", note: "" });
    toast.success(T("Entry saved", "এন্ট্রি সেভ হয়েছে"));
  };

  const exportCsv = () => {
    const head = "Type,No,Date,Party,Details,Total (BDT),Paid (BDT),Due (BDT),Status\n";
    const invRows = fin.invoices.map((i) => ["Invoice", i.no, i.date, `"${i.client}"`, `"${i.description}"`, Math.round(invoiceTotal(i)), Math.round(i.paidAmount), Math.round(invoiceDue(i)), i.status].join(","));
    const billRows = fin.bills.map((b) => ["Contractor bill", b.no, b.date, `"${b.contractor}"`, `"${b.work}"`, Math.round(billNet(b)), Math.round(b.paidAmount), Math.round(billDue(b)), b.status].join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + head + [...invRows, ...billRows].join("\n")], { type: "text/csv" }));
    a.download = "civilos-finance.csv";
    a.click();
  };

  const th = "text-left text-xs font-medium text-muted-foreground p-2";
  const td = "p-2 text-sm";

  return (
    <SidebarProvider>
      <SEO title="Finance — CivilOS AI" description="Invoices, contractor bills, payments and cash flow in BDT." />
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-6 space-y-4 overflow-x-hidden">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">{T("Finance", "অর্থ হিসাব")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />{T("Export CSV", "CSV নামান")}</Button>
              <ThemeToggle />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />{T("Money in", "টাকা এসেছে")}</div><div className="text-lg font-bold">{tk(sum.inflow)}</div></Card>
            <Card className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingDown className="h-3.5 w-3.5" />{T("Money out", "টাকা গেছে")}</div><div className="text-lg font-bold">{tk(sum.outflow)}</div></Card>
            <Card className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" />{T("Balance", "ব্যালান্স")}</div><div className={`text-lg font-bold ${sum.balance < 0 ? "text-destructive" : ""}`}>{tk(sum.balance)}</div></Card>
            <Card className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Receipt className="h-3.5 w-3.5" />{T("Receivable / Payable", "পাবো / দেবো")}</div><div className="text-lg font-bold">{tk(sum.receivable)} / {tk(sum.payable)}</div></Card>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="invoices">{T("Invoices", "ইনভয়েস")}</TabsTrigger>
              <TabsTrigger value="bills">{T("Contractor Bills", "ঠিকাদারের বিল")}</TabsTrigger>
              <TabsTrigger value="payments">{T("Payments", "পেমেন্ট")}</TabsTrigger>
              <TabsTrigger value="cash">{T("Cash Flow", "ক্যাশ ফ্লো")}</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="space-y-4">
              <Card className="p-4 space-y-3">
                <h2 className="font-semibold">{T("New invoice", "নতুন ইনভয়েস")}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div><Label>{T("Client", "ক্লায়েন্ট")}</Label><Input value={iv.client} onChange={(e) => setIv({ ...iv, client: e.target.value })} /></div>
                  <div><Label>{T("Work / description", "কাজের বিবরণ")}</Label><Input value={iv.description} onChange={(e) => setIv({ ...iv, description: e.target.value })} /></div>
                  <div><Label>{T("Amount (৳)", "টাকা (৳)")}</Label><Input type="number" value={iv.amount} onChange={(e) => setIv({ ...iv, amount: e.target.value })} /></div>
                  <div><Label>{T("VAT %", "ভ্যাট %")}</Label><Input type="number" value={iv.vatPct} onChange={(e) => setIv({ ...iv, vatPct: e.target.value })} /></div>
                </div>
                <Button onClick={addInvoice}>{T("Create invoice", "ইনভয়েস তৈরি করুন")}</Button>
              </Card>
              <Card className="p-2 overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead><tr><th className={th}>{T("No", "নং")}</th><th className={th}>{T("Date", "তারিখ")}</th><th className={th}>{T("Client", "ক্লায়েন্ট")}</th><th className={th}>{T("Total", "মোট")}</th><th className={th}>{T("Paid", "পরিশোধিত")}</th><th className={th}>{T("Due", "বাকি")}</th><th className={th}>{T("Status", "অবস্থা")}</th></tr></thead>
                  <tbody>
                    {fin.invoices.map((i) => (
                      <tr key={i.id} className="border-t">
                        <td className={td}>{i.no}</td><td className={td}>{i.date}</td><td className={td}>{i.client}</td>
                        <td className={td}>{tk(invoiceTotal(i))}</td><td className={td}>{tk(i.paidAmount)}</td><td className={td}>{tk(invoiceDue(i))}</td>
                        <td className={td}>
                          <Select value={i.status} onValueChange={(v) => setInvStatus(i.id, v as InvoiceStatus)}>
                            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>{(Object.keys(invLabel) as InvoiceStatus[]).map((s) => <SelectItem key={s} value={s}>{invLabel[s]}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                    {!fin.invoices.length && <tr><td className={td} colSpan={7}>{T("No invoices yet", "এখনো কোনো ইনভয়েস নেই")}</td></tr>}
                  </tbody>
                </table>
              </Card>
            </TabsContent>

            <TabsContent value="bills" className="space-y-4">
              <Card className="p-4 space-y-3">
                <h2 className="font-semibold">{T("New contractor bill", "নতুন ঠিকাদারের বিল")}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div><Label>{T("Contractor", "ঠিকাদার")}</Label><Input value={cb.contractor} onChange={(e) => setCb({ ...cb, contractor: e.target.value })} /></div>
                  <div><Label>{T("Work item", "কাজের আইটেম")}</Label><Input value={cb.work} onChange={(e) => setCb({ ...cb, work: e.target.value })} /></div>
                  <div><Label>{T("Gross (৳)", "মোট (৳)")}</Label><Input type="number" value={cb.gross} onChange={(e) => setCb({ ...cb, gross: e.target.value })} /></div>
                  <div><Label>{T("Deduction %", "কর্তন %")}</Label><Input type="number" value={cb.deductionPct} onChange={(e) => setCb({ ...cb, deductionPct: e.target.value })} /></div>
                </div>
                <Button onClick={addBill}>{T("Save bill", "বিল সেভ করুন")}</Button>
              </Card>
              <Card className="p-2 overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead><tr><th className={th}>{T("No", "নং")}</th><th className={th}>{T("Contractor", "ঠিকাদার")}</th><th className={th}>{T("Work", "কাজ")}</th><th className={th}>{T("Net", "নিট")}</th><th className={th}>{T("Paid", "পরিশোধিত")}</th><th className={th}>{T("Due", "বাকি")}</th><th className={th}>{T("Status", "অবস্থা")}</th></tr></thead>
                  <tbody>
                    {fin.bills.map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className={td}>{b.no}</td><td className={td}>{b.contractor}</td><td className={td}>{b.work}</td>
                        <td className={td}>{tk(billNet(b))}</td><td className={td}>{tk(b.paidAmount)}</td><td className={td}>{tk(billDue(b))}</td>
                        <td className={td}>
                          <Select value={b.status} onValueChange={(v) => setBillStatus(b.id, v as BillStatus)}>
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>{(Object.keys(billLabel) as BillStatus[]).map((s) => <SelectItem key={s} value={s}>{billLabel[s]}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                    {!fin.bills.length && <tr><td className={td} colSpan={7}>{T("No bills yet", "এখনো কোনো বিল নেই")}</td></tr>}
                  </tbody>
                </table>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card className="p-4 space-y-3">
                <h2 className="font-semibold">{T("Record a payment", "পেমেন্ট লিখুন")}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <Label>{T("Type", "ধরন")}</Label>
                    <Select value={pay.kind} onValueChange={(v) => setPay({ ...pay, kind: v as "invoice" | "bill", refId: "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">{T("Client pays me (invoice)", "ক্লায়েন্ট দিল (ইনভয়েস)")}</SelectItem>
                        <SelectItem value="bill">{T("I pay contractor (bill)", "ঠিকাদারকে দিলাম (বিল)")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{T("Invoice / Bill", "ইনভয়েস / বিল")}</Label>
                    <Select value={pay.refId} onValueChange={(v) => setPay({ ...pay, refId: v })}>
                      <SelectTrigger><SelectValue placeholder={T("Select", "নির্বাচন")} /></SelectTrigger>
                      <SelectContent>
                        {payTargets.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.no} — {t.client || t.contractor} ({T("due", "বাকি")} {tk(pay.kind === "invoice" ? invoiceDue(t) : billDue(t))})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{T("Amount (৳)", "টাকা (৳)")}</Label><Input type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></div>
                  <div>
                    <Label>{T("Method", "মাধ্যম")}</Label>
                    <Select value={pay.method} onValueChange={(v) => setPay({ ...pay, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["bKash", "Nagad", "Bank", "Cash"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{T("Note", "নোট")}</Label><Input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></div>
                </div>
                <Button onClick={addPayment}>{T("Save payment", "পেমেন্ট সেভ করুন")}</Button>
              </Card>
              <Card className="p-2 overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead><tr><th className={th}>{T("Date", "তারিখ")}</th><th className={th}>{T("Ref", "রেফ")}</th><th className={th}>{T("Direction", "দিক")}</th><th className={th}>{T("Method", "মাধ্যম")}</th><th className={th}>{T("Amount", "টাকা")}</th><th className={th}>{T("Note", "নোট")}</th></tr></thead>
                  <tbody>
                    {fin.payments.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className={td}>{p.date}</td><td className={td}>{refName(p.kind, p.refId)}</td>
                        <td className={td}><Badge variant={p.kind === "invoice" ? "default" : "secondary"}>{p.kind === "invoice" ? T("In", "আসা") : T("Out", "যাওয়া")}</Badge></td>
                        <td className={td}>{p.method}</td><td className={td}>{tk(p.amount)}</td><td className={td}>{p.note}</td>
                      </tr>
                    ))}
                    {!fin.payments.length && <tr><td className={td} colSpan={6}>{T("No payments yet", "এখনো কোনো পেমেন্ট নেই")}</td></tr>}
                  </tbody>
                </table>
              </Card>
            </TabsContent>

            <TabsContent value="cash" className="space-y-4">
              <Card className="p-4 space-y-3">
                <h2 className="font-semibold">{T("Other income / expense", "অন্যান্য আয় / ব্যয়")}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label>{T("Type", "ধরন")}</Label>
                    <Select value={ce.kind} onValueChange={(v) => setCe({ ...ce, kind: v as "inflow" | "outflow" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inflow">{T("Money in", "টাকা আসা")}</SelectItem>
                        <SelectItem value="outflow">{T("Money out", "টাকা যাওয়া")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{T("Category", "খাত")}</Label><Input value={ce.category} onChange={(e) => setCe({ ...ce, category: e.target.value })} placeholder={T("e.g. Labour, Transport", "যেমন শ্রমিক, যাতায়াত")} /></div>
                  <div><Label>{T("Amount (৳)", "টাকা (৳)")}</Label><Input type="number" value={ce.amount} onChange={(e) => setCe({ ...ce, amount: e.target.value })} /></div>
                  <div><Label>{T("Note", "নোট")}</Label><Input value={ce.note} onChange={(e) => setCe({ ...ce, note: e.target.value })} /></div>
                </div>
                <Button onClick={addCash}>{T("Save entry", "এন্ট্রি সেভ করুন")}</Button>
              </Card>
              <Card className="p-4 space-y-2">
                <h2 className="font-semibold">{T("Last 6 months", "শেষ ৬ মাস")}</h2>
                <div className="flex items-end gap-3 h-40">
                  {series.map((s) => (
                    <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-end gap-1 h-28 w-full justify-center">
                        <div className="w-4 bg-primary rounded-t" style={{ height: `${(s.inflow / maxBar) * 100}%` }} title={`${T("In", "আসা")} ${tk(s.inflow)}`} />
                        <div className="w-4 bg-destructive/70 rounded-t" style={{ height: `${(s.outflow / maxBar) * 100}%` }} title={`${T("Out", "যাওয়া")} ${tk(s.outflow)}`} />
                      </div>
                      <div className="text-xs text-muted-foreground">{s.month}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary rounded-sm inline-block" />{T("Money in", "টাকা আসা")}</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-destructive/70 rounded-sm inline-block" />{T("Money out", "টাকা যাওয়া")}</span>
                </div>
              </Card>
              <Card className="p-2 overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead><tr><th className={th}>{T("Date", "তারিখ")}</th><th className={th}>{T("Category", "খাত")}</th><th className={th}>{T("Type", "ধরন")}</th><th className={th}>{T("Amount", "টাকা")}</th><th className={th}>{T("Note", "নোট")}</th></tr></thead>
                  <tbody>
                    {fin.cash.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className={td}>{c.date}</td><td className={td}>{c.category}</td>
                        <td className={td}><Badge variant={c.kind === "inflow" ? "default" : "secondary"}>{c.kind === "inflow" ? T("In", "আসা") : T("Out", "যাওয়া")}</Badge></td>
                        <td className={td}>{tk(c.amount)}</td><td className={td}>{c.note}</td>
                      </tr>
                    ))}
                    {!fin.cash.length && <tr><td className={td} colSpan={5}>{T("No entries yet", "এখনো কোনো এন্ট্রি নেই")}</td></tr>}
                  </tbody>
                </table>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground">
            {user ? T("Saved to your account — visible on all your devices.", "আপনার অ্যাকাউন্টে সেভ হয় — সব ডিভাইসে দেখা যাবে।") : T("Saved on this device only. Sign in to sync across devices.", "শুধু এই ডিভাইসে সেভ হচ্ছে। সব ডিভাইসে পেতে লগইন করুন।")}
          </p>
        </main>
      </div>
    </SidebarProvider>
  );
}
