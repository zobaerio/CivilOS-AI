// Lightweight DXF text parser. Extracts LINE entities and groups by layer.
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
  lines: DxfLine[];
  layers: Record<string, number>;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  estimatedWallLength: number;
  detectedColumns: number;
}

export function parseDXF(text: string): DxfSummary {
  const lines: DxfLine[] = [];
  const tokens = text.split(/\r?\n/).map((t) => t.trim());
  let i = 0;
  while (i < tokens.length - 1) {
    if (tokens[i] === "0" && tokens[i + 1] === "LINE") {
      let layer = "0";
      let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
      i += 2;
      while (i < tokens.length - 1 && tokens[i] !== "0") {
        const code = tokens[i];
        const value = tokens[i + 1];
        if (code === "8") layer = value;
        else if (code === "10") x1 = parseFloat(value) || 0;
        else if (code === "20") y1 = parseFloat(value) || 0;
        else if (code === "11") x2 = parseFloat(value) || 0;
        else if (code === "21") y2 = parseFloat(value) || 0;
        i += 2;
      }
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      lines.push({ layer, x1, y1, x2, y2, length });
    } else {
      i++;
    }
  }

  const layers: Record<string, number> = {};
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let wallLength = 0;
  for (const l of lines) {
    layers[l.layer] = (layers[l.layer] || 0) + 1;
    minX = Math.min(minX, l.x1, l.x2);
    minY = Math.min(minY, l.y1, l.y2);
    maxX = Math.max(maxX, l.x1, l.x2);
    maxY = Math.max(maxY, l.y1, l.y2);
    if (/wall|wal/i.test(l.layer) || l.layer === "0") wallLength += l.length;
  }
  const detectedColumns = Object.entries(layers)
    .filter(([k]) => /col|column/i.test(k))
    .reduce((s, [, v]) => s + v, 0);

  return {
    totalEntities: lines.length,
    lines,
    layers,
    bounds: {
      minX: isFinite(minX) ? minX : 0,
      minY: isFinite(minY) ? minY : 0,
      maxX: isFinite(maxX) ? maxX : 0,
      maxY: isFinite(maxY) ? maxY : 0,
    },
    estimatedWallLength: Math.round(wallLength),
    detectedColumns,
  };
}
