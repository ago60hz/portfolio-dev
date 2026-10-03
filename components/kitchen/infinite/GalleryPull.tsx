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
 * Click it and it scales up into the gallery's own paper: the sheet starts
 * as the tag's exact box and grows evenly to fill the Window. On the far side
 * the tag is purple and says "Back to kitchen": it always wears the colour of
 * where it takes you.
 *
 * `--pull` on the wrapper, 0 or 1, eases the tag's fade and flip; the sheet's
 * growth is a transform transition of its own on the same curve and length,
 * so the two land together.
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
  const sheetRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const [nudge, setNudge] = useState(false);

  // After the header has landed, so the tag comes out from under a strip that
  // is already there.
  const arrive = bootDelay("header") + DURATION.enter;
  const reveal = useRevealProps("slide-top", booted, arrive);

  /*
   * The sheet starts as the tag's exact box, so it needs both sizes: the
   * scale that shrinks the full sheet onto the tag is their ratio, each way.
   * borderBoxSize for the same reason Header uses it: fractional, and blind
   * to the boot's cover scale.
   */
  useEffect(() => {
    const tag = tagRef.current;
    const sheet = sheetRef.current;
    const wrap = wrapRef.current;
    if (!tag || !sheet || !wrap) return;
    const size = { tag: [0, 0], sheet: [0, 0] };
    const publish = () => {
      const [tw, th] = size.tag;
      const [sw, sh] = size.sheet;
      if (!tw || !sw || !sh) return;
      wrap.style.setProperty("--sx", (tw / sw).toFixed(4));
      wrap.style.setProperty("--sy", (th / sh).toFixed(4));
    };
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.borderBoxSize?.[0];
        const dims = [box?.inlineSize ?? 0, box?.blockSize ?? 0];
        if (entry.target === tag) size.tag = dims;
        else size.sheet = dims;
      }
      publish();
    });
    ro.observe(tag);
    ro.observe(sheet);
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
      data-open={open || undefined}
      style={{ "--pull": open ? 1 : 0 } as CSSProperties}
    >
      <div ref={sheetRef} className="gallery-sheet" aria-hidden />

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
      <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
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
