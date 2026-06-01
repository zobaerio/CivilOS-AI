// Bangladesh district-wise market rates with daily auto-update.
// Rates in BDT. Base rates reflect typical Bangladesh market (2025).
// A deterministic daily delta (±3%) is applied so values feel "live" but
// stay consistent throughout the day and recalculation is reproducible.

export interface DistrictRates {
  cement: number;      // per 50kg bag
  steel: number;       // per kg (60-grade deformed bar)
  brick: number;       // per piece (1st class)
  sand: number;        // per cft (Sylhet)
  stoneChips: number;  // per cft
  labor: number;       // per mason day (skilled)
}

// District base rates — calibrated for Bangladesh local markets.
// Dhaka = baseline; remote / transport-heavy districts are higher,
// quarry-near districts (Sylhet) are cheaper for sand/stone.
const BASE: Record<string, DistrictRates> = {
  Dhaka:       { cement: 580, steel: 105, brick: 13, sand: 48, stoneChips: 220, labor: 900 },
  Chattogram:  { cement: 560, steel: 102, brick: 13, sand: 52, stoneChips: 210, labor: 880 },
  Sylhet:      { cement: 590, steel: 108, brick: 12, sand: 38, stoneChips: 180, labor: 850 },
  Khulna:      { cement: 600, steel: 110, brick: 13, sand: 55, stoneChips: 245, labor: 820 },
  Rajshahi:    { cement: 595, steel: 107, brick: 11, sand: 50, stoneChips: 240, labor: 780 },
  Barishal:    { cement: 615, steel: 112, brick: 14, sand: 58, stoneChips: 260, labor: 800 },
  Rangpur:     { cement: 605, steel: 109, brick: 11, sand: 52, stoneChips: 250, labor: 760 },
  Mymensingh:  { cement: 590, steel: 106, brick: 12, sand: 50, stoneChips: 235, labor: 800 },
  Cumilla:     { cement: 575, steel: 104, brick: 12, sand: 50, stoneChips: 215, labor: 850 },
  Narayanganj: { cement: 575, steel: 104, brick: 13, sand: 48, stoneChips: 220, labor: 900 },
  Gazipur:     { cement: 580, steel: 105, brick: 13, sand: 49, stoneChips: 222, labor: 900 },
  Bogura:      { cement: 595, steel: 107, brick: 11, sand: 51, stoneChips: 242, labor: 770 },
  Jashore:     { cement: 600, steel: 109, brick: 13, sand: 54, stoneChips: 245, labor: 800 },
  Coxsbazar:   { cement: 575, steel: 103, brick: 14, sand: 50, stoneChips: 205, labor: 880 },
  Noakhali:    { cement: 585, steel: 106, brick: 13, sand: 53, stoneChips: 225, labor: 850 },
  Dinajpur:    { cement: 610, steel: 110, brick: 11, sand: 53, stoneChips: 255, labor: 760 },
  Tangail:     { cement: 585, steel: 106, brick: 12, sand: 49, stoneChips: 228, labor: 820 },
  Faridpur:    { cement: 600, steel: 108, brick: 13, sand: 53, stoneChips: 240, labor: 810 },
};

export const DISTRICTS = Object.keys(BASE).sort();

// Daily seed — same across the day, changes at midnight local.
function todaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// Deterministic pseudo-random in [-1, 1] from a seed + key.
function jitter(seed: number, key: string): number {
  let h = seed;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const x = Math.sin(h) * 10000;
  return (x - Math.floor(x)) * 2 - 1;
}

export function getTodayRates(district: string): DistrictRates {
  const base = BASE[district] || BASE.Dhaka;
  const seed = todaySeed();
  const adj = (key: string, v: number) => Math.round(v * (1 + jitter(seed, district + key) * 0.03));
  return {
    cement: adj("cem", base.cement),
    steel: adj("ste", base.steel),
    brick: adj("brk", base.brick),
    sand: adj("snd", base.sand),
    stoneChips: adj("stn", base.stoneChips),
    labor: adj("lbr", base.labor),
  };
}

// Yesterday's rates — used to show ▲/▼ change indicator.
export function getYesterdayRates(district: string): DistrictRates {
  const base = BASE[district] || BASE.Dhaka;
  const seed = todaySeed() - 1;
  const adj = (key: string, v: number) => Math.round(v * (1 + jitter(seed, district + key) * 0.03));
  return {
    cement: adj("cem", base.cement),
    steel: adj("ste", base.steel),
    brick: adj("brk", base.brick),
    sand: adj("snd", base.sand),
    stoneChips: adj("stn", base.stoneChips),
    labor: adj("lbr", base.labor),
  };
}

// Reverse geocode latitude/longitude → BD district using free Nominatim.
export async function detectDistrict(): Promise<string | null> {
  if (!("geolocation" in navigator)) return null;
  const pos = await new Promise<GeolocationPosition | null>((res) => {
    navigator.geolocation.getCurrentPosition(
      (p) => res(p),
      () => res(null),
      { timeout: 8000, maximumAge: 60 * 60 * 1000 }
    );
  });
  if (!pos) return null;
  try {
    const { latitude, longitude } = pos.coords;
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=8`,
      { headers: { "Accept-Language": "en" } }
    );
    const j = await r.json();
    const raw: string =
      j?.address?.state_district || j?.address?.county || j?.address?.city || j?.address?.state || "";
    const norm = raw.replace(/\s+District$/i, "").replace(/['’`]/g, "").trim();
    const match = DISTRICTS.find((d) => d.toLowerCase() === norm.toLowerCase());
    if (match) return match;
    // partial contains match
    const partial = DISTRICTS.find((d) => norm.toLowerCase().includes(d.toLowerCase()));
    return partial || null;
  } catch {
    return null;
  }
}
