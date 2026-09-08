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

/**
 * Column positions in the 1077 window, straight off work_row (1:224), and the
 * can's own width. The grid reproduces these at any size because it is built
 * from percentage padding plus space-between, so scene units stay 1-to-1.
 */
const COLUMN_X = [96, 450, 804];
const CAN_W = 178;
const WINDOW_W = 1077;

/**
 * How far a dismissed can travels to clear the window, in scene units.
 *
 * Each one leaves by its nearest edge and travels only as far as it must. A
 * single large offset for every can would work, but the edge cans would then
 * fly several window-widths out for no reason, and the stagger you get from
 * honest distances is what makes the shelf read as clearing rather than
 * blinking out.
 */
export function exitOffset(index: number, columns: number): number {
  const x = COLUMN_X[index % columns] ?? 0;
  return exitDirection(index, columns) === "left" ? -(x + CAN_W) : WINDOW_W - x;
}
