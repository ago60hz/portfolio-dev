"use client";

import { useSyncExternalStore } from "react";

/**
 * Matches the `(width < 1024px)` frame in globals.css. The two must agree: the
 * CSS decides how many columns the grid draws, this decides how many cans are
 * put in each shelf, and a mismatch leaves a column empty or a can homeless.
 *
 * `lg`, not `md`. At 768 the sidebar takes 248px and the design frame needed
 * 668 of the ~500 that were left, so the third can of every shelf was clipped
 * and the bottom half of the Window was bare wall. A portrait tablet is closer
 * to a phone than to the frame the design was drawn at.
 */
const QUERY = "(max-width: 1023px)";

/** Cans per shelf. The phone frame is drawn for two; the design frame for three. */
export const DESKTOP_COLUMNS = 3;
export const MOBILE_COLUMNS = 2;

/**
 * How many cans stand on one shelf at this width.
 *
 * This cannot be CSS. Each shelf is its own section with its own plank and its
 * own garnishes, so moving a can from the third slot of one shelf to the first
 * of the next is a change to the DATA, not to a grid -- no media query can
 * carry a can across that boundary.
 *
 * `useSyncExternalStore` rather than `useIsMobile`'s effect, and the difference
 * matters here. An effect resolves after the first paint, so the room would be
 * laid out for three columns and then re-laid for two; this reads the true
 * value during the first CLIENT render, so the only mismatch is against the
 * server's HTML, and hydration settles it in the same commit.
 *
 * Even that is invisible: the loader covers the whole viewport for the length
 * of the boot, so nothing is on screen to be seen changing its mind.
 *
 * The server answers "desktop" because it has no width to measure, which is
 * also the right default for the static HTML a crawler reads.
 */
export function useShelfColumns(): number {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => (window.matchMedia(QUERY).matches ? MOBILE_COLUMNS : DESKTOP_COLUMNS),
    () => DESKTOP_COLUMNS,
  );
}
