/**
 * The infinite gallery's geometry.
 *
 * Pure, in scene units, and with no DOM anywhere -- the component hands it
 * aspect ratios and gets slots back, which is what lets the layout be tested
 * without a browser. Everything is authored in Figma pixels and emitted as
 * `var(--u)` arithmetic, like the rest of the scene, so the wall scales with
 * the Window for free.
 */

/**
 * Four columns of 360, about a third of the Window each.
 *
 * Big enough to read: a print is a case-study screen, and the copy, the
 * numbers and the states on it are the point. At 150 and then 210 the detail
 * was too small to make out. The gaps are a third of a print across and a
 * little more down -- room for each picture to be looked at on its own,
 * without the wall turning into mostly air.
 *
 * The COUNTS are set by the wrap, not by taste. The wall repeats on its own
 * size, so a print leaving one edge reappears at the other when it is half a
 * period from the middle, and that has to happen clear of the frame or the
 * lattice visibly shuffles. Four columns is 1920u against a 1077u Window --
 * the seam sits 960u out, past the Window's edge by more than half a print --
 * with the column height well past the 846u the Window has under its header.
 * Four because the boards, shown whole, come in only two or three shapes, and
 * twenty-two of them even up across four columns to within a tenth (see
 * layoutSpread); at five and six, some columns were a print short and showed
 * it as gaps up to half as wide again as the rest.
 * `infinite.test.ts` asserts both, so thinning the pool fails loudly rather
 * than putting a seam on screen.
 */
export const COLUMNS = 4;
export const TILE_W = 360;
export const GAP_X = 120;
export const GAP_Y = 150;

export type Slot = { x: number; y: number; w: number; h: number };
export type Spread = { slots: Slot[]; periodX: number; periodY: number };

/**
 * Masonry columns, centred on the origin, every column the same total height.
 *
 * Columns rather than rows because these are case-study stills and their aspect
 * ratios run from 3:1 banners to near-square phone screens; a fixed row height
 * would letterbox half of them. The shortest column takes the next tile, so no
 * column runs away with the tall ones, and then the columns are evened up.
 *
 * THE COLUMNS ARE THEN EVENED UP, and that part is not cosmetic. The wall
 * repeats on ONE vertical period, so a column shorter than that period carries
 * the difference as a void -- and with twenty-two pictures over six columns the
 * difference can be a whole picture, which is exactly the hole that appeared in
 * the middle of the wall. Each column's spare height is divided back into its own
 * gaps instead, so every column measures the period exactly and the lattice is
 * seamless in both directions.
 */
export function layoutSpread(aspects: number[], columns = COLUMNS): Spread {
  const step = TILE_W + GAP_X;
  const tall = aspects.map((aspect) => TILE_W / Math.max(aspect, 0.2));

  // Shortest column first...
  const columnOf: number[] = [];
  const heights = new Array<number>(columns).fill(0);
  tall.forEach((h, i) => {
    const column = heights.indexOf(Math.min(...heights));
    columnOf[i] = column;
    heights[column] += h + GAP_Y;
  });

  // ...then even the columns up by swapping prints between them. Every column
  // is stretched to the tallest, and a short one carries the difference in its
  // gaps -- at shortest-first alone that left some gaps twice the others, and
  // the wall read as unevenly spaced. Swapping while it lowers the spread of
  // the column heights closes most of that. Deterministic: the same pool
  // always lays out the same way.
  const spread = () => {
    const mean = heights.reduce((a, b) => a + b, 0) / columns;
    return heights.reduce((a, b) => a + (b - mean) ** 2, 0);
  };
  for (let pass = 0, improved = true; improved && pass < 50; pass++) {
    improved = false;
    for (let a = 0; a < tall.length; a++) {
      for (let b = a + 1; b < tall.length; b++) {
        const [ca, cb] = [columnOf[a], columnOf[b]];
        if (ca === cb) continue;
        const before = spread();
        const d = tall[b] - tall[a];
        heights[ca] += d;
        heights[cb] -= d;
        if (spread() < before - 1e-6) {
          [columnOf[a], columnOf[b]] = [cb, ca];
          improved = true;
        } else {
          heights[ca] -= d;
          heights[cb] += d;
        }
      }
    }
  }

  const lanes: { h: number }[][] = Array.from({ length: columns }, () => []);
  const placed = tall.map((h, i) => {
    const column = columnOf[i];
    lanes[column].push({ h });
    return { column, index: lanes[column].length - 1, w: TILE_W, h };
  });

  const periodX = columns * step;
  // The tallest column sets the period; every other one is stretched to match.
  const periodY = Math.max(0, ...heights);

  // Each column's own gap, and the running top of each of its tiles.
  const tops = lanes.map((lane) => {
    const content = lane.reduce((sum, t) => sum + t.h, 0);
    const gap = lane.length ? (periodY - content) / lane.length : GAP_Y;
    let y = 0;
    return lane.map((t) => {
      const top = y;
      y += t.h + gap;
      return top;
    });
  });

  // A slot is an offset from the middle of the layer, not a top-left: the
  // tiles are absolutely positioned at its centre.
  return {
    periodX,
    periodY,
    slots: placed.map(({ column, index, w, h }) => ({
      x: column * step - (periodX - GAP_X) / 2 + w / 2,
      y: tops[column][index] - periodY / 2 + h / 2,
      w,
      h,
    })),
  };
}

/**
 * How far to shift a tile so it stays in the frame the scroll is looking at.
 *
 * The infinite wall is one set of tiles, not nine: a tile that leaves one
 * edge is moved a whole period to the other rather than duplicated, so
 * scrolling costs the same at any distance and the DOM never grows. Returned in
 * scene units, and always a whole number of periods, so the tile lands exactly
 * where its neighbour would have been and the lattice never shears.
 */
export function wrapOffset(base: number, pan: number, period: number) {
  if (period <= 0) return 0;
  const steps = Math.round((base + pan) / period);
  // Guarded rather than written as one expression: `-0 * period` is -0, which
  // stringifies to "-0" and reads back as a different value from the zero the
  // tile is already sitting at, so every tile in frame would take a style
  // write on the first frame of every scroll.
  return steps === 0 ? 0 : -steps * period;
}
