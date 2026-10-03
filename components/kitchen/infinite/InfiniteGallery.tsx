"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GALLERY_TILES } from "@/content/gallery";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useSceneUnit } from "@/hooks/useSceneUnit";
import { layoutSpread } from "@/lib/infinite";
import { DURATION, bootDelay } from "@/lib/motion";
import { useKitchen } from "@/lib/store";
import { InfiniteTile } from "./InfiniteTile";
import { useInfiniteScroll } from "./useInfiniteScroll";

/**
 * How long after the room lands before the pictures are fetched.
 *
 * `booted` is not late enough on its own. The entrance is a staggered run that
 * goes on for another beat table's worth of time after the handover, and image
 * requests landing in the middle of it compete with the cans for the
 * connection. Read off the beat table rather than guessed, so retiming the
 * entrance retimes this with it.
 */
const AFTER_ENTRANCE_MS = (bootDelay("galleryArt") + DURATION.enter) * 1000;

/**
 * The Window's second view: every curated case-study still on one endless
 * wall, scrolled in any direction.
 *
 * Opened by the tag under the header (GalleryPull), which unrolls into this
 * view's paper; Escape or the tag's "Back to kitchen" closes it. The wall
 * itself does nothing on its own -- no pictures move unless the visitor moves
 * them -- so it reads as a surface to browse, not a show to watch.
 */
export function InfiniteGallery() {
  const open = useKitchen((s) => s.infiniteOpen);
  const setOpen = useKitchen((s) => s.setInfiniteOpen);
  const reduced = usePrefersReducedMotion();
  const booted = useEntranceReady();
  const [armed, setArmed] = useState(false);

  const layerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);

  const unit = useSceneUnit(rulerRef, 100);

  const { slots, periodX, periodY } = useMemo(
    () => layoutSpread(GALLERY_TILES.map((t) => t.width / t.height)),
    [],
  );

  const scroll = useInfiniteScroll(
    layerRef,
    panRef,
    tileRefs,
    slots,
    { periodX, periodY },
    unit,
    open,
    reduced,
  );

  // Every visit starts from the middle of the wall. Done as it opens, while
  // the layer is still transparent behind the unrolling sheet.
  const reset = scroll.reset;
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  /*
   * The pictures are mounted once the room has landed AND finished arriving.
   *
   * Mounted rather than merely hidden, so nothing is requested during the
   * entrance; then lazy, so only the prints in and around the frame load
   * before anyone opens the wall. Waiting out the beat table and asking for
   * idle time puts that after the kitchen is usable and still long before
   * anyone clicks the tag. The fallback covers Safari, which has no
   * requestIdleCallback.
   */
  useEffect(() => {
    if (!booted || armed) return;
    let idleId = 0;
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : null;
    const wait = window.setTimeout(() => {
      idleId = idle
        ? idle(() => setArmed(true), { timeout: 3000 })
        : window.setTimeout(() => setArmed(true), 0);
    }, AFTER_ENTRANCE_MS);
    return () => {
      clearTimeout(wait);
      if (!idleId) return;
      if (idle) window.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
    };
  }, [armed, booted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div
      ref={layerRef}
      className="infinite-layer"
      data-open={open}
      aria-label="Gallery of interface work"
      {...(!open && { inert: true })}
    >
      {/* Sized in --u and measured, because --u itself cannot be read back:
          it is unregistered and holds a container query unit, so it reads as
          its own clamp() source text. See useSceneUnit. */}
      <span
        ref={rulerRef}
        aria-hidden
        className="pointer-events-none absolute h-0 w-[calc(100*var(--u))]"
      />

      <div ref={panRef} className="infinite-pan">
        {(armed || open) &&
          GALLERY_TILES.map((tile, i) => (
            <InfiniteTile
              key={tile.key}
              tile={tile}
              dragged={scroll.dragged}
              elRef={(el) => void (tileRefs.current[i] = el)}
              style={
                {
                  "--tw": `calc(${slots[i].w} * var(--u))`,
                  "--th": `calc(${slots[i].h.toFixed(2)} * var(--u))`,
                  "--sx": slots[i].x.toFixed(2),
                  "--sy": slots[i].y.toFixed(2),
                } as React.CSSProperties
              }
            />
          ))}
      </div>
    </div>
  );
}
