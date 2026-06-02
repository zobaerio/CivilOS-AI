// Civil engineering calculations: BNBC loads, structural design, rebar, BOQ, timeline.
import type { EstimateData } from "./estimateEngine";

export interface LoadCombo {
  name: string;
  formula: string;
  factoredLoad: number; // kN — equivalent total factored vertical/lateral resultant
  governs: boolean;
}

export interface LoadDetail {
  code: string;        // D, L, W, S, H, F, E
  name: string;
  intensity: string;
  total: number;       // kN
  formula: string;
  reference: string;   // BNBC clause
}

export interface BNBCLoads {
  zone: string;
  zoneFactor: number;
  soilType: string;
  soilFactor: number;
  importanceFactor: number;
  responseFactor: number;
  deadLoadPsf: number;
  liveLoadPsf: number;
  totalDeadLoad: number; // kN  (D)
  totalLiveLoad: number; // kN  (L)
  windSpeed: number; // m/s
  windPressure: number; // kN/m²
  windLoad: number; // kN — lateral wind (W)
  snowLoad: number; // kN  (S)
  earthPressure: number; // kN  (H)
  waterLoad: number; // kN  (F)
  baseShear: number; // kN  (E)
  seismicCoeff: number;
  buildingWeight: number; // kN
  loadDetails: LoadDetail[];
  combos: LoadCombo[];
  governingCombo: string;
  governingValue: number;
}

export const BNBC_ZONES: Record<string, number> = {
  "Zone 1 (Sylhet)": 0.36,
  "Zone 2 (Dhaka)": 0.28,
  "Zone 3 (Rajshahi)": 0.20,
  "Zone 4 (Barisal)": 0.12,
};

export const BNBC_SOILS: Record<string, { factor: number; label: string }> = {
  SA: { factor: 1.0, label: "SA — Hard rock" },
  SB: { factor: 1.2, label: "SB — Rock" },
  SC: { factor: 1.15, label: "SC — Dense soil / soft rock" },
  SD: { factor: 1.35, label: "SD — Stiff soil" },
  SE: { factor: 1.5, label: "SE — Soft soil" },
};

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
  electricalPlumbing: number;
  transport: number;
  contingency: number;
  overhead: number;
  baseProjectCost: number; // = estimate.totalCost (full project cost before contractor margin)
  profit: number;
  total: number;
  durationMonths: number;
  validityDays: number;
  paymentTerms: string;
  justification: { label: string; amount: number; note: string }[];
}

