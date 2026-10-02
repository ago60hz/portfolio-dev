import { describe, expect, it } from "vitest";
import {
  COLUMNS,
  COVERAGE,
  GAP_X,
  LIFT,
  ROWS,
  GAP_Y,
  RADIUS,
  ROLL,
  STRIPS,
  TILE_W,
  collagePoses,
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
  const [pose] = collagePoses(aspects(9));
  const [slot] = layoutSpread(aspects(9)).slots;
  const { globe, grid } = tileTransforms(pose, slot);
  // Only the transform functions themselves. A naive `\w+\(` also catches the
  // calc() and var() inside their arguments, which differ between the two
  // poses by design and say nothing about whether CSS can interpolate them.
  const functionsOf = (t: string) =>
    t.match(/(?:translate3d|translateZ|rotateX|rotateY|rotateZ|scale)\(/g);

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
    expect(grid).toContain("rotateZ(0deg)");
    expect(grid).toContain("translateZ(0px)");
    expect(globe).toContain("translate3d(0px, 0px, 0px)");
  });
});

describe("collagePoses", () => {
  // The real pool's shapes: one 2.38 banner, the rest 16:9 to 4:3.
  const pool = [2.38, ...Array(8).fill(1.78), 1.42, 1.58, ...Array(11).fill(1.33)];
  const poses = collagePoses(pool);

  it("covers the ball with overlap to spare, so no far side shows through", () => {
    const drawn = pool.reduce(
      (sum, a, i) => sum + TILE_W * (TILE_W / a) * poses[i].scale ** 2,
      0,
    );
    expect(drawn / (4 * Math.PI * RADIUS ** 2)).toBeCloseTo(COVERAGE, 6);
  });

  it("leans every print by hand, but never far enough to lose the ball", () => {
    for (const p of poses) expect(Math.abs(p.roll)).toBeLessThanOrEqual(ROLL);
    // ...and not all the same way, which would read as a twist, not a hand.
    expect(poses.some((p) => p.roll > 1) && poses.some((p) => p.roll < -1)).toBe(true);
  });

  it("never puts two overlapping prints on the same layer", () => {
    // Overlapping prints closer than one LIFT apart cut through each other.
    const rad = Math.PI / 180;
    const dir = (p: (typeof poses)[number]) => [
      Math.cos(p.pitch * rad) * Math.sin(p.yaw * rad),
      Math.sin(p.pitch * rad),
      Math.cos(p.pitch * rad) * Math.cos(p.yaw * rad),
    ];
    const reach = (i: number) =>
      (Math.hypot(TILE_W, TILE_W / pool[i]) * poses[i].scale) / 2 / RADIUS;
    let pairs = 0;
    for (let a = 0; a < poses.length; a++) {
      for (let b = a + 1; b < poses.length; b++) {
        const [da, db] = [dir(poses[a]), dir(poses[b])];
        const angle = Math.acos(Math.min(1, da.reduce((d, v, k) => d + v * db[k], 0)));
        if (angle >= reach(a) + reach(b)) continue;
        pairs++;
        expect(Math.abs(poses[a].lift - poses[b].lift)).toBeGreaterThanOrEqual(LIFT);
      }
    }
    // It is a collage: plenty of prints really do overlap.
    expect(pairs).toBeGreaterThan(poses.length);
  });

  it("keeps the stack shallow enough that the outline stays round", () => {
    const deepest = Math.max(...poses.map((p) => p.lift));
    expect(deepest / RADIUS).toBeLessThanOrEqual(0.1);
  });

  it("has a hierarchy of sizes, not one size", () => {
    const scales = poses.map((p) => p.scale);
    expect(Math.max(...scales) / Math.min(...scales)).toBeGreaterThan(1.5);
  });

  it("is the same collage on every render", () => {
    expect(collagePoses(pool)).toEqual(poses);
  });

  it("lands every hinge of every print on its own layer of the sphere", () => {
    // Walk each chain out from the print's centre the way the CSS does. Across:
    // the first hinge turns half a step, every hinge after it a whole one.
    // Down: the middle row is flat and the rows either side turn a whole step.
    // A print is laid out at its drawn size, so its sphere is just R + lift.
    const rad = (d: number) => (d * Math.PI) / 180;
    const off = (x: number, z: number, radius: number) =>
      Math.abs(Math.hypot(x, z + radius) - radius);
    poses.forEach((p, i) => {
      const radius = RADIUS + p.lift;
      const strip = (TILE_W * p.scale) / STRIPS;
      let x = 0;
      let z = 0;
      for (let j = 0; j < STRIPS / 2; j++) {
        const turn = rad(p.bendStep / 2 + j * p.bendStep);
        x += strip * Math.cos(turn);
        z -= strip * Math.sin(turn);
        expect(off(x, z, radius)).toBeLessThan(0.01);
      }
      const row = ((TILE_W / pool[i]) * p.scale) / ROWS;
      // The middle row is a flat tangent: its edge sits just off the ball,
      // by less than one LIFT, so no neighbour can reach through it...
      let y = row / 2;
      z = 0;
      expect(off(y, z, radius)).toBeLessThan(LIFT);
      // ...and the outer row's far edge lands back on it exactly.
      y += row * Math.cos(rad(p.foldStep));
      z -= row * Math.sin(rad(p.foldStep));
      expect(off(y, z, radius)).toBeLessThan(0.01);
    });
  });

  it("cuts into an even number of strips, so the crease falls on the centre", () => {
    expect(STRIPS % 2).toBe(0);
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
