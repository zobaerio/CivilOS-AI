// Civil engineering calculations: BNBC loads, structural design, rebar, BOQ, timeline.
import type { EstimateData } from "./estimateEngine";

export interface BNBCLoads {
  zone: string;
  zoneFactor: number;
  soilType: string;
  soilFactor: number;
  importanceFactor: number;
  responseFactor: number;
  deadLoadPsf: number;
  liveLoadPsf: number;
  totalDeadLoad: number; // kN
  totalLiveLoad: number; // kN
  windSpeed: number; // m/s
  windPressure: number; // kN/m²
  baseShear: number; // kN
  seismicCoeff: number;
  buildingWeight: number; // kN
}

export interface BeamDesign {
  span: number; // ft
  width: number; // in
  depth: number; // in
  uniformLoad: number; // kN/m
  maxMoment: number; // kN·m
  maxShear: number; // kN
  topRebar: string;
  bottomRebar: string;
  stirrups: string;
  status: "Safe" | "Review";
}

export interface ColumnDesign {
  size: string;
  axialLoad: number; // kN
  mainBars: string;
  ties: string;
  status: "Safe" | "Review";
}

export interface SlabDesign {
  panel: string;
  thickness: number; // in
  mainRebar: string;
  distRebar: string;
  status: "Safe" | "Review";
}

export interface BOQItem {
  item: string;
  qty: number;
  unit: string;
  rate: number;
  total: number;
}

export interface TimelinePhase {
  name: string;
  startMonth: number;
  durationMonths: number;
  color: string;
}

export interface Quotation {
  materialCost: number;
  laborCost: number;
  overhead: number;
  profit: number;
  total: number;
  durationMonths: number;
  validityDays: number;
  paymentTerms: string;
}

export function computeBNBCLoads(
  estimate: EstimateData,
  zone: string = "Zone 2 (Dhaka)",
  soil: string = "SC",
): BNBCLoads {
  const zoneFactor: Record<string, number> = {
    "Zone 1 (Sylhet)": 0.36,
    "Zone 2 (Dhaka)": 0.28,
    "Zone 3 (Rajshahi)": 0.20,
    "Zone 4 (Barisal)": 0.12,
  };
  const soilFactor: Record<string, number> = { SA: 1.0, SB: 1.2, SC: 1.15, SD: 1.35, SE: 1.5 };
  const z = zoneFactor[zone] ?? 0.28;
  const s = soilFactor[soil] ?? 1.15;
  const I = 1.0;
  const R = 5.0;

  const deadLoadPsf = 110;
  const liveLoadPsf = 40;
  const area = estimate.totalFloorArea;
  const totalDeadLoad = (deadLoadPsf * area * 4.45) / 1000; // psf*sqft → lb → kN
  const totalLiveLoad = (liveLoadPsf * area * 4.45) / 1000;

  const windSpeed = 50; // m/s, BNBC basic for Dhaka
  const windPressure = (0.6 * windSpeed * windSpeed) / 1000; // kN/m²

  const buildingWeight = totalDeadLoad + 0.25 * totalLiveLoad;
  const Cs = (z * I * 2.5) / R;
  const baseShear = Cs * buildingWeight * s;

  return {
    zone,
    zoneFactor: z,
    soilType: soil,
    soilFactor: s,
    importanceFactor: I,
    responseFactor: R,
    deadLoadPsf,
    liveLoadPsf,
    totalDeadLoad: Math.round(totalDeadLoad),
    totalLiveLoad: Math.round(totalLiveLoad),
    windSpeed,
    windPressure: parseFloat(windPressure.toFixed(2)),
    baseShear: Math.round(baseShear),
    seismicCoeff: parseFloat(Cs.toFixed(3)),
    buildingWeight: Math.round(buildingWeight),
  };
}

