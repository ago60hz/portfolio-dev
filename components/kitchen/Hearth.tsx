"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Something is cooking below the shelf.
 *
 * The brief asks for steam rising from the bottom of the Work_rows window --
 * and explicitly NOT for a pot, because the pot belongs to the slash game. So
 * this is atmosphere and nothing else: `aria-hidden`, `pointer-events-none`,
 * and pinned to the Window floor at z-20, above the tiled wall and beneath the
 * shelf fronts, the cans and the filter dim. Rising BEHIND the shelves is what
 * places its source under them.
 *
 * It spans the whole scene rather than the floor band it used to sit in: a
 * plume that reads as long has to be able to climb past the bottom shelf, and
 * the band is only 156u tall, so it was clipping every one of them.
 *
 * Pure CSS, and only `opacity` and `transform` animate, so it stays on the
 * compositor. No canvas and no frame loop -- the WebGL radio a few hundred
 * pixels away needs those frames more than a wisp of steam does.
 */

/**
 * Where each plume leaves the floor, in scene units.
 *
 * Tall and narrow: the boxes are roughly three times higher than they are
 * wide, and the keyframe stretches them further as they climb. Three of them,
 * not more -- smoke reads as smoke when there is space around it.
 */
const STEAM = [
  { x: 112, w: 44, h: 150, delay: -1.5, dur: 16 },
  { x: 448, w: 34, h: 122, delay: -7.4, dur: 19 },
  { x: 806, w: 50, h: 168, delay: -12.8, dur: 22 },
];

export function Hearth() {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {STEAM.map((s, i) => (
        <span
          key={i}
          className="hearth-steam"
          style={{
            left: `calc(${s.x} * var(--u))`,
            width: `calc(${s.w} * var(--u))`,
            height: `calc(${s.h} * var(--u))`,
            // Spread, not a pair of ternaries: `animation` is a shorthand, and
            // React writing it -- even as the empty string it writes for
            // `undefined` -- resets the delay and duration set beside it. That
            // silently put all three plumes back on one clock.
            ...(reduced
              ? // Reduced motion gets a still, faint haze, not a faster one.
                { animation: "none", opacity: 0.12 }
              : // Negative delays start each plume part-way through its own
                // cycle, so the three read as a continuous drift from the
                // first frame instead of all launching together.
                {
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.dur}s`,
                }),
          }}
        />
      ))}
    </div>
  );
}
