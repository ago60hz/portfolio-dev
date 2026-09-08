"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { RadioSlot } from "./RadioSlot";

/**
 * Where the radio actually lives: the layout, so the music survives the trip
 * into a case study.
 *
 * It cannot stay in the wall gallery. The YouTube host is rendered inside the
 * 3D scene's ScreenPanel, so unmounting `Radio3D` destroys the iframe and the
 * track with it -- and moving the node instead would reload the iframe, which
 * is the same thing with extra steps. Mounted once here, it is never unmounted
 * and never reparented; only its box moves.
 *
 * On the kitchen it matches an invisible anchor the gallery draws at the slot
 * the design gives it. On a case study it docks bottom right, which is the
 * visual indicator that something is still playing.
 */

/**
 * The docked box on a case study, in real pixels. Roughly 125:151.
 *
 * Flush to the floor, inset only from the right. The cable is drawn past the
 * bottom of the slot and clipped there, so sitting the box on the Window's
 * bottom edge is what lands the wires on it instead of in mid-air.
 */
const DOCK = { width: 104, height: 126, right: 16, bottom: 0 };

/**
 * The same dock on a phone.
 *
 * 104x126 is a tenth of a 390px screen's width and a seventh of its height, and
 * it sits over the reading column: on a study it covered the body text outright.
 * Two thirds of the size clears the measure while staying big enough to read as
 * a player and to press.
 *
 * Its BOX shrinks -- the element is smaller and R3F is told a smaller size. The
 * radio is never `scale`d, which would make R3F measure the scaled box and
 * apply the ratio twice.
 */
const DOCK_SM = { width: 70, height: 85, right: 8, bottom: 0 };

/** Long enough for the study's own entrance to land before this arrives. */
const RISE_MS = 420;

type Box = { left: number; top: number; width: number; height: number };

