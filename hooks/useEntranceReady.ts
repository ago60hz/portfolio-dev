"use client";

import { useOnSand } from "@/hooks/useOnSand";
import { useKitchen } from "@/lib/store";

/**
 * Whether the boot entrance should be treated as already done.
 *
 * Two ways that is true. The loader has handed the room over, which is the
 * kitchen's case. Or we are on a case study, where the loader never runs at
 * all -- it lives inside the kitchen Window, so nothing on `/work/*` sets
 * `booted`, and anything waiting on it would sit at opacity 0 forever. The
 * sidebar's chips and accordions did exactly that.
 *
 * The pathname resolves synchronously on the first render, so a case study is
 * ready before it paints and `Reveal` skips its initial state entirely rather
 * than animating from it. That is what keeps the sidebar still on a case
 * study, which is the whole point: the reader is there to read, not to watch
 * the furniture arrive.
 */
export function useEntranceReady(): boolean {
  const booted = useKitchen((s) => s.booted);
  return useOnSand() || booted;
}
