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
 * Six columns of 210, spaced like an archive rather than a contact sheet.
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
 * picture jumping the width of the wall. Six columns is 2058u against a 1077u
 * Window and leaves the seam far off either side, with the column height past
 * the 846u the Window has under its header. `globe.test.ts` asserts both, so
 * thinning the pool fails loudly rather than putting a seam on screen.
 *
 * 210, not the 150 it started at: at 150 a screen's detail -- the copy, the
 * numbers, the states -- was too small to read, and reading it is what the
 * wall is for. The gaps scaled with it, so the air between prints is the same
 * proportion the reference draws.
 */
export const COLUMNS = 6;
export const TILE_W = 210;
export const GAP_X = 133;
export const GAP_Y = 210;

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
 * up to over a third more than the surface, neighbours tuck under each other the
 * way prints do on a pinboard, and the far side is never seen at all. This
 * is the starting size; `closeHoles` then grows the prints that border a gap.
 */
export const COVERAGE = 1.3;

/**
 * Prints come in three sizes, not a smear of nearly-equal ones: a few heroes,
 * a body, and small prints tucked between. A narrow random spread read as
 * twenty-two prints of the same weight -- a patchwork, with nothing for the
 * eye to land on first. The ratios are relative; COVERAGE sets the absolute.
 */
export const SIZE_TIERS = { hero: 1.25, body: 1, small: 0.86 } as const;

/** Below this much colour a print is pale: mostly white UI on a white
 *  canvas. Pale prints take the small tier and are kept apart. */
export const PALE = 0.12;

/** Below this sharpness a print is soft, and is never drawn large. */
export const SOFT = 400;

/** How many heroes the collage is built around. */
export const HEROES = 3;

/** What the layout knows about a picture beyond its shape. */
export type Trait = {
  /** Prints from the same study look alike, so they are kept apart. */
  group: string;
  /** Mean saturation, 0-1: who gets the hero spots, and who is pale. */
  sat: number;
  /** Laplacian variance: a soft print never takes a large tier. */
  crisp?: number;
};

/** Pale or soft: either way, a print the collage should not lean on. */
const quiet = (t: Trait) => t.sat < PALE || (t.crisp ?? Infinity) < SOFT;

/** What a print earns a hero spot with: colour, but only if it is sharp. */
const heroScore = (t: Trait) => t.sat * Math.min(1, (t.crisp ?? 600) / 600);

/** The most a print leans off square, either way. Enough to read as laid by
 *  hand, little enough that the ball still reads as a ball. */
export const ROLL = 4;

/**
 * Units between one layer of the stack and the next.
 *
 * Every print is a polyhedron laid on the ball, and the middles of its flat
 * patches dip up to ~4u inside the curve. Two overlapping prints closer
 * together than that cut through each other, which is what drew white wedges
 * across the pictures at 0.8. So overlapping prints never share a layer and
 * layers are 4u apart: enough to clear the patches, little enough that the
 * ball's outline stays a circle rather than a lumpy stack.
 */
export const LIFT = 4;

/**
 * Which deal of the collage to use.
 *
 * The jitter that takes the prints off the spiral's lattice is deterministic
 * noise, and some deals of it leave a hole where three prints happen to pull
 * apart -- one showed the page through the equator at the same spot in every
 * capture. `closeHoles` repairs most of that, and the deal is still chosen
 * rather than taken: of the first two hundred, this one closes up best
 * (0.3% bare) with the shallowest stack. `uncovered`'s test holds it there.
 */
export const DEAL = 131;

