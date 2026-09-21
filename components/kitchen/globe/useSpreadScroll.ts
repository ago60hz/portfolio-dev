"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { wrapOffset, type Slot } from "@/lib/globe";

/**
 * Scrolling the wall, endlessly, in any direction.
 *
 * The wall is ONE set of tiles, not a tiled copy of itself: the container
 * carries the scroll as a single transform, and a tile that has drifted more
 * than half a period from the middle is moved a whole period back. So the DOM
 * never grows, scrolling costs the same at any distance, and the lattice stays
 * exact -- a tile always lands where its neighbour would have been.
 *
 * The wheel moves a TARGET and the wall eases toward it on one continuous
 * curve: every frame it closes the same fraction of the distance that is left.
 * That is an exponential ease-out, and its one property that matters is that it
 * never restarts. A new wheel event only moves the destination, so a run of
 * notches or a trackpad flick reads as a single glide rather than a series of
 * separate moves -- which is exactly what the spring it replaced could not do:
 * retargeted on every notch, it arrived, overshot and settled once per notch,
 * and the wall stepped. No overshoot, no bounce, just the slowing arrival.
 *
 * The listener is attached by hand rather than with `onWheel`, because React
 * registers wheel handlers passively at the root and a passive listener cannot
 * call `preventDefault` -- without which the Window scrolls underneath the wall
 * on every gesture.
 *
 * Two custom properties a frame on ONE element, plus a write on the handful of
 * tiles that actually crossed. That is the whole cost; the resting transforms
 * are static strings CSS owns.
 */

/**
 * How far the wall travels per pixel of wheel.
 *
 * One-to-one is the wrong ratio for a wall you wander rather than a document
 * you read: a mouse notch is about 100px, and moving the pictures exactly 100px
 * and stopping is what made the scroll feel stiff. The gesture asks for a
 * direction and a rough distance; the spring does the travelling.
 */
const WHEEL_GAIN = 1.8;

/**
 * How quickly the wall catches up with the wheel: the time constant of the
 * ease-out. Each 180ms closes about 63% of what is left, so a notch is most of
 * the way there in a third of a second and fully settled a little over half a
 * second later. Frame-rate independent, so a 120Hz screen glides the same.
 */
const EASE_MS = 180;
/** Below this, in scene units, the wall has arrived and the loop stops. */
const REST = 0.05;

export function useSpreadScroll(
  layerRef: RefObject<HTMLElement | null>,
  spinRef: RefObject<HTMLDivElement | null>,
  tileRefs: RefObject<(HTMLElement | null)[]>,
  slots: Slot[],
  periods: { periodX: number; periodY: number },
  /** `--u` in real pixels. Zero before the first measurement. */
  unit: number,
  active: boolean,
  /** Called on every gesture, so the wall knows it is still being looked at. */
  onActivity: () => void,
  /**
   * Arrive immediately instead of easing.
   *
   * The glide IS motion the reader did not ask for -- the wall carries on after
   * the gesture stops. Under
   * `prefers-reduced-motion` the scroll lands where it was put, which is the
   * rule the rest of the kitchen follows: no movement, not less of it.
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
    const spin = spinRef.current;
    if (!spin) return;
    const { x: px, y: py } = pos.current;
    spin.style.setProperty("--pan-x", px.toFixed(2));
    spin.style.setProperty("--pan-y", py.toFixed(2));

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
  }, [periods.periodX, periods.periodY, slots, spinRef, tileRefs]);

  /*
   * `data-moving` is written by hand, not held in React state.
   *
   * It suppresses the tiles' CSS transitions for the duration of a gesture, and
   * a state update lands a render later -- long enough for the first frames of
   * a flick to be interpolated by a 680ms easing and arrive as a lurch. The
   * attribute has to be true on the same tick as the first write.
   */
  const setMoving = useCallback(
    (on: boolean) => layerRef.current?.setAttribute("data-moving", String(on)),
    [layerRef],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  /** Ease toward the current target; a no-op if a glide is already running. */
  const glide = useCallback(() => {
    setMoving(true);
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
        setMoving(false);
        return;
      }
      pos.current = { x: pos.current.x + dx * k, y: pos.current.y + dy * k };
      apply();
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [apply, reduced, setMoving, stop]);

  useEffect(() => {
    const el = layerRef.current;
    if (!el || !active || unit <= 0) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      onActivity();
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
    // pictures stop being links. The finger sets the target and the same
    // ease carries the wall after it.
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
      onActivity();
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
  }, [active, glide, layerRef, onActivity, unit]);

  /**
   * The wall travels back to the middle as the globe re-forms.
   *
   * Everything the wall knows is put back here, and nothing is put back when it
   * OPENS -- that is the whole design of this function. Resetting on the way in
   * meant suppressing transitions on the very frame the throw began, so the
   * pictures snapped onto the wall instead of flying out to it.
   *
   * On the way out it is free. The tiles are flying to the sphere, and the
   * sphere's pose does not read `--wx`/`--wy`, so clearing the wraps moves
   * nothing anyone can see. The scroll itself eases home underneath them --
   * `--pan-x`/`--pan-y` are registered, so CSS interpolates the two numbers on
   * the house curve the way it interpolates the spin -- and a wall left three
   * screens sideways gathers into a centred globe instead of off the edge.
   */
  const home = useCallback(() => {
    stop();
    // Transitions back on BEFORE the zero is written, or the ease home is lost.
    setMoving(false);
    target.current = { x: 0, y: 0 };
    pos.current = { x: 0, y: 0 };
    wraps.current = [];
    spinRef.current?.style.setProperty("--pan-x", "0");
    spinRef.current?.style.setProperty("--pan-y", "0");
    tileRefs.current.forEach((el) => {
      el?.style.setProperty("--wx", "0");
      el?.style.setProperty("--wy", "0");
    });
  }, [setMoving, spinRef, stop, tileRefs]);

  useEffect(() => stop, [stop]);

  return { dragged, home };
}