export function designBeams(estimate: EstimateData): BeamDesign[] {
  const spans = [12, 14, 16, 18];
  return spans.map((span) => {
    const w = 12; // kN/m uniform load assumed
    const L = span * 0.3048; // m
    const M = (w * L * L) / 8;
    const V = (w * L) / 2;
    const depth = Math.max(12, Math.round(span * 0.85));
    const status: "Safe" | "Review" = M < 200 ? "Safe" : "Review";
    return {
      span,
      width: 10,
      depth,
      uniformLoad: w,
      maxMoment: parseFloat(M.toFixed(1)),
      maxShear: parseFloat(V.toFixed(1)),
      topRebar: "2 × 16 mm",
      bottomRebar: depth > 18 ? "4 × 20 mm" : "3 × 16 mm",
      stirrups: "8 mm @ 6\" c/c",
      status,
    };
  });
}

export function designColumns(estimate: EstimateData): ColumnDesign[] {
  const floors = estimate.floors;
  const tributary = 200; // sqft per column
  const loadPerSqft = 150 * floors; // psf
  const axial = (loadPerSqft * tributary * 4.45) / 1000; // kN
  return [
    {
      size: floors >= 3 ? "12\" × 15\"" : "10\" × 12\"",
      axialLoad: Math.round(axial),
      mainBars: floors >= 3 ? "8 × 20 mm" : "6 × 16 mm",
      ties: "8 mm @ 6\" c/c",
      status: "Safe",
    },
    {
      size: floors >= 3 ? "15\" × 15\"" : "12\" × 12\"",
      axialLoad: Math.round(axial * 1.4),
      mainBars: floors >= 3 ? "10 × 20 mm" : "8 × 16 mm",
      ties: "8 mm @ 5\" c/c",
      status: "Safe",
    },
  ];
}

export function designSlabs(estimate: EstimateData): SlabDesign[] {
  return [
    { panel: "Living Room Slab", thickness: 5, mainRebar: "10 mm @ 5\" c/c", distRebar: "8 mm @ 6\" c/c", status: "Safe" },
    { panel: "Bedroom Slab", thickness: 5, mainRebar: "10 mm @ 6\" c/c", distRebar: "8 mm @ 6\" c/c", status: "Safe" },
    { panel: "Kitchen / Bath Slab", thickness: 5, mainRebar: "10 mm @ 5\" c/c", distRebar: "8 mm @ 5\" c/c", status: "Safe" },
    { panel: "Roof Slab", thickness: 6, mainRebar: "12 mm @ 5\" c/c", distRebar: "10 mm @ 6\" c/c", status: "Safe" },
  ];
}

export function buildBOQ(estimate: EstimateData): BOQItem[] {
  const m = estimate.materials;
  const concreteVol = Math.round(estimate.totalFloorArea * 0.45); // cft
  const steelKg = m["Steel Rods"].qty;
  const items: BOQItem[] = [
    { item: "RCC Concrete (1:2:4)", qty: concreteVol, unit: "cft", rate: 280, total: concreteVol * 280 },
    { item: "Steel Reinforcement", qty: steelKg, unit: "kg", rate: m["Steel Rods"].rate, total: m["Steel Rods"].total },
    { item: "Brick (1st class)", qty: m["Bricks"].qty, unit: "pcs", rate: m["Bricks"].rate, total: m["Bricks"].total },
    { item: "Cement (50 kg bag)", qty: m["Cement"].qty, unit: "bag", rate: m["Cement"].rate, total: m["Cement"].total },
    { item: "Sand (Sylhet)", qty: m["Sand"].qty, unit: "cft", rate: m["Sand"].rate, total: m["Sand"].total },
    { item: "Stone Chips", qty: m["Stone Chips"].qty, unit: "cft", rate: m["Stone Chips"].rate, total: m["Stone Chips"].total },
    { item: "Plaster Work", qty: Math.round(estimate.totalFloorArea * 2.4), unit: "sft", rate: 35, total: Math.round(estimate.totalFloorArea * 2.4) * 35 },
    { item: "Paint (Interior)", qty: m["Paint (Interior)"].qty, unit: "sft", rate: m["Paint (Interior)"].rate, total: m["Paint (Interior)"].total },
    { item: "Paint (Exterior)", qty: m["Paint (Exterior)"].qty, unit: "sft", rate: m["Paint (Exterior)"].rate, total: m["Paint (Exterior)"].total },
    { item: "Floor Tiles", qty: m["Tiles"].qty, unit: "sft", rate: m["Tiles"].rate, total: m["Tiles"].total },
    { item: "Doors (with frame)", qty: m["Doors"].qty, unit: "pcs", rate: m["Doors"].rate, total: m["Doors"].total },
    { item: "Windows (with grill)", qty: m["Windows"].qty, unit: "pcs", rate: m["Windows"].rate, total: m["Windows"].total },
  ];
  return items;
}

