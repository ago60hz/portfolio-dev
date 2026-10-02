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
 * The sphere: 400u across, about half the Window's height, which is the
 * proportion the reference draws.
 */
export const RADIUS = 200;

/**
 * How much of the sphere the prints cover, summed: over 1, so they overlap.
 *
 * The globe is a COLLAGE, not a tiling. At 0.85 scale the pictures covered
 * barely half the ball and the rest was the white backs of the far side
 * showing through the gaps -- cards on a wireframe. Sized so their areas add
 * up to a third more than the surface, neighbours tuck under each other the
 * way prints do on a pinboard, and the far side is never seen at all.
 */
export const COVERAGE = 1.3;

/**
 * Prints come in three sizes, not a smear of nearly-equal ones: a few heroes,
 * a body, and small prints tucked between. A narrow random spread read as
 * twenty-two prints of the same weight -- a patchwork, with nothing for the
 * eye to land on first. The ratios are relative; COVERAGE sets the absolute.
 */
export const SIZE_TIERS = { hero: 1.32, body: 1, small: 0.76 } as const;

/** Which tier the print at position i takes: every seventh a hero, so the
 *  three of them land far apart on the spiral, and a small one between. */
const tierOf = (i: number) =>
  i % 7 === 0 ? SIZE_TIERS.hero : i % 3 === 2 ? SIZE_TIERS.small : SIZE_TIERS.body;

/** The most a print leans off square, either way. Enough to read as laid by
 *  hand, little enough that the ball still reads as a ball. */
export const ROLL = 4;

/**
 * Units between one layer of the stack and the next.
 *
 * Every print is a polyhedron laid on the ball, and the middles of its flat
 * patches sit up to ~3u off the curve. Two overlapping prints closer
 * together than that cut through each other, which is what drew white wedges
 * across the pictures at 0.8. So overlapping prints never share a layer and
 * layers are 4u apart: enough to clear the patches, little enough that the
 * ball's outline stays a circle rather than a lumpy stack.
 */
export const LIFT = 4;

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
 * small angle -- a polygon that approximates the arc the picture subtends on
 * the sphere. Horizontal only: every print is landscape and the globe turns
 * about Y, so that is the curvature the eye reads, and bending both ways would
 * mean a grid of patches per tile instead of a row.
 *
 * Four is the floor for it to read as a curve. At three the creases showed on
 * the silhouette of every tile crossing the limb; past four the extra planes
 * cost layers and buy nothing anyone can see at this size.
 *
 * And three rows. Bent one way only, a print stood ~14u off the ball along
 * its top and bottom edges once the collage made them big enough to overlap,
 * and those edges cut straight through the neighbour lying over them. Two
 * rows still left ~3u; three -- a flat middle with a row hinged above and
 * below -- brings every patch within ~1.5u, which LIFT clears.
 */
export const STRIPS = 4;
export const ROWS = 3;

export type Placement = { yaw: number; pitch: number };

/** A print's pose on the ball. `bendStep` is per print because the angle a
 *  strip turns depends on how big the print is drawn and how far out it sits. */
export type Pose = Placement & {
  roll: number;
  scale: number;
  lift: number;
  bendStep: number;
  /** The turn at each crease between rows. */
  foldStep: number;
};

/** Deterministic noise in [0, 1): the same collage on every visit, on the
 *  server and the client alike, with no Math.random to hydrate around. */
const noise = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The turn between neighbouring strips that keeps every hinge ON a circle of
 * radius r: the angle a chord of that length subtends. Starting from the
 * tangent point, a chain of equal chords each turned by this lands its
 * vertices exactly on the sphere.
 */
function chordTurn(length: number, r: number) {
  return 2 * Math.asin(Math.min(1, length / (2 * r))) * DEG;
}

/**
 * The turn for the rows above and below a print's flat middle.
 *
 * The middle row is a tangent, so its edges sit just OFF the sphere; the
 * outer row hinged there has to turn a little further than a chord step to
 * bring its far edge back down onto it. Solved by bisection -- the function
 * is monotonic over the range a print can need.
 */
function rowTurn(row: number, r: number) {
  const y0 = row / 2;
  const miss = (turn: number) => {
    const y = y0 + row * Math.cos(turn);
    const z = -row * Math.sin(turn);
    return Math.hypot(y, z + r) - r;
  };
  let lo = 0;
  let hi = Math.PI / 2;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (miss(mid) > 0) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * DEG;
}

