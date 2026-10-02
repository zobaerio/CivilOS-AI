// Rule-based floor plan generator (feet). Simplified Bangladesh setback/FAR guidance.
export type RoadSide = "north" | "south" | "east" | "west";
export interface PlanInput {
  plotWidth: number; // ft, along road
  plotDepth: number; // ft
  road: RoadSide;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
  dining: boolean;
  drawing: boolean;
  balcony: boolean;
  stair: boolean;
  parking: boolean;
}
export interface Room { name: string; nameBn: string; x: number; y: number; w: number; h: number; zone: "front" | "mid" | "rear" }
export interface Check { ok: boolean; en: string; bn: string }
export interface PlanResult {
  setbacks: { front: number; rear: number; side: number };
  buildW: number; buildD: number; footprint: number; plotArea: number;
  coverage: number; totalBuilt: number; far: number; rooms: Room[]; checks: Check[];
  estCost: number;
}

export const DEFAULT_INPUT: PlanInput = {
  plotWidth: 40, plotDepth: 60, road: "south", floors: 4, bedrooms: 3, bathrooms: 2,
  kitchen: true, dining: true, drawing: true, balcony: true, stair: true, parking: true,
};

type Req = { name: string; nameBn: string; area: number; zone: Room["zone"]; min: number };

export function generatePlan(i: PlanInput): PlanResult {
  const plotArea = i.plotWidth * i.plotDepth;
  const setbacks = { front: plotArea > 2880 ? 6.5 : 5, rear: 3.3, side: 3.3 };
  const buildW = Math.max(10, i.plotWidth - 2 * setbacks.side);
  const buildD = Math.max(10, i.plotDepth - setbacks.front - setbacks.rear);
  const footprint = buildW * buildD;

  const reqs: Req[] = [];
  if (i.drawing) reqs.push({ name: "Drawing", nameBn: "ড্রয়িং", area: 180, zone: "front", min: 120 });
  if (i.balcony) reqs.push({ name: "Balcony", nameBn: "বারান্দা", area: 50, zone: "front", min: 25 });
  if (i.stair) reqs.push({ name: "Stair/Lift", nameBn: "সিঁড়ি/লিফট", area: 110, zone: "mid", min: 80 });
  if (i.dining) reqs.push({ name: "Dining", nameBn: "ডাইনিং", area: 150, zone: "mid", min: 100 });
  if (i.kitchen) reqs.push({ name: "Kitchen", nameBn: "রান্নাঘর", area: 80, zone: "mid", min: 50 });
  for (let b = 0; b < i.bedrooms; b++)
    reqs.push({ name: b === 0 ? "Master Bed" : `Bed ${b + 1}`, nameBn: b === 0 ? "মাস্টার বেড" : `বেড ${b + 1}`, area: b === 0 ? 180 : 140, zone: "rear", min: 100 });
  for (let t = 0; t < i.bathrooms; t++)
    reqs.push({ name: `Bath ${t + 1}`, nameBn: `বাথ ${t + 1}`, area: 40, zone: t % 2 ? "mid" : "rear", min: 30 });

  const zones: Room["zone"][] = ["front", "mid", "rear"];
  const zoneArea = zones.map((z) => reqs.filter((r) => r.zone === z).reduce((s, r) => s + r.area, 0));
  const totalReq = zoneArea.reduce((a, b) => a + b, 0) || 1;
  const rooms: Room[] = [];
  let y = 0; // y measured from road side
  zones.forEach((z, zi) => {
    const list = reqs.filter((r) => r.zone === z);
    if (!list.length) return;
    const h = (zoneArea[zi] / totalReq) * buildD;
    const sum = list.reduce((s, r) => s + r.area, 0);
    let x = 0;
    list.forEach((r) => {
      const w = (r.area / sum) * buildW;
      rooms.push({ name: r.name, nameBn: r.nameBn, x, y, w, h, zone: z });
      x += w;
    });
    y += h;
  });

  const coverage = (footprint / plotArea) * 100;
  const totalBuilt = footprint * i.floors;
  const far = totalBuilt / plotArea;
  const checks: Check[] = [];
  const fits = totalReq * 1.12 <= footprint; // 12% walls/circulation
  checks.push(fits
    ? { ok: true, en: `Required ${Math.round(totalReq)} sft fits buildable ${Math.round(footprint)} sft`, bn: `প্রয়োজনীয় ${Math.round(totalReq)} বর্গফুট, নির্মাণযোগ্য ${Math.round(footprint)} বর্গফুটে আঁটে` }
    : { ok: false, en: `Rooms need ~${Math.round(totalReq * 1.12)} sft but only ${Math.round(footprint)} sft buildable — reduce rooms`, bn: `রুমগুলোর জন্য ~${Math.round(totalReq * 1.12)} বর্গফুট দরকার, কিন্তু আছে ${Math.round(footprint)} — রুম কমান` });
  const small = rooms.filter((r) => { const q = reqs.find((x) => x.name === r.name)!; return r.w * r.h < q.min || Math.min(r.w, r.h) < 6; });
  checks.push(small.length
    ? { ok: false, en: `Undersized: ${small.map((s) => s.name).join(", ")}`, bn: `ছোট রুম: ${small.map((s) => s.nameBn).join(", ")}` }
    : { ok: true, en: "All rooms meet minimum size", bn: "সব রুম ন্যূনতম মাপ পূরণ করে" });
  checks.push(far <= 3.5
    ? { ok: true, en: `FAR ${far.toFixed(2)} within typical limit (≤3.5)`, bn: `FAR ${far.toFixed(2)} সীমার মধ্যে (≤৩.৫)` }
    : { ok: false, en: `FAR ${far.toFixed(2)} exceeds typical 3.5 — reduce floors`, bn: `FAR ${far.toFixed(2)} সীমা ছাড়িয়েছে — তলা কমান` });
  checks.push(coverage <= 67
    ? { ok: true, en: `Ground coverage ${coverage.toFixed(0)}% (≤67%)`, bn: `ভূমি আচ্ছাদন ${coverage.toFixed(0)}% (≤৬৭%)` }
    : { ok: false, en: `Ground coverage ${coverage.toFixed(0)}% high`, bn: `ভূমি আচ্ছাদন ${coverage.toFixed(0)}% বেশি` });
  if (i.parking) checks.push(i.plotWidth >= 30
    ? { ok: true, en: "Ground-floor parking feasible", bn: "নিচতলায় পার্কিং সম্ভব" }
    : { ok: false, en: "Plot width < 30 ft — parking tight", bn: "প্লট ৩০ ফুটের কম — পার্কিং কষ্টসাধ্য" });

  return { setbacks, buildW, buildD, footprint, plotArea, coverage, totalBuilt, far, rooms, checks, estCost: Math.round(totalBuilt * 3200) };
}

