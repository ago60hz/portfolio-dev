"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * `--u` as a number of pixels, measured off an element that is sized in it.
 *
 * The scene is authored in Figma pixels times `--u`, which is fine for CSS but
 * useless to motion/react: it cannot interpolate `calc(-24 * var(--u))`, and
 * animating a custom property instead would drop the animation off the
 * compositor onto style recalc.
 *
 * Reading the token directly does not work, and the way it fails is quiet.
 * `--u` is unregistered and its value contains a container query unit, so
 * `getComputedStyle(el).getPropertyValue("--u")` returns the literal source
 * text -- `clamp(.62px, min(.09285cqw, ...), 1.15px)` -- not a length.
 * `parseFloat` on that is NaN, and every distance derived from it silently
 * becomes zero.
 *
 * So this measures a used value instead: give it an element whose width is
 * `calc(N * var(--u))` and the N, and it divides.
 *
 * `offsetWidth`, not `getBoundingClientRect`. The rect is in viewport space and
 * carries every ancestor transform with it, and the boot scales the whole
 * Window up to cover the viewport -- so on first mount the rect read a third
 * too wide, and because a transform does not change the layout box the
 * ResizeObserver never fired to correct it. Every can then lifted 32px instead
 * of 24. `offsetWidth` is the untransformed border box; it rounds to whole
 * pixels, which at 178u across costs less than a tenth of a pixel on the lift.
 *
 * Returns 0 until the first measurement. That is the honest answer on the
 * server and during hydration -- an animation reading it should be a no-op
 * rather than jump a guessed distance.
 */
export function useSceneUnit(
  ref: RefObject<HTMLElement | null>,
  unitsWide: number,
): number {
  const [u, setU] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || unitsWide <= 0) return;

    const read = () => setU(el.offsetWidth / unitsWide);
    read();
    // --u is clamped against both the container width and the viewport height,
    // so it changes on resize and on nothing else.
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, unitsWide]);

  return u;
}
