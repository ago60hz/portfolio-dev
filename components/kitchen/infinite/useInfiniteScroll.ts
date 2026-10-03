"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { wrapOffset, type Slot } from "@/lib/infinite";

/**
 * Scrolling the wall, endlessly, in any direction.
 *
 * The wall is ONE set of tiles, not a tiled copy of itself: the container
 * carries the scroll as a single transform, and a tile that has drifted more
 * than half a period from the middle is moved a whole period back. So the DOM
 * never grows, scrolling costs the same at any distance, and the lattice stays
 * exact -- a tile always lands where its neighbour would have been.
 *
 * Nothing on the wall animates on its own. The tiles have no transitions at
 * all: a tile crossing the seam JUMPS a period, off-screen, rather than gliding
 * across the wall to its new place -- which is what an eased transform on each
 * tile used to do, and what read as the pictures chasing the cursor. The only
 * motion is the scroll itself.
 *
 * The wheel moves a TARGET and the wall eases toward it on one continuous
 * curve: every frame it closes the same fraction of the distance that is left.
 * A new wheel event only moves the destination, so a run of notches or a
 * trackpad flick reads as a single glide rather than a series of steps.
 *
 * The listener is attached by hand rather than with `onWheel`, because React
 * registers wheel handlers passively at the root and a passive listener cannot
 * call `preventDefault` -- without which the Window scrolls underneath the wall
 * on every gesture.
 */

/** Wall travel per pixel of wheel. A shade over one-to-one: a mouse notch is
 *  ~100px, and moving the wall exactly that and stopping felt stiff. */
const WHEEL_GAIN = 1.2;

/**
 * How quickly the wall catches up with the wheel: the time constant of the
 * ease-out. Each 140ms closes about 63% of what is left -- quick enough that
 * the wall feels attached to the hand, long enough that a trackpad's stream
 * of small deltas arrives as one glide. Frame-rate independent.
 */
const EASE_MS = 140;
/** Below this, in scene units, the wall has arrived and the loop stops. */
const REST = 0.05;

export function useInfiniteScroll(
  layerRef: RefObject<HTMLElement | null>,
  panRef: RefObject<HTMLDivElement | null>,
  tileRefs: RefObject<(HTMLElement | null)[]>,
  slots: Slot[],
  periods: { periodX: number; periodY: number },
  /** `--u` in real pixels. Zero before the first measurement. */
  unit: number,
  active: boolean,
  /**
   * Arrive immediately instead of easing. The glide is motion the reader did
   * not ask for -- the wall carries on after the gesture stops -- so under
   * `prefers-reduced-motion` the scroll lands where it was put.
   */
  reduced: boolean,
) {
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const wraps = useRef<{ x: number; y: number }[]>([]);
  const raf = useRef(0);
  /** True once a touch has travelled far enough to be a drag, not a tap. */
  const dragged = useRef(false);

  const apply = useCallback(() => {
    const pan = panRef.current;
    if (!pan) return;
    const { x: px, y: py } = pos.current;
    pan.style.setProperty("--pan-x", px.toFixed(2));
    pan.style.setProperty("--pan-y", py.toFixed(2));

    slots.forEach((slot, i) => {
      const el = tileRefs.current[i];
      if (!el) return;
      const wx = wrapOffset(slot.x, px, periods.periodX);
      const wy = wrapOffset(slot.y, py, periods.periodY);
      const was = (wraps.current[i] ??= { x: 0, y: 0 });
      // Only the tiles that actually crossed pay for a style write.
      if (was.x !== wx) el.style.setProperty("--wx", (was.x = wx).toFixed(2));
      if (was.y !== wy) el.style.setProperty("--wy", (was.y = wy).toFixed(2));
    });
  }, [periods.periodX, periods.periodY, slots, panRef, tileRefs]);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  /** Ease toward the current target; a no-op if a glide is already running. */
  const glide = useCallback(() => {
    if (reduced) {
      stop();
      pos.current = { ...target.current };
      apply();
      return;
    }
    if (raf.current) return;
    let last = performance.now();
    const tick = (now: number) => {
      const k = 1 - Math.exp(-(now - last) / EASE_MS);
      last = now;
      const dx = target.current.x - pos.current.x;
      const dy = target.current.y - pos.current.y;
      if (Math.abs(dx) < REST && Math.abs(dy) < REST) {
        pos.current = { ...target.current };
        apply();
        raf.current = 0;
        return;
      }
      pos.current = { x: pos.current.x + dx * k, y: pos.current.y + dy * k };
      apply();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [apply, reduced, stop]);

  useEffect(() => {
    const el = layerRef.current;
    if (!el || !active || unit <= 0) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Both axes: a trackpad gives deltaX for free and a mouse wheel gives
      // deltaY, so the wall explores in whichever direction it is pushed.
      target.current = {
        x: target.current.x - (e.deltaX / unit) * WHEEL_GAIN,
        y: target.current.y - (e.deltaY / unit) * WHEEL_GAIN,
      };
      glide();
    };

    // Touch has no wheel, so it keeps a drag -- and only touch does, because a
    // pointer captured on a mouse press retargets the click with it and the
    // pictures stop being links. The finger sets the target and the same ease
    // carries the wall after it.
    let from: { x: number; y: number; px: number; py: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      dragged.current = false;
      from = { x: e.clientX, y: e.clientY, px: target.current.x, py: target.current.y };
    };
    const onMove = (e: PointerEvent) => {
      if (!from) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      if (!dragged.current) {
        if (Math.hypot(dx, dy) <= 6) return;
        dragged.current = true;
        el.setPointerCapture(e.pointerId);
      }
      target.current = { x: from.px + dx / unit, y: from.py + dy / unit };
      glide();
    };
    const onUp = (e: PointerEvent) => {
      from = null;
      if (dragged.current) el.releasePointerCapture?.(e.pointerId);
      // A tick late: `click` follows `pointerup`, and the press that ended a
      // drag must not navigate while the next honest tap still must.
      setTimeout(() => (dragged.current = false), 0);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [active, glide, layerRef, unit]);

  /**
   * Back to the middle, instantly. Called as the gallery opens, while the
   * layer is still transparent, so a wall left three screens sideways last
   * time starts from its centre again and nobody sees it jump.
   */
  const reset = useCallback(() => {
    stop();
    target.current = { x: 0, y: 0 };
    pos.current = { x: 0, y: 0 };
    wraps.current = [];
    panRef.current?.style.setProperty("--pan-x", "0");
    panRef.current?.style.setProperty("--pan-y", "0");
    tileRefs.current.forEach((el) => {
      el?.style.setProperty("--wx", "0");
      el?.style.setProperty("--wy", "0");
    });
  }, [panRef, stop, tileRefs]);

  useEffect(() => stop, [stop]);

  return { dragged, reset };
}
