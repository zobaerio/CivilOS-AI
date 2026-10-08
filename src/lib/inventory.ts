// Inventory & procurement data model (stored per user via useCloudState).
export type Material = { id: string; name: string; nameBn: string; unit: string; rate: number; minStock: number };
export type TxnType = "in" | "out" | "wastage";
export type Txn = { id: string; date: string; materialId: string; type: TxnType; qty: number; note: string; poId?: string };
export type Vendor = { id: string; name: string; phone: string; items: string };
export type POStatus = "draft" | "ordered" | "received" | "cancelled";
export type PO = { id: string; no: string; date: string; vendorId: string; materialId: string; qty: number; rate: number; status: POStatus };
export type Inventory = { materials: Material[]; txns: Txn[]; vendors: Vendor[]; pos: PO[] };

// Sample opening rates in BDT — users should edit to current market prices.
export const DEFAULT_INVENTORY: Inventory = {
  materials: [
    { id: "m1", name: "Cement (50 kg bag)", nameBn: "সিমেন্ট (৫০ কেজি ব্যাগ)", unit: "bag", rate: 520, minStock: 100 },
    { id: "m2", name: "MS Rod 500W", nameBn: "রড ৫০০W", unit: "kg", rate: 95, minStock: 1000 },
    { id: "m3", name: "First-class Brick", nameBn: "প্রথম শ্রেণির ইট", unit: "pcs", rate: 13, minStock: 5000 },
    { id: "m4", name: "Sylhet Sand", nameBn: "সিলেট বালু", unit: "cft", rate: 55, minStock: 500 },
    { id: "m5", name: "Stone Chips", nameBn: "পাথরের খোয়া", unit: "cft", rate: 210, minStock: 300 },
  ],
  txns: [],
  vendors: [],
  pos: [],
};

export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function stockSummary(inv: Inventory) {
  return inv.materials.map((m) => {
    const t = inv.txns.filter((x) => x.materialId === m.id);
    const sum = (k: TxnType) => t.filter((x) => x.type === k).reduce((s, x) => s + x.qty, 0);
    const received = sum("in"), used = sum("out"), wasted = sum("wastage");
    const stock = received - used - wasted;
    const consumed = used + wasted;
    return { ...m, received, used, wasted, stock, value: stock * m.rate, wastagePct: consumed ? (wasted / consumed) * 100 : 0, low: stock < m.minStock };
  });
}
