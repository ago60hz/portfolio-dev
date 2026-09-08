"use client";

/**
 * The 0-100 counter, after oma-0-100-preloader.framer.ai.
 *
 * Static, and pinned to the bottom-left corner. An earlier pass gave each digit
 * its own reel so the numerals rolled like an odometer; Praise found it read as
 * a different thing from the reference, which simply counts. The number is the
 * point -- it does not need a mechanism of its own on a screen nobody is meant
 * to dwell on.
 *
 * `tabular` matters more than it looks: without it the number shifts sideways
 * on almost every tick as the digit widths change, which at this size is the
 * whole corner of the screen moving.
 */
export function LoaderCount({ percent }: { percent: number }) {
  return (
    <p className="count tabular" role="status" aria-live="polite">
      <span className="sr-only">{`Loading, ${percent} percent`}</span>
      <span aria-hidden>{Math.max(0, Math.min(100, Math.round(percent)))}</span>
    </p>
  );
}
