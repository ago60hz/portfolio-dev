import { describe, expect, it } from "vitest";
import { GALLERY_TILES } from "@/content/gallery";
import { COLUMNS, GAP_Y, TILE_W, layoutSpread, wrapOffset } from "./infinite";

const aspects = (n: number) => Array.from({ length: n }, (_, i) => 1 + (i % 3) * 0.4);

describe("layoutSpread", () => {
  it("uses every column", () => {
    const { slots } = layoutSpread(aspects(24));
    expect(new Set(slots.map((s) => s.x)).size).toBe(COLUMNS);
  });

  it("evens the columns up, so every gap on the wall is about the same", () => {
    // Every column is stretched to the tallest; a short one shows the
    // difference as wide gaps. Balanced, no column's gaps run more than a
    // tenth over the nominal. On the real pool, which is what the column
    // count was chosen for.
    const { slots, periodY } = layoutSpread(GALLERY_TILES.map((t) => t.width / t.height));
    const byColumn = new Map<number, typeof slots>();
    for (const s of slots) byColumn.set(s.x, [...(byColumn.get(s.x) ?? []), s]);
    for (const column of byColumn.values()) {
      const content = column.reduce((sum, s) => sum + s.h, 0);
      expect((periodY - content) / column.length).toBeLessThan(GAP_Y * 1.1);
    }
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
    // 1077u is the design frame; 884 less the 38u header is the visible height.
    // The seam sits half a period out, so a whole print has to fit past the
    // Window's edge before it.
    expect(periodX / 2).toBeGreaterThan(1077 / 2 + TILE_W);
    expect(periodY).toBeGreaterThan(884 - 38);
  });

  it("draws prints big enough to read", () => {
    // A third of the design frame: the size the owner asked for, so the
    // detail on a screen can actually be made out.
    expect(TILE_W).toBeGreaterThanOrEqual(1077 / 3);
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
      // Neighbours stay one column apart however far the wall has travelled.
      expect(Math.abs(b - a) % 1332).toBeCloseTo(222, 6);
    }
  });

  it("is a no-op without a period, rather than dividing by zero", () => {
    expect(wrapOffset(100, 900, 0)).toBe(0);
  });
});
