/**
 * The globe gallery's geometry.
 *
 * Pure, in scene units, and with no DOM anywhere -- the component hands it
 * aspect ratios and gets transform strings back, which is what lets the layout
 * be tested without a browser and keeps the one continuously-moving part (the
 * spin) down to a single custom property on a single element.
 *
 * Everything here is authored in Figma pixels and emitted as `var(--u)`
 * arithmetic, exactly like the rest of the scene. A CSS transition interpolates
 * `calc()` against `calc()` perfectly well, so the globe scales with the Window
 * for free and the morph never has to be re-measured.
 */

/**
 * Six columns of 150, spaced like an archive rather than a contact sheet.
 *
 * The proportions come from the reference Praise gave (carlos segura's
 * archive): a picture takes about 60% of its column's pitch and about 40% of
 * its row's, so the wall is mostly air and each screen is looked at on its own
 * instead of competing with its neighbours. Hence two gaps, not one -- the
 * vertical is deliberately half again the horizontal.
 *
 * The COUNTS, though, are set by the wrap and not by taste. The spread repeats
 * on its own size, so a tile leaving one edge reappears at the other when it is
 * half a period from the middle, and that has to happen clear of the frame or
 * the lattice visibly shuffles. Clear of it, not merely outside it: at five
 * columns the seam landed 1u beyond the corner of a tile, which is a sliver of
 * picture jumping the width of the wall. Six columns is 1470u against a 1077u
 * Window and leaves 120u of margin on each side, with the column height past
 * the 846u the Window has under its header. `globe.test.ts` asserts both, so
 * thinning the pool fails loudly rather than putting a seam on screen.
 */
export const COLUMNS = 6;
export const TILE_W = 150;
export const GAP_X = 95;
export const GAP_Y = 150;

/**
 * Sphere radius, and how far down a tile is scaled to sit on it.
 *
 * 400u across is about half the Window's height, which is the proportion the
 * reference draws. The scale is set by COVERAGE, not by taste: the reference
 * has sixty-odd pictures to build its ball out of and this has twenty-two, so
 * each one has to be a third of the diameter rather than a sixth for the
 * surface to close up. At 0.7 the sphere read as a RING -- pictures around an
 * empty middle, because the tiles facing away are white cards on a white
 * ground and simply disappear.
 *
 * It also has to go up because the two poses share one element: a tile small
 * enough to leave air on the wall is a speck on the sphere.
 *
 * Scaled rather than sized down so the globe and the spread are one element in
 * two poses, which is what lets a single transform carry the morph.
 */
export const RADIUS = 200;
export const GLOBE_SCALE = 0.85;

/** The golden angle, which is what makes a Fibonacci sphere even. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const DEG = 180 / Math.PI;

/**
 * How a picture bends onto the sphere.
 *
 * A flat card tangent to a ball touches it at one point and stands proud
 * everywhere else, which is what made the globe read as cards pinned to a
 * ball rather than as a ball made of pictures. So each tile is cut into
 * vertical strips, hinged edge to edge, and every hinge turns by the same
 * small angle -- a polygon that approximates the arc a 150u-wide picture
 * subtends on the sphere. Horizontal only: the globe turns about Y, so that is
 * the curvature the eye reads, and bending both ways would mean a grid of
 * patches per tile instead of a row.
 *
 * Four is the floor for it to read as a curve. At three the creases showed on
 * the silhouette of every tile crossing the limb; past four the extra planes
 * cost layers and buy nothing anyone can see at this size. The shading that
 * runs continuously across the strips is what hides the facets that remain.
 *
 * The angle is measured in the tile's OWN space, where the sphere's radius is
 * RADIUS / GLOBE_SCALE -- the tile is scaled after it is pushed out, so its
 * strips see a bigger ball than the layer does.
 */
export const STRIPS = 4;
export const BEND_STEP = ((TILE_W / (RADIUS / GLOBE_SCALE)) * DEG) / STRIPS;

export type Placement = { yaw: number; pitch: number };

/**
 * `n` points spread evenly over a sphere.
 *
 * A latitude/longitude grid was tried first and is wrong for this: it crowds
 * the poles and leaves visible seams down the meridians, so the globe reads as
 * a wireframe someone pinned pictures to. The Fibonacci spiral has no seam and
 * no pole cluster, which is what makes a few dozen tiles read as a solid ball.
 */