/**
 * Lay the prints over the ball as a collage.
 *
 * The Fibonacci spiral still decides WHERE each print goes -- it is what keeps
 * the coverage even -- but nudged a few degrees off its lattice, because a
 * perfectly even spiral reads as a machine's arrangement and a collage is a
 * hand's. Size is solved rather than chosen: one base scale makes the summed
 * areas hit COVERAGE, and each print's tier is applied on top of it.
 *
 * The stack is a colouring. Prints that overlap must sit on different layers
 * (see LIFT), so each one, visited in a shuffled order, takes the lowest layer
 * none of its already-placed neighbours holds. The shuffle is what makes
 * overlaps alternate who is on top, instead of the spiral laying every print
 * over the one before it like roof slates.
 */
export function collagePoses(aspects: number[]): Pose[] {
  const n = aspects.length;
  const heights = aspects.map((a) => TILE_W / Math.max(a, 0.2));
  const size = aspects.map((_, i) => tierOf(i));
  const drawn = heights.reduce((sum, h, i) => sum + TILE_W * h * size[i] ** 2, 0);
  const base = Math.sqrt((COVERAGE * 4 * Math.PI * RADIUS ** 2) / Math.max(drawn, 1));

  const placed = spherePlacements(n).map((place, i) => ({
    yaw: place.yaw + (noise(i, 2) - 0.5) * 12,
    pitch: Math.max(-84, Math.min(84, place.pitch + (noise(i, 3) - 0.5) * 8)),
    roll: (noise(i, 4) - 0.5) * 2 * ROLL,
    scale: base * size[i],
  }));

  const rad = Math.PI / 180;
  const dir = placed.map(({ yaw, pitch }) => [
    Math.cos(pitch * rad) * Math.sin(yaw * rad),
    Math.sin(pitch * rad),
    Math.cos(pitch * rad) * Math.cos(yaw * rad),
  ]);
  // A print's reach on the ball: its half-diagonal as an angle.
  const reach = placed.map(
    (p, i) => (Math.hypot(TILE_W, heights[i]) * p.scale) / 2 / RADIUS,
  );
  const overlaps = (a: number, b: number) =>
    Math.acos(Math.min(1, dir[a].reduce((d, v, k) => d + v * dir[b][k], 0))) <
    reach[a] + reach[b];

  const layer = new Array<number>(n).fill(-1);
  const stride = [7, 5, 3, 1].find((s) => n % s !== 0) ?? 1;
  for (let step = 0; step < n; step++) {
    const i = (step * stride) % n;
    const taken = new Set<number>();
    for (let j = 0; j < n; j++) if (j !== i && layer[j] >= 0 && overlaps(i, j)) taken.add(layer[j]);
    let l = 0;
    while (taken.has(l)) l++;
    layer[i] = l;
  }

  return placed.map((p, i) => {
    const lift = layer[i] * LIFT;
    const r = RADIUS + lift;
    return {
      ...p,
      lift,
      // Solved, not approximated: with the print laid out at its drawn size
      // (see tileTransforms) its sphere is simply r, and these are the turns
      // that put every hinge exactly on it. The width-over-radius estimate
      // was 3u out at the edge of a hero print, which is a crossing.
      bendStep: chordTurn((TILE_W * p.scale) / STRIPS, r),
      foldStep: rowTurn((heights[i] * p.scale) / ROWS, r),
    };
  });
}

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
 *
 * The tile is laid out at its size ON THE BALL and scaled DOWN for the wall,
 * not the other way round. Chrome rasterises a 3D layer at its laid-out size
 * and keeps that raster while the transform animates, so a print laid out at
 * wall size and scaled up 1.4x onto the ball was drawn soft every frame.
 */
export function tileTransforms(pose: Pose, slot: Slot) {
  return {
    globe:
      `translate3d(0px, 0px, 0px) ` +
      `rotateY(${pose.yaw.toFixed(2)}deg) rotateX(${(-pose.pitch).toFixed(2)}deg) ` +
      `translateZ(${u(RADIUS + pose.lift)}) rotateZ(${pose.roll.toFixed(2)}deg) ` +
      `scale(1)`,
    grid:
      `translate3d(calc((${slot.x.toFixed(2)} + var(--wx, 0)) * var(--u)), ` +
      `calc((${slot.y.toFixed(2)} + var(--wy, 0)) * var(--u)), 0px) ` +
      `rotateY(0deg) rotateX(0deg) translateZ(0px) rotateZ(0deg) ` +
      `scale(${(1 / pose.scale).toFixed(4)})`,
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