/** The golden angle, which is what makes a Fibonacci sphere even. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const DEG = 180 / Math.PI;

/**
 * How a picture wraps the sphere: as a decal, cut into a GRID x GRID patchwork.
 *
 * A flat sheet cannot cover a ball without stretching -- the surfaces have
 * different curvature, and no folding fixes that. The first attempts folded
 * the print along hinges, strips one way and rows the other, and away from
 * the centre the two sets of folds disagreed: neighbouring patches overlapped
 * by up to 7u and the picture showed twice across every crease.
 *
 * So the print is mapped instead. Every point of it goes to the sphere by the
 * exponential map from its centre -- straight-line distance on the paper
 * becomes the same distance over the ball -- and each patch is stretched by
 * its own projective transform onto the exact four points its corners land on.
 * Neighbours share those points exactly, so the surface is closed and the
 * picture continuous across every join; the only stretch is the decal's own,
 * a few percent at the corners of the largest prints.
 *
 * Five by five. Each patch is flat, so its middle dips inside the sphere by its
 * sagitta, which LIFT has to clear: at four a side that was ~6.5u on a hero
 * and pushed the stack past an eighth of the radius; at five it is ~4u. More
 * patches would let the stack get shallower still, at a plane each.
 */
export const GRID = 5;

export type Placement = { yaw: number; pitch: number };

/** A print's pose on the ball. */
export type Pose = Placement & {
  roll: number;
  scale: number;
  lift: number;
  /** A hero print: taped to the ball, the way the best of a pinboard is. */
  hero: boolean;
  /**
   * The size the print is laid out at, as a multiple of its wall size: the
   * larger of its two sizes, so it is only ever scaled DOWN. Chrome rasterises
   * a 3D layer at its laid-out size, and a print scaled up from it is soft.
   */
  layout: number;
};

/** Deterministic noise in [0, 1): the same collage on every visit, on the
 *  server and the client alike, with no Math.random to hydrate around. */
const noise = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

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
export function collagePoses(
  aspects: number[],
  deal = DEAL,
  traits: Trait[] = aspects.map(() => ({ group: "", sat: 0.5 })),
): Pose[] {
  const n = aspects.length;
  // The spiral's ends stay where the spiral puts them, half a band off the
  // poles. Pinned square on the poles they closed each cap as one surface,
  // but opened a ring of gaps round it that cost more than the shards did.
  const spiral = spherePlacements(n);
  const unit = spiral.map(({ yaw, pitch }) => toUnit(yaw, pitch));

  const slots = assignSlots(unit, spiral, traits);
  // slots[s] is the picture at spiral position s; everything below works in
  // spiral order and is handed back in picture order at the end.
  const heights = slots.map((img) => TILE_W / Math.max(aspects[img], 0.2));
  const heroSlots = new Set(heroSpots(spiral));
  const size = slots.map((img, s) =>
    heroSlots.has(s)
      ? SIZE_TIERS.hero
      : quiet(traits[img])
        ? SIZE_TIERS.small
        : SIZE_TIERS.body,
  );
  const drawn = heights.reduce((sum, h, i) => sum + TILE_W * h * size[i] ** 2, 0);
  const base = Math.sqrt((COVERAGE * 4 * Math.PI * RADIUS ** 2) / Math.max(drawn, 1));

  const salt = (k: number) => k + deal * 10;
  const placed = spiral.map((place, i) => ({
    hero: heroSlots.has(i),
    yaw: place.yaw + (noise(i, salt(2)) - 0.5) * 12,
    pitch: Math.max(-84, Math.min(84, place.pitch + (noise(i, salt(3)) - 0.5) * 8)),
    roll: (noise(i, salt(4)) - 0.5) * 2 * ROLL,
    scale: base * size[i],
  }));

  closeHoles(placed, heights);

  const dir = placed.map(({ yaw, pitch }) => toUnit(yaw, pitch));
  // A print's reach on the ball: its half-diagonal as an angle.
  const reach = placed.map(
    (p, i) => (Math.hypot(TILE_W, heights[i]) * p.scale) / 2 / RADIUS,
  );
  const overlaps = (a: number, b: number) =>
    Math.acos(Math.min(1, dir[a].reduce((d, v, k) => d + v * dir[b][k], 0))) <
    reach[a] + reach[b];

  const layer = new Array<number>(n).fill(-1);
  const stride = [7, 5, 3, 1].find((st) => n % st !== 0) ?? 1;
  for (let step = 0; step < n; step++) {
    const i = (step * stride) % n;
    const taken = new Set<number>();
    for (let j = 0; j < n; j++) if (j !== i && layer[j] >= 0 && overlaps(i, j)) taken.add(layer[j]);
    let l = 0;
    while (taken.has(l)) l++;
    layer[i] = l;
  }
  // A hero lies over everything it touches: its tape runs half off its edge,
  // onto the neighbours, and tape tucked UNDER a neighbour is not tape.
  for (const h of heroSlots) {
    let top = -1;
    for (let j = 0; j < n; j++) if (j !== h && overlaps(h, j)) top = Math.max(top, layer[j]);
    layer[h] = Math.max(layer[h], top + 1);
  }

  const out = new Array<Pose>(n);
  placed.forEach((p, s) => {
    out[slots[s]] = { ...p, layout: Math.max(p.scale, 1), lift: layer[s] * LIFT };
  });
  return out;
}

