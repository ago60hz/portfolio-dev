/**
 * The motion system, JS side.
 *
 * `app/globals.css` owns the same six curves as CSS custom properties; this
 * file mirrors them for `motion/react`, which cannot read a CSS variable as an
 * easing. The two are kept honest by `lib/motion.test.ts`, which parses the
 * stylesheet and compares the numbers -- so a curve can never drift into two
 * slightly different versions of itself, which is the specific failure that
 * makes a system feel janky.
 *
 * Nothing outside this file should write a bezier array or a duration literal
 * into a component. Before this existed, `[0.9, 0, 0, 1]` was typed by hand in
 * StickerStack and had already fallen out of step with the token.
 */

/** Praise's Jitter presets. Verbatim from the Motion Design brief. */
export const SMOOTH = [0.74, 0, 0, 1] as const;
export const SLOW_DOWN = [0, 0.36, 0, 1] as const;
export const ACCELERATE = [1, 0, 1, 0.64] as const;

/**
 * The three `linear()` presets, as their stop tables.
 *
 * CSS `linear()` is defined as piecewise-linear interpolation between evenly
 * spaced stops, so sampling these tables the same way reproduces the CSS curve
 * exactly rather than approximating it.
 */
export const ELASTIC_STOPS = [
  0, 0.0404, 0.1384, 0.2773, 0.4406, 0.613, 0.7813, 0.9349, 1.0659, 1.1695,
  1.2435, 1.2881, 1.3055, 1.2992, 1.2738, 1.2344, 1.1861, 1.1337, 1.0815,
  1.0329, 0.9906, 0.9564, 0.9311, 0.9149, 0.9073, 0.9072, 0.9135, 0.9244,
  0.9386, 0.9544, 0.9705, 0.9858, 0.9994, 1.0106, 1.0191, 1.0249, 1.028,
  1.0286, 1.0272, 1.0242, 1.0201, 1.0154, 1.0104, 1.0057, 1.0013, 0.9977,
  0.9948, 0.9928, 0.9916, 0.9912, 0.9915, 0.9923, 0.9935, 0.9949, 0.9964,
  0.9979, 0.9992, 1.0004, 1.0014, 1.002, 1.0025, 1.0027, 1.0026, 1.0024,
  1.0021, 1.0017, 1.0012, 1.0008, 1.0004, 1, 0.9997, 0.9994, 0.9993, 0.9992,
  0.9992, 0.9992, 0.9993, 0.9994, 0.9996, 0.9997, 0.9999, 1, 1.0001, 1.0002,
  1.0002, 1.0002, 1.0003, 1.0002, 1.0002, 1.0002, 1.0001, 1.0001, 1.0001, 1, 1,
  1, 0.9999, 0.9999, 0.9999, 0.9999, 1,
];

export const BOUNCE_STOPS = [
  0, 0.0018, 0.0073, 0.0164, 0.0293, 0.0457, 0.0658, 0.0896, 0.1171, 0.1482,
  0.183, 0.2214, 0.2635, 0.3092, 0.3586, 0.4117, 0.4685, 0.5289, 0.5929,
  0.6606, 0.732, 0.8071, 0.8858, 0.9681, 0.9678, 0.9188, 0.8735, 0.8319,
  0.7939, 0.7595, 0.7288, 0.7018, 0.6785, 0.6588, 0.6427, 0.6304, 0.6217,
  0.6166, 0.6152, 0.6175, 0.6234, 0.633, 0.6463, 0.6632, 0.6838, 0.708, 0.7359,
  0.7675, 0.8027, 0.8416, 0.8841, 0.9303, 0.9802, 0.9802, 0.9514, 0.9262,
  0.9047, 0.8868, 0.8726, 0.8621, 0.8553, 0.8521, 0.8525, 0.8566, 0.8644,
  0.8759, 0.891, 0.9097, 0.9322, 0.9582, 0.988, 0.9879, 0.9715, 0.9589, 0.9499,
  0.9445, 0.9429, 0.9448, 0.9505, 0.9598, 0.9728, 0.9894, 0.9946, 0.9854,
  0.9798, 0.9779, 0.9797, 0.9851, 0.9942, 0.9964, 0.9922, 0.9917, 0.9948,
  0.9991, 0.9967, 0.998, 0.9989, 0.9995, 0.9996, 1, 1,
];

export const OVERSHOOT_STOPS = [
  0, 0.3062, 0.5308, 0.7142, 0.869, 1.0017, 1.1163, 1.2156, 1.3019, 1.3765,
  1.4409, 1.4959, 1.5425, 1.5814, 1.613, 1.6381, 1.6569, 1.6699, 1.6775, 1.68,
  1.6782, 1.673, 1.6644, 1.6527, 1.6384, 1.622, 1.604, 1.5848, 1.5648, 1.5445,
  1.524, 1.5037, 1.4836, 1.4639, 1.4447, 1.426, 1.4078, 1.3902, 1.3732, 1.3568,
  1.3409, 1.3256, 1.3109, 1.2967, 1.283, 1.2698, 1.2571, 1.2448, 1.2331,
  1.2217, 1.2108, 1.2003, 1.1902, 1.1805, 1.1711, 1.1621, 1.1534, 1.1451,
  1.1371, 1.1294, 1.122, 1.1149, 1.1081, 1.1016, 1.0953, 1.0893, 1.0836,
  1.0781, 1.0728, 1.0677, 1.0629, 1.0583, 1.0539, 1.0498, 1.0458, 1.042,
  1.0384, 1.035, 1.0318, 1.0288, 1.0259, 1.0232, 1.0207, 1.0183, 1.0161,
  1.0141, 1.0122, 1.0104, 1.0088, 1.0074, 1.006, 1.0049, 1.0038, 1.0029,
  1.0021, 1.0015, 1.0009, 1.0005, 1.0002, 1.0001, 1,
];

