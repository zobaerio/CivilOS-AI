import { describe, it, expect } from "vitest";
import { computeBNBCLoads, BNBC_ZONES, BNBC_SOILS } from "./engineering";
import type { EstimateData } from "./estimateEngine";

const makeEstimate = (overrides: Partial<EstimateData> = {}): EstimateData => ({
  projectName: "Test",
  plotSize: "40x60",
  totalFloorArea: 2400,
  floors: 3,
  quality: "standard",
  costPerSqft: 2200,
  totalCost: 5_280_000,
  completionMonths: 8,
  rooms: [],
  civilWork: {},
  materials: {
    "Steel Rods": { qty: 1000, unit: "kg", rate: 110, total: 110_000 },
    Cement: { qty: 200, unit: "bag", rate: 560, total: 112_000 },
    Bricks: { qty: 20000, unit: "pcs", rate: 12, total: 240_000 },
    Sand: { qty: 800, unit: "cft", rate: 45, total: 36_000 },
    "Stone Chips": { qty: 600, unit: "cft", rate: 220, total: 132_000 },
    "Paint (Interior)": { qty: 4000, unit: "sft", rate: 18, total: 72_000 },
    "Paint (Exterior)": { qty: 2000, unit: "sft", rate: 22, total: 44_000 },
    Tiles: { qty: 1800, unit: "sft", rate: 90, total: 162_000 },
    Doors: { qty: 10, unit: "pcs", rate: 9000, total: 90_000 },
    Windows: { qty: 12, unit: "pcs", rate: 7000, total: 84_000 },
  },
  labor: {},
  finishing: {},
  electrical: {},
  plumbing: {},
  costBreakdown: [],
  suggestions: [],
  ...overrides,
});

describe("computeBNBCLoads — BNBC 2022 load engine", () => {
  const est = makeEstimate();
  const loads = computeBNBCLoads(est, "Zone 2 (Dhaka)", "SC", 1.0);

  it("returns all 7 load detail codes (D, L, W, S, H, F, E)", () => {
    const codes = loads.loadDetails.map((d) => d.code).sort();
    expect(codes).toEqual(["D", "E", "F", "H", "L", "S", "W"]);
  });

  it("each load detail references a BNBC 2022 clause", () => {
    for (const d of loads.loadDetails) {
      expect(d.reference).toMatch(/BNBC 2022/);
      expect(d.formula.length).toBeGreaterThan(0);
    }
  });

  it("computes positive Dead and Live loads proportional to area", () => {
    expect(loads.totalDeadLoad).toBeGreaterThan(0);
    expect(loads.totalLiveLoad).toBeGreaterThan(0);
    expect(loads.totalDeadLoad).toBeGreaterThan(loads.totalLiveLoad);
  });

  it("uses correct seismic zone factor and soil factor", () => {
    expect(loads.zoneFactor).toBe(BNBC_ZONES["Zone 2 (Dhaka)"]);
    expect(loads.soilFactor).toBe(BNBC_SOILS["SC"].factor);
  });

  it("snow load is zero for Bangladesh plains", () => {
    expect(loads.snowLoad).toBe(0);
  });

  it("earth pressure is zero when no basement", () => {
    expect(loads.earthPressure).toBe(0);
  });

  it("computes seismic base shear V = Cs·W·S with Cs = Z·I·2.5/R", () => {
    const Cs = (loads.zoneFactor * loads.importanceFactor * 2.5) / loads.responseFactor;
    expect(loads.seismicCoeff).toBeCloseTo(parseFloat(Cs.toFixed(3)), 3);
    const expectedV = Math.round(Cs * loads.buildingWeight * loads.soilFactor);
    expect(loads.baseShear).toBe(expectedV);
  });

  it("includes 7 BNBC 2022 factored load combinations", () => {
    expect(loads.combos).toHaveLength(7);
    expect(loads.combos[0].formula).toBe("1.4 D");
  });

  it("marks exactly one governing combination = max factored load", () => {
    const governing = loads.combos.filter((c) => c.governs);
    expect(governing).toHaveLength(1);
    const max = Math.max(...loads.combos.map((c) => c.factoredLoad));
    expect(governing[0].factoredLoad).toBe(max);
    expect(loads.governingCombo).toBe(governing[0].name);
    expect(loads.governingValue).toBe(max);
  });

  it("base-shear / building-weight ratio stays within practical envelope (≤ 0.30)", () => {
    const ratio = loads.baseShear / loads.buildingWeight;
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(0.3);
  });

  it("scales dead load linearly with floor area", () => {
    const small = computeBNBCLoads(makeEstimate({ totalFloorArea: 1200 }));
    const big = computeBNBCLoads(makeEstimate({ totalFloorArea: 2400 }));
    expect(big.totalDeadLoad).toBeGreaterThan(small.totalDeadLoad);
    expect(big.totalDeadLoad / small.totalDeadLoad).toBeCloseTo(2, 1);
  });

  it("higher seismic zone produces larger base shear", () => {
    const dhaka = computeBNBCLoads(est, "Zone 2 (Dhaka)", "SC", 1.0);
    const sylhet = computeBNBCLoads(est, "Zone 1 (Sylhet)", "SC", 1.0);
    expect(sylhet.baseShear).toBeGreaterThan(dhaka.baseShear);
  });
});
