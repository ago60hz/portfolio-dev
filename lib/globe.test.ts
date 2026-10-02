import { describe, expect, it } from "vitest";
import { GALLERY_TILES } from "@/content/gallery";
import {
  COLUMNS,
  COVERAGE,
  GAP_X,
  GRID,
  HEROES,
  LIFT,
  PALE,
  GAP_Y,
  RADIUS,
  ROLL,
  TILE_W,
  collagePoses,
  decal,
  rectToQuad,
  sphereAt,
  uncovered,
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
  // The real pool, so the chosen deal is tested on what it was chosen for.
  const pool = GALLERY_TILES.map((t) => t.width / t.height);
  const traits = GALLERY_TILES.map((t) => ({ group: t.slug, sat: t.sat }));
  const poses = collagePoses(pool, undefined, traits);

  it("covers the ball with overlap to spare, so no far side shows through", () => {
    const drawn = pool.reduce(
      (sum, a, i) => sum + TILE_W * (TILE_W / a) * poses[i].scale ** 2,
      0,
    );
    // At least COVERAGE: closing holes only ever grows a print.
    expect(drawn / (4 * Math.PI * RADIUS ** 2)).toBeGreaterThanOrEqual(COVERAGE - 1e-9);
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
    // An eighth of the radius and a little: the heroes sit a layer above
    // everything they touch, so their tape is never tucked under a neighbour.
    expect(deepest / RADIUS).toBeLessThanOrEqual(0.14);
  });

  it("has a hierarchy of sizes, not one size", () => {
    const scales = poses.map((p) => p.scale);
    expect(Math.max(...scales) / Math.min(...scales)).toBeGreaterThan(1.5);
  });

  it("gives the hero spots to the most colourful prints, round the middle", () => {
    const heroes = poses.flatMap((p, i) => (p.hero ? [i] : []));
    expect(heroes).toHaveLength(HEROES);
    const colour = [...traits.map((t) => t.sat)].sort((a, b) => b - a);
    for (const h of heroes) {
      expect(traits[h].sat).toBeGreaterThanOrEqual(colour[HEROES - 1]);
      // On the face of the ball every third of a turn, not on a pole.
      expect(Math.abs(poses[h].pitch)).toBeLessThanOrEqual(45);
    }
    const yaws = heroes.map((h) => ((poses[h].yaw % 360) + 360) % 360).sort((a, b) => a - b);
    const gaps = yaws.map((y, k) => (k ? y - yaws[k - 1] : y + 360 - yaws.at(-1)!));
    expect(Math.min(...gaps)).toBeGreaterThan(80);
  });

  it("prints pale boards small, so colour carries the ball", () => {
    const pale = poses.filter((_, i) => traits[i].sat < PALE).map((p) => p.scale);
    const vivid = poses.filter((p, i) => traits[i].sat >= PALE && !p.hero).map((p) => p.scale);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(pale)).toBeLessThan(mean(vivid));
  });

  it("is the same collage on every render", () => {
    expect(collagePoses(pool, undefined, traits)).toEqual(poses);
  });

  it("leaves no hole in the ball for the page to show through", () => {
    expect(uncovered(poses, pool)).toBeLessThan(0.005);
  });
});

describe("decal", () => {
  const pool = GALLERY_TILES.map((t) => t.width / t.height);
  const poses = collagePoses(
    pool,
    undefined,
    GALLERY_TILES.map((t) => ({ group: t.slug, sat: t.sat })),
  );
  const px = 1.07;

  // Apply a CSS matrix3d to a point, the way the browser does.
  const apply = (css: string, x: number, y: number) => {
    const m = css.slice(9, -1).split(",").map(Number);
    const w = m[3] * x + m[7] * y + m[15];
    return [0, 1, 2].map((k) => (m[k] * x + m[4 + k] * y + m[12 + k]) / w);
  };

  it("maps a rectangle exactly onto its four corners", () => {
    const q = [[3, 1, -2], [104, 6, -1], [98, 77, -3], [-2, 70, -4]];
    const css = rectToQuad(100, 75, q);
    const at = [apply(css, 0, 0), apply(css, 100, 0), apply(css, 100, 75), apply(css, 0, 75)];
    at.forEach((p, k) => {
      expect(p[0]).toBeCloseTo(q[k][0], 2);
      expect(p[1]).toBeCloseTo(q[k][1], 2);
    });
  });

  it("closes every join: neighbouring patches land on the same points", () => {
    // The whole point of the decal. Folding left patches 7u apart at the
    // corners; mapped, a shared corner is the same point from both sides.
    poses.forEach((pose, i) => {
      const patches = decal(pose, pool[i], px);
      const corner = (p: (typeof patches)[number], u: number, v: number) => {
        const [x, y] = apply(p.curve, u, v);
        return [x + p.x, y + p.y];
      };
      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col + 1 < GRID; col++) {
          const a = patches[row * GRID + col];
          const b = patches[row * GRID + col + 1];
          // The seam's x on the flat print, inside both patches' overlap.
          const seam = b.x + 1;
          const fromA = corner(a, seam - a.x, a.h / 2);
          const fromB = corner(b, seam - b.x, a.h / 2 + a.y - b.y);
          expect(Math.hypot(fromA[0] - fromB[0], fromA[1] - fromB[1])).toBeLessThan(0.75);
        }
      }
    });
  });

  it("lays every corner on the print's own layer of the sphere", () => {
    poses.forEach((pose, i) => {
      const rho = ((RADIUS + pose.lift) * px * pose.layout) / pose.scale;
      const W = TILE_W * pose.layout * px;
      const H = (TILE_W / pool[i]) * pose.layout * px;
      for (const [dx, dy] of [[-W / 2, -H / 2], [W / 2, H / 2], [W / 3, -H / 5]]) {
        const [x, y, z] = sphereAt(dx, dy, rho);
        expect(Math.hypot(x, y, z + rho)).toBeCloseTo(rho, 6);
      }
    });
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
