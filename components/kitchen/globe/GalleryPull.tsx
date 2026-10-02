"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { useRevealProps } from "@/components/motion/Reveal";
import { DURATION, bootDelay } from "@/lib/motion";
import { useKitchen } from "@/lib/store";

/** The share of the pull by which the sheet reaches the floor. Matches the
 *  0.62 in `.gallery-sheet`; it is what makes the sheet's edge track the hand
 *  1:1 for as long as there is floor left to pull it to. */
const DROP_SHARE = 0.62;

/** Past this, letting go finishes the move instead of springing back. At 0.2
 *  the sheet's edge is a third of the way down the room -- about 260px on the
 *  design frame. 0.3 was tried first and asked for half the Window, which is
 *  further than anyone drags a thing before deciding it is not going to move. */
const COMMIT_AT = 0.2;

/** A flick, in px/ms. Fast enough that a short snap down still opens it. */
const FLICK = 0.5;

/** Movement before a press counts as a drag, so a slightly shaky click is a
 *  click rather than a tiny pull that springs back. */
const SLOP = 6;

/** The entrance's one tug comes this long after the tag has arrived. */
const NUDGE_AFTER_MS = 700;

type Drag = {
  id: number;
  y0: number;
  active: boolean;
  pull: number;
  samples: { t: number; y: number }[];
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/**
 * The way into the gallery, and the way back out: a paper tag hanging off the
 * header's rule (replaces the header's Gallery switch).
 *
 * Click it and it drops and spreads into the gallery's own paper. Drag it and
 * the sheet follows the hand -- 1:1 down to the floor -- and finishes on
 * `slow-down` from wherever it was let go, scaled to the distance left, because
 * `smooth` starts slowly and a release that starts slowly reads as a hitch. On
 * the far side the tag is purple and says "Back to kitchen": it always wears
 * the colour of where it takes you.
 *
 * One custom property does all of it. `--pull` on the wrapper is what the
 * sheet's clip, the tag's fade and its flip are all written against, so a
 * click is a CSS transition of that number and a drag is the same number
 * written by hand -- no React render per frame, and no second animation that
 * could disagree with the first.
 *
 * Lives on the WINDOW, not in the header, for the same reason the globe does:
 * the header is inside the scroller and its stacking context, and a tag in
 * there could never sit above the gallery it has to lead back out of. The
 * header is sticky at the scroller's top, so a tag pinned under its measured
 * height is in the same place the strip is at every scroll position.
 */
export function GalleryPull() {
  const open = useKitchen((s) => s.globeOpen);
  const setOpen = useKitchen((s) => s.setGlobeOpen);
  const booted = useEntranceReady();

  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nudge, setNudge] = useState(false);

  // After the header has landed, so the tag comes out from under a strip that
  // is already there.
  const arrive = bootDelay("header") + DURATION.enter;
  const reveal = useRevealProps("slide-top", booted, arrive);

  /*
   * The store is the source of truth; the pull follows it.
   *
   * Written imperatively rather than as an inline style because a drag writes
   * the same property by hand. React only touches a style when ITS value
   * changes, so a drag that sprang back to 0 under an inline `--pull: 0` would
   * have been left wherever the hand put it.
   */
  useEffect(() => {
    wrapRef.current?.style.setProperty("--pull", open ? "1" : "0");
  }, [open]);

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
      () => !useKitchen.getState().globeOpen && setNudge(true),
      arrive * 1000 + NUDGE_AFTER_MS,
    );
    return () => clearTimeout(id);
  }, [arrive, booted]);

  useEffect(() => () => void (settle.current && clearTimeout(settle.current)), []);

  const surfaceOf = () => wrapRef.current?.closest<HTMLElement>("[data-surface]") ?? null;

  /** The frame's colour at a given pull: purple to paper, the same mix the
   *  surface transition passes through on its own. */
  const paintSurface = (surface: HTMLElement, pull: number) =>
    surface.style.setProperty(
      "--color-kitchen-surface",
      `color-mix(in oklab, var(--color-kitchen-purple), var(--color-kitchen-paper) ${(pull * 100).toFixed(1)}%)`,
    );

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    // A cancelled drag (the browser took the gesture) never gets the click it
    // was holding back, so the swallow is cleared by the next press instead.
    swallowClick.current = false;
    // Forward only. The way back is a click: the tag sits against the header,
    // and there is no room above it to drag anything into.
    if (open || e.button !== 0) return;
    drag.current = { id: e.pointerId, y0: e.clientY, active: false, pull: 0, samples: [] };
    e.currentTarget.setPointerCapture(e.pointerId);
    setNudge(false);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    const wrap = wrapRef.current;
    const sheet = sheetRef.current;
    const surface = surfaceOf();
    if (!d || d.id !== e.pointerId || !wrap || !sheet || !surface) return;

    const dy = e.clientY - d.y0;
    if (!d.active) {
      if (dy < SLOP) return;
      d.active = true;
      if (settle.current) clearTimeout(settle.current);
      wrap.style.transition = "";
      wrap.dataset.dragging = "";
      surface.dataset.pulling = "";
    }

    const travel = Math.max(1, sheet.clientHeight - (tagRef.current?.offsetHeight ?? 28));
    d.pull = clamp(((dy - SLOP) * DROP_SHARE) / travel);
    wrap.style.setProperty("--pull", d.pull.toFixed(4));
    paintSurface(surface, d.pull);

    d.samples.push({ t: e.timeStamp, y: e.clientY });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 80) d.samples.shift();
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.active) return; // A click; onClick takes it from here.
    swallowClick.current = true;

    const wrap = wrapRef.current;
    const surface = surfaceOf();
    if (!wrap || !surface) return;

    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    const v = first && last ? (last.y - first.y) / Math.max(1, last.t - first.t) : 0;
    const target = v > FLICK || (d.pull > COMMIT_AT && v > -FLICK) ? 1 : 0;
    const ms = Math.round(clamp(Math.abs(target - d.pull) * DURATION.surface * 1000, 220, 900));

    /*
     * One tick, in this order: give both the sheet and the frame the release
     * clock, lift the drag flags that were holding their transitions off, then
     * write the targets. The browser starts every transition from the colour
     * and pull the hand left, so nothing jumps.
     */
    const clock = `${ms}ms`;
    wrap.style.transition = `--pull ${clock} var(--ease-slow-down)`;
    surface.style.setProperty("--surface-dur", clock);
    surface.style.setProperty("--surface-ease", "var(--ease-slow-down)");
    delete wrap.dataset.dragging;
    delete surface.dataset.pulling;
    wrap.style.setProperty("--pull", String(target));
    paintSurface(surface, target);
    if (target === 1) setOpen(true);

    // Hand both back to the stylesheet once they have landed. By then the
    // inline colour equals what data-surface gives, so removing it is silent.
    settle.current = setTimeout(() => {
      wrap.style.transition = "";
      surface.style.removeProperty("--surface-dur");
      surface.style.removeProperty("--surface-ease");
      surface.style.removeProperty("--color-kitchen-surface");
    }, ms + 60);
  }

  return (
    <div ref={wrapRef} className="gallery-pull">
      <div ref={sheetRef} className="gallery-sheet" aria-hidden>
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
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={() => {
              if (swallowClick.current) {
                swallowClick.current = false;
                return;
              }
              setNudge(false);
              setOpen(!open);
            }}
          >
            <span className="gallery-tag-face" data-face="fwd" aria-hidden={open}>
              <GlobeGlyph />
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

/** A meridian and an equator: the globe the tag opens, at 12px. */
function GlobeGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="6" cy="6" rx="2.2" ry="5.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M0.75 6h10.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** The pull itself. Points down on the way in; the back face turns it up. */
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