const toUnit = (yaw: number, pitch: number) => {
  const rad = Math.PI / 180;
  return [
    Math.cos(pitch * rad) * Math.sin(yaw * rad),
    Math.sin(pitch * rad),
    Math.cos(pitch * rad) * Math.cos(yaw * rad),
  ];
};

/**
 * The hero spots: HEROES positions in the middle latitudes, as far apart in
 * longitude as the spiral allows.
 *
 * Every-seventh-print put two of the three on the poles, where nobody sees
 * them and their tape faced the ceiling. Within 35 degrees of the equator a
 * hero is on the face of the ball every third of a turn.
 */
function heroSpots(spiral: Placement[]) {
  const band = spiral.flatMap((p, i) => (Math.abs(p.pitch) <= 35 ? [i] : []));
  const apart = (a: number, b: number) => {
    const d = Math.abs(((spiral[a].yaw - spiral[b].yaw) % 360) + 360) % 360;
    return Math.min(d, 360 - d);
  };
  let best: number[] = band.slice(0, HEROES);
  let bestGap = -1;
  const pick = (from: number, chosen: number[]) => {
    if (chosen.length === HEROES) {
      let gap = Infinity;
      for (let a = 0; a < chosen.length; a++)
        for (let b = a + 1; b < chosen.length; b++) gap = Math.min(gap, apart(chosen[a], chosen[b]));
      if (gap > bestGap) [best, bestGap] = [chosen, gap];
      return;
    }
    for (let k = from; k < band.length; k++) pick(k + 1, [...chosen, band[k]]);
  };
  pick(0, []);
  return best;
}

/**
 * Which picture goes on which spiral position.
 *
 * The heroes are the sharpest pictures with the most colour. Everything else
 * is placed to keep alike prints apart: a pair from the same study, or two
 * quiet ones (pale or soft), costs more the closer they sit -- the quiet pair
 * most, because a patch of them reads as a pale hemisphere. Pairwise swaps until no swap helps
 * -- a local optimum, which at twenty-two prints is a good one, and
 * deterministic.
 */