/** A `linear()` stop table as an easing function, sampled the way CSS does. */
export function linearEase(stops: number[]): (t: number) => number {
  const last = stops.length - 1;
  return (t) => {
    if (t <= 0) return stops[0];
    if (t >= 1) return stops[last];
    const scaled = t * last;
    const i = Math.floor(scaled);
    return stops[i] + (stops[i + 1] - stops[i]) * (scaled - i);
  };
}

export const elastic = linearEase(ELASTIC_STOPS);
export const bounce = linearEase(BOUNCE_STOPS);
export const overshoot = linearEase(OVERSHOOT_STOPS);

/** Durations in SECONDS, matching the `--duration-*` tokens in milliseconds. */
export const DURATION = {
  press: 0.14,
  state: 0.22,
  max: 0.3,
  enter: 0.52,
  settle: 0.68,
  drop: 0.9,
  surface: 0.9,
} as const;

/** One beat of a staggered run, matching `--stagger`. */
export const STAGGER = 0.055;

/** The delay for the nth item of a staggered run. */
export const beat = (i: number) => i * STAGGER;

/** Named transitions. Reach for one of these before writing a literal. */
export const T = {
  /** A press or a hover tint. */
  press: { duration: DURATION.press, ease: SMOOTH },
  /** A state change on something already on screen. */
  state: { duration: DURATION.state, ease: SMOOTH },
  /** Something arriving. */
  enter: { duration: DURATION.enter, ease: SLOW_DOWN },
  /** Something leaving. */
  exit: { duration: DURATION.state, ease: ACCELERATE },
  /** A pop. Only ever on a small scale delta -- see the note in globals.css. */
  pop: { duration: DURATION.enter, ease: overshoot },
  /** A settle with life in it. Small deltas only, same reason. */
  settle: { duration: DURATION.settle, ease: elastic },
  /**
   * A decaying wobble expressed as keyframes.
   *
   * Deliberately a tween and not a spring: motion supports exactly two
   * keyframes with a spring, and a ring-out needs four or five. The damping
   * lives in the keyframe values instead, so the easing here only has to carry
   * the timing between them.
   */
  ringOut: { duration: DURATION.settle, ease: SMOOTH },
} as const;

/**
 * Springs, for anything a visitor can interrupt.
 *
 * A tween restarts from zero when it is retargeted; a spring carries its
 * velocity across. Sweeping the pointer along a shelf interrupts the can lift
 * and the popover constantly, which is why both are springs and neither is one
 * of the `linear()` curves above.
 */
export const SPRING = {
  /** Picking a can up. Snappy, barely any bounce -- it is a deliberate act. */
  lift: { type: "spring", duration: 0.34, bounce: 0.34 },
  /**
   * Letting it go. Longer than the pick-up, because that one is gravity.
   *
   * Barely any bounce, and deliberately so: the cans sit BEHIND the shelf's
   * glass lip (z-30 against z-40), so the lip crosses their feet and seats
   * them. A bouncy drop carries the can back up past its resting position,
   * clear of the lip, and reads as the can jumping in front of the shelf and
   * then correcting itself. The ring lives in the rotation instead, where it
   * costs nothing.
   */
  drop: { type: "spring", duration: 0.8, bounce: 0.08 },
  /** The popover swinging on its ribbon. */
  card: { type: "spring", duration: 0.7, bounce: 0.5 },
  /** A sticker flying to the back of the pile. */
  sticker: { type: "spring", duration: 0.55, bounce: 0.3 },
} as const;

/**
 * The homepage entrance, as one table.
 *
 * The brief asks for the sidebar, then the header, then the cans, then the
 * gallery. Spread across components those delays become nine magic numbers
 * that drift the first time anyone retimes one, so they live here and every
 * entrance reads its own beat off this object.
 *
 * Values are beat indices, not seconds -- retiming the whole sequence is one
 * change to STAGGER.
 */
export const BOOT = {
  sidebar: 0,
  brand: 1,
  bio: 2,
  chips: 4,
  stickers: 6,
  accordions: 7,
  header: 1,
  /** The first can. Each subsequent can adds a beat, by grid index. */
  cans: 4,
  galleryBoard: 9,
  /** The pinned artwork, once the board has arrived under it. */
  galleryArt: 11,
} as const;

/** Seconds of delay for a named entrance beat, plus an optional offset. */
export const bootDelay = (key: keyof typeof BOOT, offset = 0) =>
  beat(BOOT[key] + offset);
