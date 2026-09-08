"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SLOW_DOWN, DURATION, beat } from "@/lib/motion";

/**
 * A heading that masks in from below, a word at a time.
 *
 * Each word sits in its own clipping box and starts translated fully below it,
 * so the words do not fade in -- they rise out from behind the line above them
 * and stop. That reads as typesetting rather than as an effect, which is what
 * a case study heading wants: it is the first thing a reader looks at, and it
 * should arrive with some weight and then get out of the way.
 *
 * Words, not characters: a section heading is a claim, and revealing it letter
 * by letter turns reading it into waiting for it.
 *
 * The text is in the DOM in full and in order from the first paint, so it is
 * selectable, searchable and read correctly by assistive technology whatever
 * the animation is doing. Only the visual position moves.
 *
 * The spaces between words are real text nodes rather than pseudo-elements.
 * Drawing them in CSS looks identical and is invisible to `textContent`, which
 * turned the heading into "ZerooutoftwelveRedesigning" for anything reading
 * the page rather than looking at it -- copy and paste, search, and a screen
 * reader included.
 */
export function MaskWords({
  text,
  className,
  /**
   * Seconds between words.
   *
   * Two beats, not one. At one beat an eleven-word heading finishes its whole
   * cascade in 550ms, and short words landing 55ms apart do not read as words
   * arriving -- they read as the line scrambling itself in. Slowing the step
   * is what makes the unit legible.
   */
  step = beat(2),
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  step?: number;
  as?: "span" | "div";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    // Rooted at the case study's own scroller: the article scrolls inside the
    // Window, and the window is never the scroll container here.
    const root = document.querySelector<HTMLElement>("[data-study-scroll]");
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShown(true),
      { root, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag ref={ref as never} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {/* The clipping box. inline-block so it can clip, and a little
              bottom padding because descenders sit below the line box and
              would otherwise be sliced off by the overflow. */}
          <span className="mask-word">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={shown ? { y: "0%" } : { y: "110%" }}
              transition={{
                duration: DURATION.enter,
                ease: SLOW_DOWN,
                delay: shown ? i * step : 0,
              }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