function assignSlots(unit: number[][], spiral: Placement[], traits: Trait[]) {
  const n = unit.length;
  const heroSlots = heroSpots(spiral);
  const byColour = traits.map((_, i) => i).sort((a, b) => heroScore(traits[b]) - heroScore(traits[a]));
  const heroes = byColour.slice(0, heroSlots.length);
  const rest = traits.map((_, i) => i).filter((i) => !heroes.includes(i));
  const slots = new Array<number>(n);
  heroSlots.forEach((s, k) => (slots[s] = heroes[k]));
  let r = 0;
  for (let s = 0; s < n; s++) if (slots[s] === undefined) slots[s] = rest[r++];

  const near = Math.cos(55 * (Math.PI / 180));
  const close = unit.map((u) =>
    unit.map((v) => Math.max(0, u[0] * v[0] + u[1] * v[1] + u[2] * v[2] - near)),
  );
  const alike = (x: number, y: number) =>
    (traits[x].group && traits[x].group === traits[y].group ? 1 : 0) +
    (quiet(traits[x]) && quiet(traits[y]) ? 3 : 0);
  // What swapping the pictures at a and b changes, against everyone else --
  // a and b's own pairing is the same either way round.
  const delta = (a: number, b: number) => {
    let d = 0;
    for (let k = 0; k < n; k++) {
      if (k === a || k === b) continue;
      const [pa, pb, pk] = [slots[a], slots[b], slots[k]];
      d += (alike(pb, pk) - alike(pa, pk)) * close[a][k];
      d += (alike(pa, pk) - alike(pb, pk)) * close[b][k];
    }
    return d;
  };
  const free = [...Array(n).keys()].filter((s) => !heroSlots.includes(s));
  for (let pass = 0; pass < 20; pass++) {
    let improved = false;
    for (const a of free) {
      for (const b of free) {
        if (b <= a || delta(a, b) >= -1e-9) continue;
        [slots[a], slots[b]] = [slots[b], slots[a]];
        improved = true;
      }
    }
    if (!improved) break;
  }
  return slots;
}

/** Settle for this little of the ball showing through: one sample in 300. */
const HOLE_TOLERANCE = 0.003;

/**
 * Close the holes the spiral leaves.
 *
 * A Fibonacci spiral spaces CENTRES evenly, but these are rectangles, and
 * rectangles on a ball leave gaps where three corners pull apart -- 6 to 8%
 * of the surface whatever the jitter. So the collage settles itself, the way
 * a hand would: find the bare spots, and for each one nudge the nearest print
 * a little toward it and let it grow a little. Repeated until the ball is
 * closed. Deterministic, and it runs once.
 */
function closeHoles(
  placed: { yaw: number; pitch: number; roll: number; scale: number }[],
  heights: number[],
) {
  const rad = Math.PI / 180;
  const aspects = heights.map((h) => TILE_W / h);
  const toVec = (yaw: number, pitch: number) => [
    Math.cos(pitch * rad) * Math.sin(yaw * rad),
    Math.sin(pitch * rad),
    Math.cos(pitch * rad) * Math.cos(yaw * rad),
  ];
  // Growth is capped, so filling a hole never turns a body print into a
  // poster: past this the bend gets steep, the picture soft, and the stack
  // deep. The rest of the work is done by moving.
  const cap = placed.map((p) => p.scale * 1.25);
  for (let round = 0; round < 120; round++) {
    const holes = bareSpots(placed as Pose[], aspects, 1500);
    if (holes.length / 1500 < HOLE_TOLERANCE) return;
    const centres = placed.map((p) => toVec(p.yaw, p.pitch));
    const pull = placed.map(() => ({ v: [0, 0, 0], n: 0 }));
    for (const pt of holes) {
      let best = 0;
      let bestDot = -2;
      centres.forEach((c, i) => {
        const d = c[0] * pt[0] + c[1] * pt[1] + c[2] * pt[2];
        if (d > bestDot) [best, bestDot] = [i, d];
      });
      pull[best].n++;
      pull[best].v = pull[best].v.map((v, k) => v + pt[k]);
    }
    pull.forEach(({ v, n }, i) => {
      if (!n) return;
      const c = centres[i];
      const m = v.map((x) => x / n);
      const moved = c.map((x, k) => x + (m[k] - x) * 0.3);
      const len = Math.hypot(moved[0], moved[1], moved[2]);
      const [x, y, z] = moved.map((v2) => v2 / len);
      placed[i].pitch = Math.max(-84, Math.min(84, Math.asin(y) / rad));
      placed[i].yaw = Math.atan2(x, z) / rad;
      placed[i].scale = Math.min(cap[i], placed[i].scale * (1 + 0.012 * Math.min(n, 6)));
    });
  }
}

