// Finance data model: invoices, contractor bills, payments, cash-flow (per user via useCloudState).
export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";
export type Invoice = { id: string; no: string; date: string; client: string; description: string; amount: number; vatPct: number; status: InvoiceStatus; paidAmount: number };
export type BillStatus = "submitted" | "checked" | "approved" | "paid";
export type ContractorBill = { id: string; no: string; date: string; contractor: string; work: string; gross: number; deductionPct: number; status: BillStatus; paidAmount: number };
export type Payment = { id: string; date: string; kind: "invoice" | "bill"; refId: string; amount: number; method: string; note: string };
export type CashEntry = { id: string; date: string; kind: "inflow" | "outflow"; category: string; amount: number; note: string };
export type Finance = { invoices: Invoice[]; bills: ContractorBill[]; payments: Payment[]; cash: CashEntry[] };

export const DEFAULT_FINANCE: Finance = { invoices: [], bills: [], payments: [], cash: [] };

export const invoiceTotal = (i: Invoice) => i.amount * (1 + i.vatPct / 100);
export const invoiceDue = (i: Invoice) => Math.max(0, invoiceTotal(i) - i.paidAmount);
export const billNet = (b: ContractorBill) => b.gross * (1 - b.deductionPct / 100);
export const billDue = (b: ContractorBill) => Math.max(0, billNet(b) - b.paidAmount);

export function cashFlowSummary(f: Finance) {
  const invIn = f.invoices.reduce((s, i) => s + i.paidAmount, 0);
  const billOut = f.bills.reduce((s, b) => s + b.paidAmount, 0);
  const cashIn = f.cash.filter((c) => c.kind === "inflow").reduce((s, c) => s + c.amount, 0);
  const cashOut = f.cash.filter((c) => c.kind === "outflow").reduce((s, c) => s + c.amount, 0);
  const receivable = f.invoices.reduce((s, i) => s + (i.status === "cancelled" ? 0 : invoiceDue(i)), 0);
  const payable = f.bills.reduce((s, b) => s + billDue(b), 0);
  return { inflow: invIn + cashIn, outflow: billOut + cashOut, balance: invIn + cashIn - billOut - cashOut, receivable, payable };
}

// Monthly series for the last n months (inflow vs outflow).
export function monthlySeries(f: Finance, months = 6) {
  const out: { month: string; inflow: number; outflow: number }[] = [];
  const now = new Date();
  for (let k = months - 1; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const key = d.toISOString().slice(0, 7);
    const inflow =
      f.payments.filter((p) => p.kind === "invoice" && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0) +
      f.cash.filter((c) => c.kind === "inflow" && c.date.startsWith(key)).reduce((s, c) => s + c.amount, 0);
    const outflow =
      f.payments.filter((p) => p.kind === "bill" && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0) +
      f.cash.filter((c) => c.kind === "outflow" && c.date.startsWith(key)).reduce((s, c) => s + c.amount, 0);
    out.push({ month: d.toLocaleString("en", { month: "short" }), inflow, outflow });
  }
  return out;
}
