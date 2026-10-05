// Survey math helpers (metres / Bangladesh land units)
export type LatLng = { lat: number; lng: number };
const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function distance(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function pathLength(pts: LatLng[], closed = false) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += distance(pts[i - 1], pts[i]);
  if (closed && pts.length > 2) s += distance(pts[pts.length - 1], pts[0]);
  return s;
}
/** Polygon area in m² using local projection + shoelace */
export function polygonArea(pts: LatLng[]) {
  if (pts.length < 3) return 0;
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const xy = pts.map((p) => [rad(p.lng) * R * Math.cos(rad(lat0)), rad(p.lat) * R]);
  let a = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i], [x2, y2] = xy[(i + 1) % xy.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}
/** Bearing in degrees (0 = North, clockwise) */
export function bearing(a: LatLng, b: LatLng) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
/** Offset a point by metres east/north */
export function offset(p: LatLng, east: number, north: number): LatLng {
  return { lat: p.lat + (north / R) * (180 / Math.PI), lng: p.lng + (east / (R * Math.cos(rad(p.lat)))) * (180 / Math.PI) };
}

export const SFT_PER_M2 = 10.7639;
/** Bangladesh land units from square feet */
export function landUnits(sft: number) {
  return {
    sft,
    m2: sft / SFT_PER_M2,
    decimal: sft / 435.6, // শতাংশ
    katha: sft / 720,
    bigha: sft / 14400,
    acre: sft / 43560,
  };
}
/** Trapezoid / irregular 4-side plot area (sides a,b,c,d + one diagonal), via two triangles (Heron) */
export function quadArea(a: number, b: number, c: number, d: number, diag: number) {
  const heron = (x: number, y: number, z: number) => {
    const s = (x + y + z) / 2; const v = s * (s - x) * (s - y) * (s - z);
    return v > 0 ? Math.sqrt(v) : 0;
  };
  return heron(a, b, diag) + heron(c, d, diag);
}