export function buildTimeline(estimate: EstimateData): TimelinePhase[] {
  const total = estimate.completionMonths;
  const f = estimate.floors;
  return [
    { name: "Site Preparation & Excavation", startMonth: 0, durationMonths: 1, color: "#e67e22" },
    { name: "Foundation Work", startMonth: 1, durationMonths: 1.5, color: "#d35400" },
    { name: "Structural Frame (Columns/Beams/Slabs)", startMonth: 2, durationMonths: f * 1.5, color: "#1a3a6b" },
    { name: "Masonry & Brickwork", startMonth: 2 + f * 1.5 - 0.5, durationMonths: f * 1, color: "#2a5298" },
    { name: "Plastering", startMonth: 3 + f * 1.5, durationMonths: 1.5, color: "#3498db" },
    { name: "Electrical & Plumbing Rough-in", startMonth: 3 + f * 1.5, durationMonths: 1.5, color: "#8e44ad" },
    { name: "Tile, Paint & Finishing", startMonth: 4.5 + f * 1.5, durationMonths: 2, color: "#27ae60" },
    { name: "Final Inspection & Handover", startMonth: Math.max(total - 0.5, 5), durationMonths: 0.5, color: "#16a085" },
  ];
}

export function buildQuotation(estimate: EstimateData): Quotation {
  const materialCost = Object.values(estimate.materials).reduce((s, m) => s + m.total, 0);
  const laborCost = Object.values(estimate.labor).reduce((s, l) => s + l.total, 0);
  const civil = Object.values(estimate.civilWork).reduce((s, v) => s + v, 0);
  const finishing = Object.values(estimate.finishing).reduce((s, v) => s + v, 0);
  const subtotal = materialCost + laborCost + civil + finishing;
  const overhead = Math.round(subtotal * 0.08);
  const profit = Math.round(subtotal * 0.10);
  return {
    materialCost,
    laborCost: laborCost + civil + finishing,
    overhead,
    profit,
    total: subtotal + overhead + profit,
    durationMonths: estimate.completionMonths,
    validityDays: 30,
    paymentTerms: "30% Advance · 40% on Roof Casting · 30% on Handover",
  };
}

export function aiRecommendations(estimate: EstimateData, loads: BNBCLoads): string[] {
  const recs: string[] = [];
  if (loads.baseShear > 500) recs.push("High seismic base shear detected — consider shear walls or larger columns at corners.");
  if (estimate.floors >= 3) recs.push("For 3+ floors, use M25 grade concrete for columns and beams instead of M20.");
  recs.push("Stagger column splices and ensure 50d lap length for tension reinforcement.");
  recs.push("Provide 2-hour fire rating on staircase enclosure walls.");
  recs.push("Use waterproofing membrane on roof slab and bathroom floors before tiling.");
  recs.push("Optimize beam spacing to 12–14 ft to reduce slab thickness and steel weight.");
  recs.push("Consider rainwater harvesting tank under stairs — adds < 2% to cost, saves long-term water bills.");
  return recs;
}
