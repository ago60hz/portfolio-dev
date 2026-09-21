"use client";

import { useEffect } from "react";

/**
 * Arriving at a picture rather than at the top of the article.
 *
 * The globe gallery links each tile to the exact still it shows, so a study can
 * be opened at `#media-04-stepper` and has to land there. Two things stop the
 * browser doing this on its own.
 *
 * The document is not the scroller -- `[data-study-scroll]` is -- so the
 * fragment has nothing to move. And that element carries `scroll-behavior:
 * smooth`, which on a fragment load animates the whole length of a long article
 * while the reader watches: motion they did not ask for, on a page they have
 * not read yet. So the first jump is forced to `instant` and only later ones
 * (a rail click, a skip link) glide.
 *
 * `scrollIntoView` rather than arithmetic: it already knows about the scroller,
 * the element's `scroll-mt` and the writing direction.
 */
export function StudyHashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    // A frame's grace: the article is server-rendered, so the target exists on
    // the first paint, but its space is reserved by MediaFrame's aspect ratio
    // and that is laid out with everything else.
    const raf = requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