export function RadioDock() {
  const pathname = usePathname();
  const onStudy = pathname.startsWith("/work/");
  const ready = useEntranceReady();
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  /*
   * Below lg the wall gallery is not rendered, so there is no
   * `[data-radio-anchor]` to track and the dock would strand itself at its
   * fallback box over the room. It leaves with the gallery.
   *
   * The cost is real and worth stating: no radio means no music on a phone or
   * tablet. The kitchen's own sound is separate and unaffected.
   */
  const narrow = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(max-width: 1023px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 1023px)").matches,
    () => false,
  );
  const host = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [mounted, setMounted] = useState(false);
  /**
   * Which study the dock has finished rising on.
   *
   * Stored as the pathname rather than a boolean so leaving the route resets
   * it by derivation -- no setState in an effect body, and moving between two
   * studies re-runs the rise rather than snapping.
   */
  const [risenFor, setRisenFor] = useState<string | null>(null);
  const risen = onStudy && risenFor === pathname;

  /**
   * Held back until the entrance has finished, once. Mounting the scene costs
   * a one-time main-thread stall -- generated textures, the PMREM environment,
   * shader compilation -- and paying it while ten cans are animating drops
   * frames in the one sequence a visitor sees once. After that it stays.
   */
  useEffect(() => {
    if (!ready || mounted) return;
    const t = setTimeout(() => setMounted(true), RISE_MS);
    return () => clearTimeout(t);
  }, [ready, mounted]);

  /** Rises into the corner a beat after the study has taken over. */
  useEffect(() => {
    if (!onStudy) return;
    const t = setTimeout(() => setRisenFor(pathname), RISE_MS);
    return () => clearTimeout(t);
  }, [onStudy, pathname]);

  /** One measurement of the gallery's anchor, relative to the Window's box. */
  const place = useCallback(() => {
    const anchor = document.querySelector("[data-radio-anchor]");
    const parent = host.current?.parentElement;
    if (!anchor || !parent) return false;
    const a = anchor.getBoundingClientRect();
    const p = parent.getBoundingClientRect();
    setBox({
      left: a.left - p.left,
      top: a.top - p.top,
      width: a.width,
      height: a.height,
    });
    return true;
  }, []);

  /**
   * Track the anchor.
   *
   * The anchor carries no transition of its own, deliberately: it jumps to the
   * destination so this reads a target rather than a frame of an easing, and
   * the dock does the travelling.
   *
   * `revealed` is NOT a dependency. It used to be, and every peek-to-reveal
   * therefore restarted a twenty-pass poll -- twenty renders and twenty forced
   * layouts landing inside the 300ms the transition had to run in, which is a
   * good part of what made the reveal stutter. The ResizeObserver already
   * covers it: the reveal changes the slot's size, not only its position.
   *
   * The poll is for the one thing an observer cannot catch -- arriving back
   * from a study, where the kitchen page has not committed yet and the scene
   * goes on settling for a few frames after it has.
   */
  useEffect(() => {
    if (onStudy) return;
    const parent = host.current?.parentElement;
    if (!parent) return;

    let ro: ResizeObserver | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let tries = 20;

    const settle = () => {
      if (place() && !ro) {
        const anchor = document.querySelector("[data-radio-anchor]")!;
        // The anchor for the reveal, the parent for anything that reflows the
        // room around it.
        ro = new ResizeObserver(place);
        ro.observe(anchor);
        ro.observe(parent);
      }
      if (tries-- > 0) timer = setTimeout(settle, 50);
    };

    // A timer, not requestAnimationFrame. rAF does not fire at all in a hidden
    // tab, so a study opened in a background tab came back to a dock stranded
    // in the corner. In a callback either way: a synchronous setState in the
    // effect body would cascade a render.
    timer = setTimeout(settle, 0);
    window.addEventListener("resize", place);
    return () => {
      clearTimeout(timer);
      ro?.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [onStudy, ready, place]);

  /**
   * The box is SNAPPED and the travel is a transform.
   *
   * Transitioning `width` and `height` meant the radio's box changed size on
   * every frame of a reveal, R3F's ResizeObserver fired on every one of them,
   * and the WebGL drawing buffer was reallocated about eighteen times per
   * open. That was the jank. Position moves on the compositor instead, which
   * costs no layout at all -- and a translation is safe where a scale is not,
   * because R3F only measures the box.
   */
  const dock = isMobile ? DOCK_SM : DOCK;
  const size = {
    width: box?.width ?? dock.width,
    height: box?.height ?? dock.height,
  };
  const anchored = onStudy ? dock : { left: 0, top: 0, ...size };

  if (narrow) return null;

  return (
    <div
      ref={host}
      // z-50 clears the gallery's reveal dim, which is the one thing in the
      // room that paints above the cans.
      className="pointer-events-auto absolute z-50"
      style={{
        ...anchored,
        transform:
          onStudy || !box
            ? "translate3d(0, 0, 0)"
            : `translate3d(${box.left}px, ${box.top}px, 0)`,
        opacity: mounted && (onStudy ? risen : box !== null) ? 1 : 0,
        // Smooth, and the room's own state duration: this is the glide across
        // the gallery, and it has to match the board it is travelling with.
        transition: reduced
          ? "none"
          : "transform var(--duration-max) var(--ease-smooth), opacity var(--duration-enter) var(--ease-smooth)",
      }}
    >
      {/*
        The rise is a second element because it wants a different curve, and
        one element has only one transform. Overshoot belongs on a 24px delta
        -- put it on the glide above and a 200px travel across the gallery
        would sail 1.68 times past the slot before coming back.
      */}
      <div
        className="h-full w-full"
        style={{
          transform:
            onStudy && !risen
              ? "translate3d(0, 24px, 0)"
              : "translate3d(0, 0, 0)",
          transition: reduced
            ? "none"
            : "transform var(--duration-settle) var(--ease-overshoot)",
        }}
      >
        {mounted && <RadioSlot width={size.width} height={size.height} />}
      </div>
    </div>
  );
}
