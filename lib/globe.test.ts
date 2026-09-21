import { describe, expect, it } from "vitest";
import {
  COLUMNS,
  GAP_X,
  GAP_Y,
  TILE_W,
  layoutSpread,
  spherePlacements,
  tileTransforms,
  wrapOffset,
} from "./globe";

const aspects = (n: number) => Array.from({ length: n }, (_, i) => 1 + (i % 3) * 0.4);

describe("spherePlacements", () => {
  it("spreads latitudes evenly from pole to pole", () => {
    const pitches = spherePlacements(40).map((p) => p.pitch);
    // The first and last points sit half a band in from the poles, which is
    // the point: a point ON the pole is a tile nobody ever sees face-on.
    expect(pitches[0]).toBeGreaterThan(70);
    expect(pitches.at(-1)).toBeLessThan(-70);
    // Monotonic: the spiral walks down the sphere once and never doubles back.
    expect(pitches.every((p, i) => i === 0 || p < pitches[i - 1])).toBe(true);
  });

  it("never repeats a longitude, which is what kills the seam", () => {
    const yaws = spherePlacements(40).map((p) => ((p.yaw % 360) + 360) % 360);
    const gaps = [...yaws].sort((a, b) => a - b).map((y, i, all) => (i ? y - all[i - 1] : y));
    expect(Math.max(...gaps)).toBeLessThan(45);
  });
});

describe("layoutSpread", () => {
  it("fills the shortest column first", () => {
    const { slots } = layoutSpread(aspects(24));
    const columns = new Set(slots.slice(0, COLUMNS).map((s) => s.x));
    // The first pass has to touch every column before any column takes a second.
    expect(columns.size).toBe(COLUMNS);
  });

  it("centres the block on the origin", () => {
    const { slots } = layoutSpread(aspects(30));
    const left = Math.min(...slots.map((s) => s.x - s.w / 2));
    const right = Math.max(...slots.map((s) => s.x + s.w / 2));
    expect(left + right).toBeCloseTo(0, 6);
  });

  it("leaves no void in any column, so the wall repeats seamlessly", () => {
    // The regression this guards: one period for every column, with the
    // shorter columns carrying the difference as a hole. Every gap in a column
    // -- including the one that wraps from its last picture back round to its
    // first -- has to be the same, and none can be tighter than GAP_Y.
    const { slots, periodY } = layoutSpread(aspects(22));
    const byColumn = new Map<number, typeof slots>();
    for (const s of slots) byColumn.set(s.x, [...(byColumn.get(s.x) ?? []), s]);

    for (const column of byColumn.values()) {
      const sorted = [...column].sort((a, b) => a.y - b.y);
      const gaps = sorted.map((s, i) => {
        const next = sorted[(i + 1) % sorted.length];
        const nextTop = next.y - next.h / 2 + (i === sorted.length - 1 ? periodY : 0);
        return nextTop - (s.y + s.h / 2);
      });
      for (const g of gaps) {
        expect(g).toBeCloseTo(gaps[0], 6);
        expect(g).toBeGreaterThanOrEqual(GAP_Y - 1e-6);
      }
    }
  });

  it("repeats on a period wider than the Window, so the wrap is off-screen", () => {
    const { periodX, periodY } = layoutSpread(aspects(22));
    expect(periodX).toBe(COLUMNS * (TILE_W + GAP_X));
    // 1077u is the design frame; 884 less the 38u header is the visible height.
    expect(periodX).toBeGreaterThan(1077);
    expect(periodY).toBeGreaterThan(884 - 38);
  });
});

describe("tileTransforms", () => {
  const [placement] = spherePlacements(9);
  const [slot] = layoutSpread(aspects(9)).slots;
  const { globe, grid } = tileTransforms(placement, slot);
  // Only the transform functions themselves. A naive `\w+\(` also catches the
  // calc() and var() inside their arguments, which differ between the two
  // poses by design and say nothing about whether CSS can interpolate them.
  const functionsOf = (t: string) =>
    t.match(/(?:translate3d|translateZ|rotateX|rotateY|scale)\(/g);

  it("gives both poses the same function list", () => {
    // The whole morph rests on this: CSS only interpolates two transforms
    // component by component when their lists match. Mismatched, it decomposes
    // a matrix instead and the sphere's unwind is lost.
    expect(functionsOf(globe)).toEqual(functionsOf(grid));
  });

  it("authors distances in --u, never pixels", () => {
    expect(grid).toContain("var(--u)");
    expect(globe).toContain("var(--u)");
    // 0px is the identity for translateZ and carries no measurement.
    expect(grid).not.toMatch(/[1-9]\d*px/);
  });

  it("flattens in the spread and leaves the plane on the sphere", () => {
    expect(grid).toContain("rotateY(0deg)");
    expect(grid).toContain("translateZ(0px)");
    expect(globe).toContain("translate3d(0px, 0px, 0px)");
  });
});

describe("wrapOffset", () => {
  it("leaves a tile alone while it is in frame", () => {
    expect(wrapOffset(100, 0, 1332)).toBe(0);
    expect(wrapOffset(100, 400, 1332)).toBe(0);
  });

  it("moves a tile a whole period once it passes the halfway line", () => {
    expect(wrapOffset(100, 700, 1332)).toBe(-1332);
    expect(wrapOffset(100, -800, 1332)).toBe(1332);
  });

  it("keeps the lattice exact at any distance", () => {
    for (const pan of [0, 900, -2400, 5000]) {
      const a = 100 + wrapOffset(100, pan, 1332);
      const b = 322 + wrapOffset(322, pan, 1332);
      // Neighbours stay one column apart however far the spread has travelled.
      expect(Math.abs(b - a) % 1332).toBeCloseTo(222, 6);
    }
  });

  it("is a no-op without a period, rather than dividing by zero", () => {
    expect(wrapOffset(100, 900, 0)).toBe(0);
  });
});