export function spherePlacements(n: number): Placement[] {
  return Array.from({ length: n }, (_, i) => ({
    yaw: i * GOLDEN * DEG,
    // Sampling y uniformly rather than the angle is what keeps the spacing
    // even: equal bands of y are equal AREAS on a sphere.
    pitch: Math.asin(1 - (2 * i + 1) / n) * DEG,
  }));
}

export type Slot = { x: number; y: number; w: number; h: number };
export type Spread = { slots: Slot[]; periodX: number; periodY: number };

/**
 * Masonry columns, centred on the origin, every column the same total height.
 *
 * Columns rather than rows because these are case-study stills and their aspect
 * ratios run from 3:1 banners to portrait phone screens; a fixed row height
 * would letterbox half of them. The shortest column always takes the next tile,
 * so no column runs away with the tall ones.
 *
 * THE COLUMNS ARE THEN EVENED UP, and that part is not cosmetic. The wall
 * repeats on ONE vertical period, so a column shorter than that period carries
 * the difference as a void -- and with twenty-two pictures over six columns the
 * difference is a whole picture, which is exactly the hole that appeared in the
 * middle of the wall. Each column's spare height is divided back into its own
 * gaps instead, so every column measures the period exactly and the lattice is
 * seamless in both directions. Columns holding fewer pictures simply breathe
 * more, which is what the reference does anyway.
 */
export function layoutSpread(aspects: number[], columns = COLUMNS): Spread {
  const step = TILE_W + GAP_X;
  const lanes: { h: number }[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);

  const placed = aspects.map((aspect) => {
    const column = heights.indexOf(Math.min(...heights));
    const h = TILE_W / Math.max(aspect, 0.2);
    heights[column] += h + GAP_Y;
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

  // A slot is an offset from the middle of the layer, not a top-left: the tiles
  // are absolutely positioned at its centre so the sphere and the wall share
  // one origin.
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

const u = (n: number) => `calc(${n.toFixed(2)} * var(--u))`;

/**
 * A tile's two resting transforms.
 *
 * Both strings carry the SAME function list in the same order, and that is the
 * whole trick. CSS interpolates two transforms component by component only when
 * their lists match; mismatched lists fall back to decomposing a matrix, which
 * sends every tile along a straight line and loses the unwind. Matching them
 * means the sphere's rotation eases out while the position eases in, which is
 * the implosion the reference video draws.
 *
 * `--wx`/`--wy` are the infinite pan's wrap counts, in scene units and zero
 * until a tile has actually left the frame, so nothing outside the drag handler
 * has to know they exist.
 */
export function tileTransforms(placement: Placement, slot: Slot) {
  return {
    globe:
      `translate3d(0px, 0px, 0px) ` +
      `rotateY(${placement.yaw.toFixed(2)}deg) rotateX(${(-placement.pitch).toFixed(2)}deg) ` +
      `translateZ(${u(RADIUS)}) scale(${GLOBE_SCALE})`,
    grid:
      `translate3d(calc((${slot.x.toFixed(2)} + var(--wx, 0)) * var(--u)), ` +
      `calc((${slot.y.toFixed(2)} + var(--wy, 0)) * var(--u)), 0px) ` +
      `rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)`,
  };
}

/**
 * How far to shift a tile so it stays in the frame the pan is looking at.
 *
 * The infinite spread is one set of tiles, not nine: a tile that leaves one
 * edge is moved a whole period to the other rather than duplicated, so panning
 * costs the same at any distance and the DOM never grows. Returned in scene
 * units, and always a whole number of periods, so the tile lands exactly where
 * its neighbour would have been and the lattice never shears.
 */
export function wrapOffset(base: number, pan: number, period: number) {
  if (period <= 0) return 0;
  const steps = Math.round((base + pan) / period);
  // Guarded rather than written as one expression: `-0 * period` is -0, which
  // stringifies to "-0" and reads back as a different value from the zero the
  // tile is already sitting at, so every tile in frame would take a style
  // write on the first frame of every drag.
  return steps === 0 ? 0 : -steps * period;
}
