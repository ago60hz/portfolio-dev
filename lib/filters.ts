import type { Work } from "@/content/works";
import type { FilterId } from "@/content/filters";

export type ExitDirection = "left" | "right";

/** No active chip means everything shows. */
export function matchesFilter(work: Work, active: FilterId | null): boolean {
  return active === null || work.tags.includes(active);
}

/**
 * Which cans stay and which leave. Order is preserved on both sides so the
 * grid reflow stays stable and `layoutId` can track each can.
 */
export function partitionWorks(works: Work[], active: FilterId | null) {
  const matched: Work[] = [];
  const dismissed: Work[] = [];
  for (const w of works) (matchesFilter(w, active) ? matched : dismissed).push(w);
  return { matched, dismissed };
}

/**
 * A dismissed can leaves toward whichever window border it already sits
 * nearest — so nothing crosses the full width to get off screen.
 *
 * The exact-centre column has no nearer side, and the brief allows either. It
 * alternates by row, which reads as livelier than a column all exiting the
 * same way, and stays a pure function of position.
 */
export function exitDirection(index: number, columns: number): ExitDirection {
  if (columns <= 1) return "right";
  const column = index % columns;
  const row = Math.floor(index / columns);
  const middle = (columns - 1) / 2;
  if (column < middle) return "left";
  if (column > middle) return "right";
  return row % 2 === 0 ? "right" : "left";
}
