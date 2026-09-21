"use client";

import { useEffect, useRef, useState } from "react";
import { useKitchen } from "@/lib/store";

/**
 * The header's Gallery switch (458:1830 off, 458:1865 on).
 *
 * Geometry is the design's, to the pixel: a 24x12 track at radius 99 with 2 of
 * inset, and an 8x8 knob that therefore travels 12. Off is an ink track with a
 * purple knob; on is a purple track with a lime knob -- which is the one place
 * the purple SURVIVES the repaint. Everything else in the frame has gone to
 * paper by the time the knob lands, so the switch is left holding the colour it
 * took off the room.
 *
 * Real pixels rather than --u, like every other hit target and every label in
 * this strip: a 24u control is 15px wide on a phone frame and unusable.
 *
 * The liquid comes from bencho.dev/?c=liq-toggle (MIT), whose indicator
 * stretches along its travel and relaxes at the far end. At 24px wide there is
 * no room for its goo filter to read, so the stretch IS the effect: the knob
 * pulls out to 1.9x with its origin on the trailing edge, leaving the tail
 * behind the travel, then releases into its resting circle.
 *
 * Its own 190ms cubic-bezier is NOT reproduced, and deliberately: this codebase
 * has six curves and adding a seventh for one control is how a motion system
 * stops being one. The effect is rebuilt out of the house vocabulary instead,
 * which means `translate` and `scale` are separate properties rather than one
 * `transform` -- they need different curves, and one transform can only have
 * one.
 *
 *   travel   `smooth` over `state`   -- movement of something already on screen
 *   stretch  `slow-down` over `press` -- it arrives, fast, and stops
 *   release  `elastic` over `settle`  -- a settle with life in it
 *
 * `elastic` peaks at 1.3055 of the delta, and the delta here is the 0.9 the
 * knob is giving back, so it squashes to about 0.73 before it rounds out. On an
 * 8px knob that is two pixels of wobble, which is the liquid.
 */
const STRETCH_MS = 140;

export function GalleryToggle() {
  const open = useKitchen((s) => s.globeOpen);
  const setOpen = useKitchen((s) => s.setGlobeOpen);
  const [stretching, setStretching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function toggle() {
    setOpen(!open);
    // A phase, not a state: held for the length of the travel and then
    // released, so the knob relaxes at the far end rather than resting
    // permanently deformed.
    setStretching(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStretching(false), STRETCH_MS);
  }

  return (
    <span className="chip gap-1 text-kitchen-ink">
      <span className="text-fine leading-none">Gallery</span>

      <button
        type="button"
        role="switch"
        aria-checked={open}
        aria-label="Show the UI gallery"
        onClick={toggle}
        className="hit-32 relative h-3 w-6 shrink-0 cursor-pointer rounded-full transition-colors duration-(--duration-state) ease-(--ease-smooth) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink"
        style={{
          backgroundColor: open
            ? "var(--color-kitchen-purple)"
            : "var(--color-kitchen-ink)",
        }}
      >
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 size-2 rounded-full"
          style={{
            backgroundColor: open
              ? "var(--color-kitchen-lime)"
              : "var(--color-kitchen-purple)",
            // The origin sits on the edge the knob is leaving, so the stretch
            // trails the travel instead of running ahead of it.
            transformOrigin: open ? "right center" : "left center",
            // 150% of an 8px knob is the design's 12px of travel.
            translate: `${open ? 150 : 0}% 0`,
            scale: `${stretching ? 1.9 : 1} 1`,
            transition:
              `translate var(--duration-state) var(--ease-smooth), ` +
              (stretching
                ? `scale var(--duration-press) var(--ease-slow-down), `
                : `scale var(--duration-settle) var(--ease-elastic), `) +
              `background-color var(--duration-state) var(--ease-smooth)`,
          }}
        />
      </button>
    </span>
  );
}