/** Parse "40x60 plot, south road, 3 bed 2 bath, 5 floors" (English or Bangla digits/words). */
export function parsePrompt(text: string, base: PlanInput = DEFAULT_INPUT): PlanInput {
  const s = text.toLowerCase().replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
  const out = { ...base };
  const dim = s.match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/);
  if (dim) { out.plotWidth = +dim[1]; out.plotDepth = +dim[2]; }
  const n = (re: RegExp) => { const m = s.match(re); return m ? +m[1] : undefined; };
  out.bedrooms = n(/(\d+)\s*(?:bed|br|বেড|শয়ন)/) ?? out.bedrooms;
  out.bathrooms = n(/(\d+)\s*(?:bath|toilet|wash|বাথ|টয়লেট)/) ?? out.bathrooms;
  out.floors = n(/(\d+)\s*(?:floor|stor|storey|tola|তলা)/) ?? out.floors;
  const dirs: [RoadSide, RegExp][] = [["north", /north|উত্তর/], ["south", /south|দক্ষিণ/], ["east", /east|পূর্ব/], ["west", /west|পশ্চিম/]];
  for (const [d, re] of dirs) if (re.test(s)) { out.road = d; break; }
  if (/no parking|পার্কিং ছাড়া/.test(s)) out.parking = false;
  if (/no dining|ডাইনিং ছাড়া/.test(s)) out.dining = false;
  return out;
}