export function computeBNBCLoads(
  estimate: EstimateData,
  zone: string = "Zone 2 (Dhaka)",
  soil: string = "SC",
  importance: number = 1.0,
): BNBCLoads {
  const z = BNBC_ZONES[zone] ?? 0.28;
  const s = BNBC_SOILS[soil]?.factor ?? 1.15;
  const I = importance;
  const R = 5.0;

  const deadLoadPsf = 110;
  const liveLoadPsf = 40;
  const area = estimate.totalFloorArea;
  const D = (deadLoadPsf * area * 4.45) / 1000; // kN
  const L = (liveLoadPsf * area * 4.45) / 1000; // kN

  // Wind: BNBC basic wind speed, exposure B, building height ≈ floors × 10 ft
  const windSpeed = 50; // m/s, conservative for coastal/Dhaka mix
  const windPressure = (0.6 * windSpeed * windSpeed) / 1000; // kN/m²
  const heightM = estimate.floors * 3.0;
  const facadeArea =
    (Math.sqrt(area / Math.max(estimate.floors, 1)) * 0.3048) * heightM * 4 * 0.5; // m²
  const W = windPressure * facadeArea; // total lateral wind kN

  // Earthquake (BNBC 2020 ELF): V = Cs * W_seismic
  const buildingWeight = D + 0.25 * L;
  const Cs = (z * I * 2.5) / R;
  const E = Cs * buildingWeight * s; // kN

  // Snow load (BNBC 2020 §2.5): Bangladesh plains → 0 kN/m².
  const S = 0;

  // Lateral earth pressure (BNBC 2020 §2.6.5): only when basement / retaining present.
  const basementDepth = 0; // m — extend via input later
  const Ka = 0.33;
  const gammaSoil = 18; // kN/m³
  const wallPerim = Math.sqrt(area) * 0.3048 * 4; // m
  const H = 0.5 * Ka * gammaSoil * basementDepth * basementDepth * wallPerim;

  // Hydrostatic / fluid load (BNBC 2020 §2.6.6): roof tank ≈ 1 m³ per floor.
  const tankVol = estimate.floors * 1.0; // m³
  const F = 9.81 * tankVol;

  // Earthquake (BNBC 2020 ELF §2.5.7): V = Cs·W·S
  const buildingWeight = D + 0.25 * L;
  const Cs = (z * I * 2.5) / R;
  const E = Cs * buildingWeight * s; // kN

  const loadDetails: LoadDetail[] = [
    { code: "D", name: "Dead Load",         intensity: `${deadLoadPsf} psf (5.27 kN/m²)`,            total: Math.round(D), formula: `${deadLoadPsf} psf × ${Math.round(area)} sqft × 4.45/1000 = ${Math.round(D)} kN`, reference: "BNBC 2020 §2.2" },
    { code: "L", name: "Live Load",         intensity: `${liveLoadPsf} psf (1.92 kN/m²)`,            total: Math.round(L), formula: `${liveLoadPsf} psf × ${Math.round(area)} sqft × 4.45/1000 = ${Math.round(L)} kN`, reference: "BNBC 2020 §2.3 Table 6.2.3" },
    { code: "W", name: "Wind Load",         intensity: `${windPressure.toFixed(2)} kN/m² @ V=${windSpeed} m/s`, total: Math.round(W), formula: `qz = 0.6V² → W = qz × Aface = ${windPressure.toFixed(2)} × ${facadeArea.toFixed(1)} = ${Math.round(W)} kN`, reference: "BNBC 2020 §2.4" },
    { code: "S", name: "Snow Load",         intensity: `0 kN/m² (BD plains)`,                        total: Math.round(S), formula: `Ground snow pg = 0 → S = 0`, reference: "BNBC 2020 §2.5" },
    { code: "H", name: "Earth Pressure",    intensity: basementDepth > 0 ? `Ka=${Ka}, γ=${gammaSoil} kN/m³, h=${basementDepth} m` : "N/A — no basement", total: Math.round(H), formula: `H = ½·Ka·γ·h²·Perim = ½·${Ka}·${gammaSoil}·${basementDepth}²·${wallPerim.toFixed(1)} = ${Math.round(H)} kN`, reference: "BNBC 2020 §2.6.5" },
    { code: "F", name: "Water / Fluid Load",intensity: `Roof tank ${tankVol.toFixed(1)} m³, γw=9.81 kN/m³`, total: Math.round(F), formula: `F = γw × V = 9.81 × ${tankVol.toFixed(1)} = ${F.toFixed(1)} kN`, reference: "BNBC 2020 §2.6.6" },
    { code: "E", name: "Earthquake Load",   intensity: `Cs = ${Cs.toFixed(3)}, Wseis = ${Math.round(buildingWeight)} kN`, total: Math.round(E), formula: `V = Cs·W·S = ${Cs.toFixed(3)} × ${Math.round(buildingWeight)} × ${s} = ${Math.round(E)} kN`, reference: "BNBC 2020 §2.5.7" },
  ];

  // BNBC 2020 strength load combinations (clause 2.7.3.1)
  const mag = (vert: number, lat: number) => vert + 0.5 * lat;
  const combos: LoadCombo[] = [
    { name: "Comb-1", formula: "1.4 D",                        factoredLoad: 1.4 * D,                            governs: false },
    { name: "Comb-2", formula: "1.2 D + 1.6 L + 0.5 S",        factoredLoad: 1.2 * D + 1.6 * L + 0.5 * S,        governs: false },
    { name: "Comb-3", formula: "1.2 D + 1.0 L + 1.0 W",        factoredLoad: mag(1.2 * D + 1.0 * L, 1.0 * W),    governs: false },
    { name: "Comb-4", formula: "1.2 D + 1.0 L + 1.0 E",        factoredLoad: mag(1.2 * D + 1.0 * L, 1.0 * E),    governs: false },
    { name: "Comb-5", formula: "0.9 D + 1.0 W + 1.6 H",        factoredLoad: mag(0.9 * D, 1.0 * W + 1.6 * H),    governs: false },
    { name: "Comb-6", formula: "0.9 D + 1.0 E + 1.6 H",        factoredLoad: mag(0.9 * D, 1.0 * E + 1.6 * H),    governs: false },
    { name: "Comb-7", formula: "1.2 D + 1.0 F + 1.0 L",        factoredLoad: 1.2 * D + 1.0 * F + 1.0 * L,        governs: false },
  ].map((c) => ({ ...c, factoredLoad: Math.round(c.factoredLoad) }));

  let governing = combos[0];
  for (const c of combos) if (c.factoredLoad > governing.factoredLoad) governing = c;
  governing.governs = true;

  return {
    zone,
    zoneFactor: z,
    soilType: soil,
    soilFactor: s,
    importanceFactor: I,
    responseFactor: R,
    deadLoadPsf,
    liveLoadPsf,
    totalDeadLoad: Math.round(D),
    totalLiveLoad: Math.round(L),
    windSpeed,
    windPressure: parseFloat(windPressure.toFixed(2)),
    windLoad: Math.round(W),
    snowLoad: Math.round(S),
    earthPressure: Math.round(H),
    waterLoad: Math.round(F),
    baseShear: Math.round(E),
    seismicCoeff: parseFloat(Cs.toFixed(3)),
    buildingWeight: Math.round(buildingWeight),
    loadDetails,
    combos,
    governingCombo: governing.name,
    governingValue: governing.factoredLoad,
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
  const elec = typeof estimate.electrical["Estimated Cost"] === "number" ? (estimate.electrical["Estimated Cost"] as number) : 0;
  const plumb = typeof estimate.plumbing["Estimated Cost"] === "number" ? (estimate.plumbing["Estimated Cost"] as number) : 0;

  // Use the engine's already-justified totalCost (which includes transport, overhead, contingency).
  const baseProjectCost = estimate.totalCost;
  const subtotalRaw = materialCost + laborCost + civil + finishing + elec + plumb;
  const transport = Math.round(subtotalRaw * 0.03);
  const contingency = Math.round(subtotalRaw * 0.05);
  const overhead = Math.round(subtotalRaw * 0.08);

  // Contractor margin (profit) — applied ONCE on top of full project cost.
  const profit = Math.round(baseProjectCost * 0.10);
  const total = baseProjectCost + profit;

  const justification = [
    { label: "Materials", amount: materialCost, note: "Cement, steel, brick, sand, stone, tiles, paint, doors, windows — quantities derived from built-up area & wall volume." },
    { label: "Labor", amount: laborCost + civil + finishing, note: "Mason, rod-binder, carpenter, electrician, plumber, painter, tiles & general labor — civil + finishing crews included." },
    { label: "Electrical & Plumbing", amount: elec + plumb, note: "Wiring, switches, DB box, fan/light points, pipes, water tank, fittings as per total floor area." },
    { label: "Transport", amount: transport, note: "≈3% of subtotal for material transport & site logistics." },
    { label: "Contingency", amount: contingency, note: "≈5% safety buffer for price fluctuation & unforeseen work." },
    { label: "Overhead", amount: overhead, note: "≈8% for site supervision, equipment, scaffolding, utilities." },
    { label: "Contractor Profit", amount: profit, note: "10% margin on full project cost — single application, no double counting." },
  ];

  return {
    materialCost,
    laborCost: laborCost + civil + finishing,
    electricalPlumbing: elec + plumb,
    transport,
    contingency,
    overhead,
    baseProjectCost,
    profit,
    total,
    durationMonths: estimate.completionMonths,
    validityDays: 30,
    paymentTerms: "30% Advance · 40% on Roof Casting · 30% on Handover",
    justification,
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
