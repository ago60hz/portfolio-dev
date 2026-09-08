"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * True in the browser, false while rendering on the server.
 *
 * `useSyncExternalStore` rather than `useState` + an effect: setting state in
 * an effect body to learn where you are is a cascading render, and
 * `react-hooks/set-state-in-effect` is right to reject it. This asks the
 * question once, in the one place React offers a different answer per
 * environment, and subscribes to nothing because nothing ever changes.
 *
 * `hooks/usePrefersReducedMotion.ts` reads its media query the same way.
 */
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

/**
 * The 0-100 counter, after oma-0-100-preloader.framer.ai.
 *
 * Static, and pinned 16px off the bottom-right of the VIEWPORT. An earlier pass
 * gave each digit its own reel so the numerals rolled like an odometer; Praise
 * found it read as a different thing from the reference, which simply counts.
 * The number is the point -- it does not need a mechanism of its own on a
 * screen nobody is meant to dwell on.
 *
 * `tabular` matters more than it looks: without it the number shifts sideways
 * on almost every tick as the digit widths change.
 *
 * PORTALLED TO THE BODY, which is the only way it can honour that 16px.
 *
 * The loader lives inside the Window, and during boot the Window is scaled to
 * COVER the viewport -- `Math.max` of the two ratios, so one axis fits and the
 * other overflows. Measured at 1440x900 the Window's box ran to y=1050, 150px
 * past the fold. Anything positioned against that box is positioned against
 * edges that are not the screen's: 16px off its bottom-right measured 207px
 * from the right of the screen and 132px BELOW it.
 *
 * Counter-scaling the wrapper did not fix it either, and could not. The Window
 * scales about its own origin and the compensating wrapper about its centre,
 * so the two cancel in SIZE and not in POSITION -- which is what the old
 * `.loader-compensate` box was doing, and why the number sat where it did.
 *
 * A portal steps outside the transform rather than trying to undo it, so
 * `position: fixed` means the viewport again and 16px means 16px.
 */
export function LoaderCount({ percent }: { percent: number }) {
  /*
   * Portals need `document`, so the server render cannot have one. The store's
   * server snapshot is what keeps the two sides agreeing through hydration.
   */
  if (!useIsClient()) return null;

  return createPortal(
    <p className="count tabular" role="status" aria-live="polite">
      <span className="sr-only">{`Loading, ${percent} percent`}</span>
      <span aria-hidden>{Math.max(0, Math.min(100, Math.round(percent)))}</span>
    </p>,
    document.body,
  );
}
