"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { useRevealProps } from "@/components/motion/Reveal";
import { DURATION, bootDelay } from "@/lib/motion";
import { useKitchen } from "@/lib/store";

/** The entrance's one tug comes this long after the tag has arrived. */
const NUDGE_AFTER_MS = 700;

/**
 * The way into the gallery, and the way back out: a paper tag hanging off the
 * header's rule.
 *
 * Click it and it drops and spreads into the gallery's own paper. On the far
 * side the tag is purple and says "Back to kitchen": it always wears the
 * colour of where it takes you.
 *
 * One custom property does all of it. `--pull` on the wrapper, 0 or 1, is what
 * the sheet's clip, the tag's fade and its flip are written against, and a CSS
 * transition carries it between the two -- no React render per frame, and no
 * second animation that could disagree with the first.
 *
 * Lives on the WINDOW, not in the header, for the same reason the gallery
 * does: the header is inside the scroller and its stacking context, and a tag
 * in there could never sit above the gallery it has to lead back out of. The
 * header is sticky at the scroller's top, so a tag pinned under its measured
 * height is in the same place the strip is at every scroll position.
 */
export function GalleryPull() {
  const open = useKitchen((s) => s.infiniteOpen);
  const setOpen = useKitchen((s) => s.setInfiniteOpen);
  const booted = useEntranceReady();

  const wrapRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const [nudge, setNudge] = useState(false);

  // After the header has landed, so the tag comes out from under a strip that
  // is already there.
  const arrive = bootDelay("header") + DURATION.enter;
  const reveal = useRevealProps("slide-top", booted, arrive);

  // The sheet starts as the tag's exact shape, so it needs the tag's width.
  // borderBoxSize for the same reason Header uses it: fractional, and blind
  // to the boot's cover scale.
  useEffect(() => {
    const tag = tagRef.current;
    const wrap = wrapRef.current;
    if (!tag || !wrap) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.borderBoxSize?.[0]?.inlineSize ?? tag.offsetWidth;
      wrap.style.setProperty("--tag-w", `${w}px`);
    });
    ro.observe(tag);
    return () => ro.disconnect();
  }, []);

  // One tug, once, after the entrance. Never on a revisit where the gallery
  // is already up, and the CSS drops it entirely under reduced motion.
  useEffect(() => {
    if (!booted) return;
    const id = setTimeout(
      () => !useKitchen.getState().infiniteOpen && setNudge(true),
      arrive * 1000 + NUDGE_AFTER_MS,
    );
    return () => clearTimeout(id);
  }, [arrive, booted]);

  return (
    <div
      ref={wrapRef}
      className="gallery-pull"
      style={{ "--pull": open ? 1 : 0 } as CSSProperties}
    >
      <div className="gallery-sheet" aria-hidden>
        <span className="gallery-sheet-edge" />
        <span className="gallery-sheet-paper" />
      </div>

      <div className="gallery-tag-slot">
        <motion.div {...reveal}>
          <button
            ref={tagRef}
            type="button"
            className="gallery-tag"
            data-open={open || undefined}
            data-nudge={nudge || undefined}
            onAnimationEnd={(e) => e.animationName === "gallery-tag-release" && setNudge(false)}
            onClick={() => {
              setNudge(false);
              setOpen(!open);
            }}
          >
            <span className="gallery-tag-face" data-face="fwd" aria-hidden={open}>
              Switch to design gallery
              <Knob />
            </span>
            <span className="gallery-tag-face" data-face="back" aria-hidden={!open}>
              Back to kitchen
              <Knob />
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/** Points down on the way in; the back face turns it up. */
function Knob() {
  return (
    <span className="gallery-tag-knob" aria-hidden>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path
          d="M1.5 3 4 5.5 6.5 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