/**
 * The share of the ball no print covers, measured rather than guessed.
 *
 * Samples the sphere evenly and asks of each point whether it falls inside
 * any print: projected into that print's own frame -- its yaw, pitch and roll,
 * the same rotations the CSS applies -- and compared, as arc lengths, against
 * its drawn width and height. Ignores lift; the layers are a few units apart
 * on a 200u ball and change nothing about where the holes are.
 */
export function uncovered(poses: Pose[], aspects: number[], samples = 3000) {
  return bareSpots(poses, aspects, samples).length / samples;
}

/** The sphere's sample points, built once per count: the settle loop asks for
 *  the same 1500 on every round. */
const sampleCache = new Map<number, number[][]>();
function samplesOf(count: number) {
  let pts = sampleCache.get(count);
  if (!pts) {
    pts = spherePlacements(count).map(({ yaw, pitch }) => toUnit(yaw, pitch));
    sampleCache.set(count, pts);
  }
  return pts;
}

/** The sample points no print covers, as unit vectors. */
function bareSpots(
  poses: Pick<Pose, "yaw" | "pitch" | "roll" | "scale">[],
  aspects: number[],
  samples: number,
) {
  const rad = Math.PI / 180;
  const frames = poses.map((p, i) => {
    const [y, x, r] = [p.yaw * rad, p.pitch * rad, p.roll * rad];
    // CSS axes, y down: rotateY(yaw) rotateX(-pitch), then rotateZ(roll).
    const X = [Math.cos(y), 0, -Math.sin(y)];
    const Y = [-Math.sin(x) * Math.sin(y), Math.cos(x), -Math.sin(x) * Math.cos(y)];
    const C = [Math.cos(x) * Math.sin(y), Math.sin(x), Math.cos(x) * Math.cos(y)];
    const ex = X.map((v, k) => v * Math.cos(r) + Y[k] * Math.sin(r));
    const ey = X.map((v, k) => -v * Math.sin(r) + Y[k] * Math.cos(r));
    return {
      ex,
      ey,
      c: C,
      w: (TILE_W * p.scale) / 2 / RADIUS,
      h: ((TILE_W / Math.max(aspects[i], 0.2)) * p.scale) / 2 / RADIUS,
    };
  });
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // |atan(x / depth)| <= w is |x| <= tan(w) * depth for depth > 0, so the
  // tangents are taken once per print instead of twice per sample.
  const bounds = frames.map((f) => ({ ...f, tw: Math.tan(f.w), th: Math.tan(f.h) }));
  const bare: number[][] = [];
  for (const pt of samplesOf(samples)) {
    const hit = bounds.some(({ ex, ey, c, tw, th }) => {
      const depth = dot(pt, c);
      return (
        depth > 0 &&
        Math.abs(dot(pt, ex)) <= tw * depth &&
        Math.abs(dot(pt, ey)) <= th * depth
      );
    });
    if (!hit) bare.push(pt);
  }
  return bare;
}

/** One patch of a print's decal, in the tile's own pixels. */
export type Patch = {
  /** Where the patch sits on the flat print, and how big it is. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The projective transform that lays it onto the sphere, as CSS. */
  curve: string;
  /** Which of the print's outer edges this patch carries, for the keyline. */
  edges: { t: boolean; b: boolean; l: boolean; r: boolean };
};

/** How far each patch runs under its neighbours, in px. Two patches that
 *  merely meet antialias their shared edge and the page shows through as a
 *  hairline; overlapped, they map the SAME picture to the SAME place, so
 *  the overlap is invisible -- which folding could never promise. */
const OVERLAP = 1;

