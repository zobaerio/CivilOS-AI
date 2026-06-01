// Demo estimation data generator
export interface RoomDetail {
  name: string;
  length: number;
  width: number;
  area: number;
  doors: number;
  windows: number;
}

export interface EstimateData {
  projectName: string;
  plotSize: string;
  totalFloorArea: number;
  floors: number;
  quality: string;
  costPerSqft: number;
  totalCost: number;
  completionMonths: number;
  rooms: RoomDetail[];
  civilWork: Record<string, number>;
  materials: Record<string, { qty: number; unit: string; rate: number; total: number }>;
  labor: Record<string, { days: number; rate: number; total: number }>;
  finishing: Record<string, number>;
  electrical: Record<string, number | string>;
  plumbing: Record<string, number | string>;
  costBreakdown: { category: string; amount: number }[];
  suggestions: string[];
}

const qualityMultiplier: Record<string, number> = { economy: 0.75, standard: 1, premium: 1.4 };

export interface RateOverrides {
  cement?: number;
  steel?: number;
  brick?: number;
  sand?: number;
  stoneChips?: number;
  labor?: number; // mason daily rate; other crews scale proportionally
}

export function generateEstimate(params: {
  plotLength: number;
  plotWidth: number;
  floors: number;
  floorHeight: number;
  wallThickness: number;
  quality: string;
  projectType: string;
  unit: string;
  fileName: string;
  rates?: RateOverrides;
}): EstimateData {
  const { plotLength, plotWidth, floors, floorHeight, wallThickness, quality, fileName, rates } = params;
  const mult = qualityMultiplier[quality] || 1;
  const plotArea = plotLength * plotWidth;
  const builtUpArea = plotArea * 0.7; // 70% coverage
  const totalFloorArea = builtUpArea * floors;
  const wallLength = (plotLength + plotWidth) * 2 * 1.8; // interior walls add ~80%
  const wallArea = wallLength * floorHeight * floors;
  const wallVolume = wallArea * (wallThickness / 12); // in cft

  // Rooms
  const rooms: RoomDetail[] = [
    { name: "Master Bedroom", length: 14, width: 12, area: 168, doors: 1, windows: 2 },
    { name: "Bedroom 2", length: 12, width: 10, area: 120, doors: 1, windows: 1 },
    { name: "Living Room", length: 16, width: 14, area: 224, doors: 1, windows: 2 },
    { name: "Kitchen", length: 10, width: 8, area: 80, doors: 1, windows: 1 },
    { name: "Dining Room", length: 12, width: 10, area: 120, doors: 1, windows: 1 },
    { name: "Bathroom 1", length: 8, width: 6, area: 48, doors: 1, windows: 1 },
    { name: "Bathroom 2", length: 7, width: 5, area: 35, doors: 1, windows: 1 },
    { name: "Veranda", length: plotLength * 0.6, width: 6, area: plotLength * 0.6 * 6, doors: 0, windows: 0 },
  ];

  // Civil work costs
  const civilWork: Record<string, number> = {
    "Earthwork & Excavation": Math.round(plotArea * 12 * mult),
    "Foundation": Math.round(plotArea * 45 * mult),
    "Footing": Math.round(plotArea * 18 * mult),
    "Columns": Math.round(floors * 8 * 3500 * mult),
    "Beams": Math.round(floors * 12 * 2800 * mult),
    "Slab / Roof Casting": Math.round(builtUpArea * floors * 35 * mult),
    "Masonry Work": Math.round(wallVolume * 8 * mult),
    "Plaster Work": Math.round(wallArea * 2 * 6 * mult),
  };

  // Materials
  const cementBags = Math.round(totalFloorArea * 0.4 * mult);
  const sand = Math.round(totalFloorArea * 0.82);
  const stone = Math.round(totalFloorArea * 0.61);
  const bricks = Math.round(wallVolume * 13.5);
  const steel = Math.round(totalFloorArea * 4.2 * mult);

  const materials: Record<string, { qty: number; unit: string; rate: number; total: number }> = {
    "Cement": { qty: cementBags, unit: "bags", rate: 420, total: cementBags * 420 },
    "Sand": { qty: sand, unit: "cft", rate: 45, total: sand * 45 },
    "Stone Chips": { qty: stone, unit: "cft", rate: 65, total: stone * 65 },
    "Bricks": { qty: bricks, unit: "pcs", rate: 12, total: bricks * 12 },
    "Steel Rods": { qty: steel, unit: "kg", rate: 85, total: steel * 85 },
    "Paint (Interior)": { qty: Math.round(wallArea * 0.8), unit: "sqft", rate: 8, total: Math.round(wallArea * 0.8) * 8 },
    "Paint (Exterior)": { qty: Math.round(wallArea * 0.3), unit: "sqft", rate: 10, total: Math.round(wallArea * 0.3) * 10 },
    "Tiles": { qty: Math.round(totalFloorArea * 1.08), unit: "sqft", rate: Math.round(25 * mult), total: Math.round(totalFloorArea * 1.08) * Math.round(25 * mult) },
    "Doors": { qty: rooms.reduce((s, r) => s + r.doors, 0) * floors, unit: "pcs", rate: Math.round(8000 * mult), total: rooms.reduce((s, r) => s + r.doors, 0) * floors * Math.round(8000 * mult) },
    "Windows": { qty: rooms.reduce((s, r) => s + r.windows, 0) * floors, unit: "pcs", rate: Math.round(5000 * mult), total: rooms.reduce((s, r) => s + r.windows, 0) * floors * Math.round(5000 * mult) },
  };

  const labor: Record<string, { days: number; rate: number; total: number }> = {
    "Mason": { days: Math.round(totalFloorArea * 0.12), rate: 800, total: Math.round(totalFloorArea * 0.12) * 800 },
    "Rod Binder": { days: Math.round(totalFloorArea * 0.05), rate: 700, total: Math.round(totalFloorArea * 0.05) * 700 },
    "Carpenter": { days: Math.round(totalFloorArea * 0.04), rate: 750, total: Math.round(totalFloorArea * 0.04) * 750 },
    "Electrician": { days: Math.round(totalFloorArea * 0.03), rate: 700, total: Math.round(totalFloorArea * 0.03) * 700 },
    "Plumber": { days: Math.round(totalFloorArea * 0.02), rate: 700, total: Math.round(totalFloorArea * 0.02) * 700 },
    "Painter": { days: Math.round(totalFloorArea * 0.04), rate: 650, total: Math.round(totalFloorArea * 0.04) * 650 },
    "Tiles Worker": { days: Math.round(totalFloorArea * 0.03), rate: 700, total: Math.round(totalFloorArea * 0.03) * 700 },
    "General Labor": { days: Math.round(totalFloorArea * 0.15), rate: 500, total: Math.round(totalFloorArea * 0.15) * 500 },
  };

  const finishing: Record<string, number> = {
    "Floor Finish": Math.round(totalFloorArea * 28 * mult),
    "Wall Finish": Math.round(wallArea * 12 * mult),
    "Ceiling Finish": Math.round(totalFloorArea * 8 * mult),
    "Kitchen Finish": Math.round(25000 * mult),
    "Bathroom Finish": Math.round(2 * 18000 * mult),
    "Exterior Paint": Math.round(wallArea * 0.3 * 10 * mult),
    "Interior Paint": Math.round(wallArea * 0.8 * 8 * mult),
  };

  const electrical: Record<string, number | string> = {
    "Wiring Points": Math.round(totalFloorArea * 0.08),
    "Switches": Math.round(totalFloorArea * 0.06),
    "DB Box": floors,
    "Fan Points": rooms.length * floors,
    "Light Points": Math.round(rooms.length * floors * 1.5),
    "Estimated Cost": Math.round(totalFloorArea * 45 * mult),
  };

  const plumbing: Record<string, number | string> = {
    "Pipe Length (ft)": Math.round(totalFloorArea * 0.2),
    "Water Tank (liters)": Math.round(floors * 500),
    "Bathroom Fittings Sets": 2 * floors,
    "Kitchen Fittings Set": floors,
    "Estimated Cost": Math.round(totalFloorArea * 35 * mult),
  };

  const materialTotal = Object.values(materials).reduce((s, m) => s + m.total, 0);
  const laborTotal = Object.values(labor).reduce((s, l) => s + l.total, 0);
  const civilTotal = Object.values(civilWork).reduce((s, v) => s + v, 0);
  const finishingTotal = Object.values(finishing).reduce((s, v) => s + v, 0);
  const elecCost = typeof electrical["Estimated Cost"] === "number" ? electrical["Estimated Cost"] : 0;
  const plumbCost = typeof plumbing["Estimated Cost"] === "number" ? plumbing["Estimated Cost"] : 0;

  const subtotal = materialTotal + laborTotal + civilTotal + finishingTotal + elecCost + plumbCost;
  const transport = Math.round(subtotal * 0.03);
  const overhead = Math.round(subtotal * 0.08);
  const contingency = Math.round(subtotal * 0.05);
  const totalCost = subtotal + transport + overhead + contingency;

  const costBreakdown = [
    { category: "Civil Work", amount: civilTotal },
    { category: "Materials", amount: materialTotal },
    { category: "Labor", amount: laborTotal },
    { category: "Finishing", amount: finishingTotal },
    { category: "Electrical", amount: elecCost },
    { category: "Plumbing", amount: plumbCost },
    { category: "Transport", amount: transport },
    { category: "Overhead", amount: overhead },
    { category: "Contingency", amount: contingency },
  ];

  const suggestions = [
    "Using 10-inch external walls with 5-inch internal walls can optimize cost by ~8%.",
    "Consider fly ash bricks to reduce material cost while maintaining strength.",
    "Reducing corridor area can lower total wall construction cost.",
    `${quality === "premium" ? "Premium tiles significantly increase finishing cost — consider standard tiles in less visible areas." : "Upgrading to vitrified tiles in living areas improves aesthetics at marginal cost."}`,
    "Ensure proper ventilation in kitchen and bathrooms to reduce future maintenance costs.",
    "Pre-embedded electrical conduits during construction save 15-20% on wiring costs.",
    "A rainwater harvesting system can be integrated at minimal additional cost during foundation work.",
  ];

  return {
    projectName: fileName.replace(/\.[^.]+$/, "") || "My House Project",
    plotSize: `${plotLength} × ${plotWidth} ft`,
    totalFloorArea: Math.round(totalFloorArea),
    floors,
    quality: quality.charAt(0).toUpperCase() + quality.slice(1),
    costPerSqft: Math.round(totalCost / totalFloorArea),
    totalCost,
    completionMonths: Math.round(floors * 4 + 2),
    rooms,
    civilWork,
    materials,
    labor,
    finishing,
    electrical,
    plumbing,
    costBreakdown,
    suggestions,
  };
}
