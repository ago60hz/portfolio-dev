import type { ReactNode } from "react";

/**
 * The case-study surface (25:665).
 *
 * Byte-identical chrome to the kitchen Window -- 1px ink border with a 2px
 * bottom, radius 6 -- so navigating between them changes the cargo and not the
 * frame. Only the fill differs: warm greige instead of paper, because a long
 * read on #fafafa inside a purple frame glares.
 *
 * It carries `.kitchen-stage` so --u still resolves against the Window's own
 * width. That is what keeps the header and the border matching the kitchen's.
 * The article inside deliberately does NOT use --u: a document reflows, and
 * scaling 14px body copy with the scene would make it unreadable on a phone.
 */
export function StudyWindow({ children }: { children: ReactNode }) {
  return (
    <div className="kitchen-stage relative flex h-full w-full flex-col overflow-hidden rounded-(--radius-window) border border-b-2 border-kitchen-ink bg-kitchen-tan">
      {children}
    </div>
  );
}
