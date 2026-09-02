import type { Work } from "@/content/works";
import { WorkCan } from "./WorkCan";
import { Garnish } from "./Garnish";

/**
 * One shelf row -- 230u tall, straight off work_row (1:224).
 *
 * Layer order is taken from the handoff and matters:
 *
 *   garnishes  (z-10)  behind everything -- they sit *in* the shelf
 *   shelf base (z-20)  the wooden front, drawn over the garnish feet
 *   cans       (z-30)  standing on the shelf
 *   shelf top  (z-40)  the glass lip, drawn LAST so it passes in front of the
 *                      cans' feet -- that overlap is what seats them
 *
 * The base hangs 1u below the row (Figma puts it at y223 in a 230 row), which
 * is what makes consecutive rows read as one continuous run of shelving.
 */
export function Shelf({
  works,
  index,
  children,
}: {
  works: Work[];
  index: number;
  /** Stickers that belong to this row, positioned against it. */
  children?: React.ReactNode;
}) {
  return (
    <section
      className="relative w-full shrink-0"
      style={{ height: "var(--row-h)" }}
      aria-label={`Shelf ${index + 1}`}
    >
      <Garnish shelfIndex={index} />

      {/* Wooden front */}
      <div
        aria-hidden
        className="shelf-base absolute inset-x-0 z-20 w-full"
        style={{ bottom: "var(--shelf-base-bottom)" }}
      />

      {/* Cans rest 9u above the row floor, so only the glass lip crosses them. */}
      <ul
        className="can-grid absolute inset-x-0 z-30 items-end"
        style={{ bottom: "var(--can-lift)" }}
      >
        {works.map((w) => (
          <li key={w.slug} className="flex justify-center">
            <WorkCan work={w} />
          </li>
        ))}
      </ul>

      {/* Glass lip, in front of the cans */}
      <div
        aria-hidden
        className="shelf-top absolute inset-x-0 z-40 w-full"
        style={{ bottom: "var(--shelf-top-bottom)" }}
      />

      {children}
    </section>
  );
}
