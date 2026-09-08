"use client";

import { useEffect, useRef, useState } from "react";

/** Lines shown before a long testimonial is clamped. */
const LINES = 5;

/**
 * A testimonial, clamped until the reader asks for the rest.
 *
 * CLAMPED, NOT TRUNCATED, and the distinction is the whole design of this
 * component. These are real words from real people; `content/comments.ts` says
 * never to trim them and `CommentsThread.test.tsx` asserts every paragraph is
 * present. So the full text is always in the DOM and always in the accessibility
 * tree -- a `max-height` only limits how much of it is painted. A screen reader,
 * a find-in-page, and the test all still see the whole thing, and nobody's words
 * are cut short in a way they could not undo.
 *
 * `5lh` rather than `-webkit-line-clamp`, which is the usual answer and is
 * wrong here: line-clamp needs `display: -webkit-box` on the clamping element,
 * and that drops the flex `gap` that separates Marco's three paragraphs -- his
 * testimonial ran together into one block the moment it collapsed. The `lh`
 * unit resolves against this element's own line-height, so the height stays
 * tied to the type rather than to a magic pixel value.
 *
 * The toggle carries no `opacity`, deliberately. kitchen-surface at 80% over
 * the Comments panel's ink ground computes to #795acc, which is 4.14:1 --
 * under AA for 12px text, and `a11y.spec.ts` fails on it. Dimming small type
 * on a dark ground is the specific way this palette breaks contrast, so the
 * hierarchy comes from size and the dotted rule instead.
 *
 * The toggle appears only when the text actually overflows, measured after
 * layout rather than guessed from a character count: the sidebar is a clamped
 * width and the same paragraph wraps to a different number of lines at either
 * end of it, so a length threshold would show "Read more" on comments that had
 * nothing more to show.
 */
export function CommentBody({ body }: { body: string }) {
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Re-measured on resize because the sidebar is `clamp(272px, 24.7vw, 380px)`
    // -- a window drag changes how many lines the same words take.
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // Re-runs when `open` flips so the observer is measuring the current box.
  }, [open]);

  const paragraphs = body.split("\n\n");

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={box}
        className="flex flex-col gap-1 overflow-hidden"
        style={
          open
            ? undefined
            : {
                maxHeight: `${LINES}lh`,
                // Paragraph gaps mean the cut does not always land on a line
                // boundary, and a hard edge mid-letter reads as a rendering
                // fault. The fade makes the last visible line trail off, which
                // says "there is more" in the same breath as the button does.
                maskImage: "linear-gradient(to bottom, #000 72%, transparent)",
              }
        }
      >
        {paragraphs.map((para, i) => (
          <p key={i} className="text-fine text-pretty">
            {para}
          </p>
        ))}
      </div>

      {(clipped || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="cursor-pointer self-start text-fine underline decoration-dotted underline-offset-2 hover:decoration-solid"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
