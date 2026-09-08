"use client";

import { usePathname } from "next/navigation";

/**
 * Is the reader inside a case study?
 *
 * The room repaints from purple to sand on `/work/*` (51:1569). Colour is
 * handled entirely in CSS by `[data-surface]`; this hook exists for the things
 * CSS cannot swap: the chef tool icons, which are artwork drawn for a specific
 * ground and come in two sets, and whether the entrance has anything to wait
 * for (see useEntranceReady).
 *
 * `usePathname` returns null wherever there is no router above the component --
 * a unit test rendering a can on its own, most obviously. Falling back to the
 * empty string answers "no, not on sand", which is the right answer there and
 * a good deal better than throwing.
 */
export function useOnSand(): boolean {
  return (usePathname() ?? "").startsWith("/work/");
}