/**
 * A print's patches, in pixels at the current scene unit.
 *
 * The tile is laid out at `layout` times its wall size and scaled by
 * `scale / layout` onto the ball, so in its own space the sphere's radius is
 * the ball's radius times `layout / scale`. Pixels rather than --u because a
 * matrix takes numbers, and --u is a clamp() of a container unit that CSS
 * cannot hand back as one.
 */
export function decal(pose: Pose, aspect: number, px: number): Patch[] {
  const W = TILE_W * pose.layout * px;
  const H = (TILE_W / Math.max(aspect, 0.2)) * pose.layout * px;
  const rho = ((RADIUS + pose.lift) * px * pose.layout) / pose.scale;
  const onBall = (x: number, y: number) => sphereAt(x - W / 2, y - H / 2, rho, W / 2, H / 2);

  const patches: Patch[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x0 = (col * W) / GRID - (col > 0 ? OVERLAP : 0);
      const x1 = ((col + 1) * W) / GRID + (col < GRID - 1 ? OVERLAP : 0);
      const y0 = (row * H) / GRID - (row > 0 ? OVERLAP : 0);
      const y1 = ((row + 1) * H) / GRID + (row < GRID - 1 ? OVERLAP : 0);
      const corners = [onBall(x0, y0), onBall(x1, y0), onBall(x1, y1), onBall(x0, y1)].map(
        ([X, Y, Z]) => [X - x0, Y - y0, Z],
      );
      patches.push({
        x: x0,
        y: y0,
        w: x1 - x0,
        h: y1 - y0,
        curve: rectToQuad(x1 - x0, y1 - y0, corners),
        edges: { t: row === 0, b: row === GRID - 1, l: col === 0, r: col === GRID - 1 },
      });
    }
  }
  return patches;
}

/** A strip of tape on a hero print. */
export type Tape = Patch & {
  /** Its pose on the flat wall: the same lean, lying on the paper. */
  flat: string;
  tone: "lime" | "purple";
};

/**
 * The strip of tape across a hero print's top edge.
 *
 * Its own small decal: a rectangle centred ON the edge, half on the print and
 * half off it, leaning a few degrees -- the way tape actually gets put down --
 * and wrapped onto the ball through the same map as the print, a hair further
 * out so it lies over it. Lime or purple, alternating, so a print whose own
 * colours are lime still shows its tape.
 */
export function tapeFor(pose: Pose, aspect: number, px: number, nth: number): Tape {
  const W = TILE_W * pose.layout * px;
  const H = (TILE_W / Math.max(aspect, 0.2)) * pose.layout * px;
  const rho = ((RADIUS + pose.lift) * px * pose.layout) / pose.scale;
  const w = W * 0.3;
  const h = w * 0.24;
  const x = W / 2 - w / 2;
  const y = -h / 2;
  const lean = ((nth % 2 ? 1 : -1) * 7 * Math.PI) / 180;
  const [c, s] = [Math.cos(lean), Math.sin(lean)];
  // A local corner, leaned about the tape's centre, in tile coordinates.
  const at = (u: number, v: number) => {
    const [du, dv] = [u - w / 2, v - h / 2];
    return [x + w / 2 + du * c - dv * s, y + h / 2 + du * s + dv * c];
  };
  // Above the print by more than the tape's own sag: it is one flat piece,
  // so its middle dips inside the sphere by its sagitta, and lifted only a
  // hair the print came up through it as a dark bar.
  const above = Math.hypot(w, h) ** 2 / (8 * rho) + 1.5 * px;
  const onBall = (u: number, v: number) => {
    const [tx, ty] = at(u, v);
    const [X, Y, Z] = sphereAt(tx - W / 2, ty - H / 2, rho, W / 2, H / 2);
    // Out along the sphere's normal at that point, so the tape lies ON the
    // print rather than in it.
    const n = [(X - W / 2) / rho, (Y - H / 2) / rho, (Z + rho) / rho];
    return [X + n[0] * above - x, Y + n[1] * above - y, Z + n[2] * above];
  };
  const flatAt = (u: number, v: number) => {
    const [tx, ty] = at(u, v);
    return [tx - x, ty - y, above];
  };
  const corners = (f: (u: number, v: number) => number[]) => [f(0, 0), f(w, 0), f(w, h), f(0, h)];
  return {
    x,
    y,
    w,
    h,
    curve: rectToQuad(w, h, corners(onBall)),
    flat: rectToQuad(w, h, corners(flatAt)),
    edges: { t: true, b: true, l: false, r: false },
    tone: nth % 2 ? "purple" : "lime",
  };
}

