"use client";

import type { FilterId } from "@/content/filters";
import { useApplyFilter } from "@/hooks/useApplyFilter";

/**
 * The category chip in a study's breadcrumb (25:667).
 *
 * It used to be a label, on the reasoning that a breadcrumb which looks
 * clickable and is not is worse than one that never claimed to be. Filtering is
 * wired now, so it makes good on the claim: pressing it returns to the kitchen
 * with that category already chosen -- the same journey the sidebar's own chip
 * makes from this route, through the same hook.
 *
 * A button rather than a `<Link href="/">`, because the destination is not the
 * kitchen as such, it is the kitchen showing this filter; the store write has
 * to land with the navigation, not after a full page load discards it.
 */
export function FilterCrumb({ id, label }: { id: FilterId; label: string }) {
  const applyFilter = useApplyFilter();

  return (
    <button
      type="button"
      onClick={() => applyFilter(id)}
      // Same hover as the accordion rows and the sidebar chips: the house
      // drop-shadow thickens along the bottom. The chip's height is fixed, so
      // nothing on the strip moves when it does.
      className="chip trim-cap hit-32 hidden shrink-0 cursor-pointer text-body font-medium text-kitchen-ink transition-[border-width] duration-(--duration-press) hover:border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink sm:inline-flex"
      style={{ "--chip-h": "15px" } as React.CSSProperties}
    >
      {label}
    </button>
  );
}
