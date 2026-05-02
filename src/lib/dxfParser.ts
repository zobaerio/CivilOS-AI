// Lightweight DXF text parser. Extracts LINE + LWPOLYLINE/POLYLINE entities,
// classifies them by layer name, and filters out noise (small segments).

export interface DxfLine {
  layer: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}

export interface DxfSummary {
  totalEntities: number;
  totalSegments: number;
  lines: DxfLine[];
  layers: Record<string, number>;
  layerLengths: Record<string, number>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  estimatedWallLength: number;
  detectedColumns: number;
  detectedDoors: number;
  detectedWindows: number;
  unitGuess: "mm" | "cm" | "m" | "in" | "ft" | "unknown";
  noiseFilteredCount: number;
}

const WALL_RX = /\b(wall|wal|brick|partition)\b/i;
const COL_RX = /\b(col|column|cols)\b/i;
const DOOR_RX = /\b(door|doors|dr)\b/i;
const WIN_RX = /\b(window|win|wnd)\b/i;
// layers we explicitly ignore for wall length:
const NON_WALL_RX = /\b(dim|dimension|text|hatch|grid|axis|center|centre|furniture|elec|plumb|hvac|pipe|ceiling|defpoints|viewport)\b/i;

function classify(layer: string) {
  if (NON_WALL_RX.test(layer)) return "noise";
  if (COL_RX.test(layer)) return "column";
  if (DOOR_RX.test(layer)) return "door";
  if (WIN_RX.test(layer)) return "window";
  if (WALL_RX.test(layer)) return "wall";
  return "other";
}

function guessUnits(maxDim: number): DxfSummary["unitGuess"] {
  if (maxDim <= 0) return "unknown";
  if (maxDim > 5000) return "mm";   // tens of meters expressed in mm
  if (maxDim > 500) return "cm";    // tens of meters in cm
  if (maxDim > 100) return "ft";    // typical building footprint in feet
  if (maxDim > 30) return "m";      // tens of meters
  if (maxDim > 5) return "in";
  return "unknown";
}

export function parseDXF(text: string): DxfSummary {
  const tokens = text.split(/\r?\n/).map((t) => t.trim());
  const rawLines: DxfLine[] = [];
  let i = 0;

  while (i < tokens.length - 1) {
    const code = tokens[i];
    const value = tokens[i + 1];

    if (code === "0" && value === "LINE") {
      let layer = "0";
      let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
      i += 2;
      while (i < tokens.length - 1 && tokens[i] !== "0") {
        const c = tokens[i], v = tokens[i + 1];
        if (c === "8") layer = v;
        else if (c === "10") x1 = parseFloat(v) || 0;
        else if (c === "20") y1 = parseFloat(v) || 0;
        else if (c === "11") x2 = parseFloat(v) || 0;
        else if (c === "21") y2 = parseFloat(v) || 0;
        i += 2;
      }
      rawLines.push({ layer, x1, y1, x2, y2, length: Math.hypot(x2 - x1, y2 - y1) });
    } else if (code === "0" && (value === "LWPOLYLINE" || value === "POLYLINE")) {
      let layer = "0";
      const verts: { x: number; y: number }[] = [];
      i += 2;
      while (i < tokens.length - 1 && tokens[i] !== "0") {
        const c = tokens[i], v = tokens[i + 1];
        if (c === "8") layer = v;
        else if (c === "10") verts.push({ x: parseFloat(v) || 0, y: NaN });
        else if (c === "20" && verts.length) verts[verts.length - 1].y = parseFloat(v) || 0;
        i += 2;
      }
      for (let k = 0; k < verts.length - 1; k++) {
        const a = verts[k], b = verts[k + 1];
        if (isFinite(a.x) && isFinite(a.y) && isFinite(b.x) && isFinite(b.y)) {
          rawLines.push({ layer, x1: a.x, y1: a.y, x2: b.x, y2: b.y, length: Math.hypot(b.x - a.x, b.y - a.y) });
        }
      }
    } else {
      i++;
    }
  }

  // Bounds from all entities
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const l of rawLines) {
    minX = Math.min(minX, l.x1, l.x2);
    minY = Math.min(minY, l.y1, l.y2);
    maxX = Math.max(maxX, l.x1, l.x2);
    maxY = Math.max(maxY, l.y1, l.y2);
  }
  const maxDim = Math.max(maxX - minX, maxY - minY);
  const unitGuess = guessUnits(maxDim);

  // Noise threshold: ignore tiny segments (dimensions, hatches). Use 0.5% of max dim, min 1 unit.
  const minSeg = Math.max(maxDim * 0.005, 1);

  const layers: Record<string, number> = {};
  const layerLengths: Record<string, number> = {};
  let wallLen = 0, columns = 0, doors = 0, windows = 0, filtered = 0;
  const keptLines: DxfLine[] = [];

  for (const l of rawLines) {
    const kind = classify(l.layer);
    if (kind === "noise") { filtered++; continue; }
    if (l.length < minSeg && kind !== "column") { filtered++; continue; }

    layers[l.layer] = (layers[l.layer] || 0) + 1;
    layerLengths[l.layer] = (layerLengths[l.layer] || 0) + l.length;
    keptLines.push(l);

    if (kind === "wall") wallLen += l.length;
    else if (kind === "column") columns++;
    else if (kind === "door") doors++;
    else if (kind === "window") windows++;
  }

  // Fallback: no explicit wall layer found → use longest 60% of segments on layer "0"
  if (wallLen === 0) {
    const layer0 = keptLines.filter((l) => l.layer === "0").sort((a, b) => b.length - a.length);
    const keep = Math.ceil(layer0.length * 0.6);
    wallLen = layer0.slice(0, keep).reduce((s, l) => s + l.length, 0);
  }

  return {
    totalEntities: rawLines.length,
    totalSegments: keptLines.length,
    lines: keptLines,
    layers,
    layerLengths,
    bounds: {
      minX: isFinite(minX) ? minX : 0,
      minY: isFinite(minY) ? minY : 0,
      maxX: isFinite(maxX) ? maxX : 0,
      maxY: isFinite(maxY) ? maxY : 0,
    },
    estimatedWallLength: Math.round(wallLen),
    detectedColumns: columns,
    detectedDoors: doors,
    detectedWindows: windows,
    unitGuess,
    noiseFilteredCount: filtered,
  };
}