/**
 * The exponential map: a point `(dx, dy)` from the print's centre goes the
 * same distance over the ball, in the same direction. Returned in the tile's
 * coordinates -- `(cx, cy)` is the centre -- with z out of the screen.
 */
export function sphereAt(dx: number, dy: number, rho: number, cx = 0, cy = 0) {
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return [cx, cy, 0];
  const k = (Math.sin(d / rho) * rho) / d;
  return [cx + dx * k, cy + dy * k, rho * (Math.cos(d / rho) - 1)];
}

/**
 * The CSS `matrix3d` that takes a w x h rectangle onto four points.
 *
 * x and y are an exact square-to-quad homography (Heckbert's closed form), so
 * the corners land on the points to the pixel and the edges between them are
 * straight -- which is what lets two patches share an edge with no seam. z is
 * fitted to the four points by least squares: they lie on a sphere, so they
 * are not quite coplanar, and the fit misses by a fraction of a pixel in depth
 * only, where nobody can see it.
 */
export function rectToQuad(w: number, h: number, q: number[][]) {
  const [[x0, y0, z0], [x1, y1, z1], [x2, y2, z2], [x3, y3, z3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dy1 * dx2;
  const g = (dx3 * dy2 - dy3 * dx2) / den;
  const hh = (dx1 * dy3 - dy1 * dx3) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  // z * w at each corner, then the least-squares plane over the unit square.
  const zw = [z0, z1 * (1 + g), z2 * (1 + g + hh), z3 * (1 + hh)];
  const zi = (zw[1] + zw[2] - zw[0] - zw[3]) / 2;
  const zj = (zw[3] + zw[2] - zw[0] - zw[1]) / 2;
  const zk = (3 * zw[0] + zw[1] - zw[2] + zw[3]) / 4;
  const m = [
    a / w, d / w, zi / w, g / w,
    b / h, e / h, zj / h, hh / h,
    0, 0, 1, 0,
    x0, y0, zk, 1,
  ];
  return `matrix3d(${m.map((v) => +v.toFixed(6)).join(",")})`;
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
 * The tile is laid out at the LARGER of its two sizes and scaled down to the
 * other. Chrome rasterises a 3D layer at its laid-out size and keeps that
 * raster while the transform animates, so a print laid out at wall size and
 * scaled up 1.4x onto the ball was drawn soft every frame -- and the same goes
 * the other way for a small print on a wall that is now larger than it.
 */
export function tileTransforms(pose: Pose, slot: Slot) {
  return {
    globe:
      `translate3d(0px, 0px, 0px) ` +
      `rotateY(${pose.yaw.toFixed(2)}deg) rotateX(${(-pose.pitch).toFixed(2)}deg) ` +
      `translateZ(${u(RADIUS + pose.lift)}) rotateZ(${pose.roll.toFixed(2)}deg) ` +
      `scale(${(pose.scale / pose.layout).toFixed(4)})`,
    grid:
      `translate3d(calc((${slot.x.toFixed(2)} + var(--wx, 0)) * var(--u)), ` +
      `calc((${slot.y.toFixed(2)} + var(--wy, 0)) * var(--u)), 0px) ` +
      `rotateY(0deg) rotateX(0deg) translateZ(0px) rotateZ(0deg) ` +
      `scale(${(1 / pose.layout).toFixed(4)})`,
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
