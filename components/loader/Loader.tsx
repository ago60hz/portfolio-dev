"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useKitchen } from "@/lib/store";
import {
  MAX_MS,
  MIN_MS,
  SHRINK_MS,
  bootAssets,
  claimBoot,
  displayProgress,
  preload,
} from "@/lib/loader";
import { ImageTrail } from "./ImageTrail";
import { LoaderCount } from "./LoaderCount";

/**
 * Measure before paint, or the room is painted once at its resting size and
 * then jumps out to full bleed on the next frame.
 */
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** What it takes to make the Window cover the viewport. */
type Cover = { scale: number; x: number; y: number };

/**
 * The loading animation.
 *
 * Structure follows promo.emotion-agency.com, read off its live stylesheet:
 * a full-bleed plane, a scrolling status list on the left with one line lit, a
 * percentage dead centre, and a narrow decoded column on the right that
 * collapses to one word per line because it is a flex item shrinking to its
 * longest word.
 *
 * It renders INSIDE the Window, and that is the whole trick. The Window itself
 * is scaled up to cover the viewport while loading and animates back down to
 * its resting box when the room opens -- so the kitchen does not fade in, it
 * arrives, shrinking into the frame with the tiled wall and this screen
 * carried along inside it. Nothing here has to keep a second plane in sync
 * with the Window, because there is no second plane.
 *
 * Living inside the Window is also what keeps it off the case studies: they
 * render StudyWindow, not this.
 */
export function Loader() {
  const setBooted = useKitchen((s) => s.setBooted);
  const reduced = usePrefersReducedMotion();
  const box = useRef<HTMLDivElement>(null);

  /**
   * This page load's claim on the boot, made during the first render so that no
   * parent effect can spend it first.
   *
   * BROWSER ONLY, and deliberately not `useState(claimBoot)`.
   *
   * `bootAvailable` is module scope, and on the server module scope is the
   * PROCESS -- one instance shared by every render that server will ever do.
   * The first render consumed the boot and every render after it emitted no
   * loader, while the browser, whose module is one page load old, rendered one.
   * That is a hydration mismatch on every request; on the dev server, which
   * renders per request rather than serving a build-time prerender, it meant no
   * loading screen at all. Production escaped it only because the build's
   * prerender happened to be the render that claimed.
   *
   * So the server always renders the loader and only the browser claims, which
   * is also the honest split: whether this visit has already had its boot is a
   * fact about a browser session, and the server cannot know it.
   *
   * A ref rather than a state initialiser because Strict Mode invokes an
   * initialiser twice and the second call would find the boot already spent.
   * The ref is the same object across both passes of that double render, so the
   * claim is made exactly once per mount.
   */
  /*
   * `react-hooks/refs` objects to reading a ref during render, and is right to
   * in general. This is the one shape React documents as an exception -- lazy
   * initialisation, "if (ref.current === null) ref.current = ..." -- and it is
   * load-bearing here rather than a convenience: a `useState` initialiser is
   * invoked TWICE under Strict Mode, the second call would find the boot
   * already spent, and the loader would vanish in development. That is the
   * exact bug this replaced.
   */
  const claim = useRef<boolean | null>(null);
  if (claim.current === null) claim.current = typeof window === "undefined" ? true : claimBoot();
  // eslint-disable-next-line react-hooks/refs -- the lazy-init read, see above
  const skip = reduced || !claim.current;

  const [percent, setPercent] = useState(0);
  const [cover, setCover] = useState<Cover | null>(null);
  const [gone, setGone] = useState(false);
  const loaded = useRef(0);
  const started = useRef(0);

  /**
   * Derived, not stored.
   *
   * The moment the count reads 100 the loader is on its way out -- there is no
   * separate decision to make, so there is nothing to keep in a state and no
   * effect to keep it in step. An earlier pass held the finished count on
   * screen for a beat so it could be read; Praise would rather not be made to
   * look at it, and he is right, since the number has been counting for five
   * seconds already.
   */
  const leaving = percent >= 100;

  /**
   * Reduced motion gets no loading screen, and neither does a second visit
   * within the same page load.
   *
   * This component IS the animation -- the marquee, the decode, the trail, the
   * Window shrinking into place. Strip those and what is left is a blank panel
   * standing between someone and the page for no reason. The assets still
   * load; the pictures just arrive as they arrive.
   */
  useEffect(() => {
    if (skip) setBooted(true);
  }, [skip, setBooted]);

  // Blow the Window up to cover the viewport, and hold it there while loading.
  useMeasureEffect(() => {
    if (skip) return;
    const stage = box.current?.closest<HTMLElement>(".kitchen-stage");
    // The Window's own rect is no good here: it is what we are about to
    // transform, and getBoundingClientRect reports the transformed box -- so
    // the observer's first callback would re-measure the already-covered
    // Window, compute a scale of about 1, and collapse the cover. The parent
    // is the Window's layout box (the stage is h-full w-full of it) and is
    // never transformed.
    const frame = stage?.parentElement;
    if (!stage || !frame) return;
    const root = document.documentElement;

    const measure = () => {
      const r = frame.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!(r.width > 0) || !(r.height > 0)) return;
      // Cover, not contain: the Window is wider than it is tall relative to
      // the viewport, so fitting by width alone leaves the room's own ground
      // showing above and below.
      const scale = Math.max(vw / r.width, vh / r.height);
      setCover({
        scale,
        x: vw / 2 - (r.left + r.width / 2),
        y: vh / 2 - (r.top + r.height / 2),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => {
      ro.disconnect();
      root.removeAttribute("data-booting");
    };
  }, [skip]);

  // Publish the cover as custom properties. CSS owns the transform itself, so
  // taking `data-booting` off is what runs the shrink -- one declarative state
  // change rather than an imperative animation on an element we do not own.
  useMeasureEffect(() => {
    const root = document.documentElement;
    if (skip || !cover || leaving) {
      root.removeAttribute("data-booting");
      return;
    }
    root.style.setProperty("--boot-scale", String(cover.scale));
    root.style.setProperty("--boot-inv", String(1 / cover.scale));
    root.style.setProperty("--boot-x", `${cover.x}px`);
    root.style.setProperty("--boot-y", `${cover.y}px`);
    root.setAttribute("data-booting", "");
  }, [skip, cover, leaving]);

  // Progress. Two clocks, and the counter shows the slower of them: real
  // assets, and the minimum display time.
  useEffect(() => {
    if (skip) return;
    const srcs = bootAssets();
    started.current = performance.now();

    const stop = preload(srcs, (n) => {
      loaded.current = n;
    });

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - started.current;
      const pct = displayProgress({
        loaded: loaded.current,
        total: srcs.length,
        elapsed,
        minMs: MIN_MS,
      });
      setPercent(elapsed >= MAX_MS ? 100 : pct);
      if (pct < 100 && elapsed < MAX_MS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  }, [skip]);

  /**
   * The room fills in only once the Window has finished shrinking.
   *
   * Overlapping the two looked better on paper and worse in practice: the cans
   * popped in while the frame was still travelling, so they appeared to bleed
   * through the shrinking wall rather than being set down on a shelf. The
   * frame lands first, then the room fills it.
   */
  useEffect(() => {
    if (!leaving) return;
    const settle = setTimeout(() => setBooted(true), SHRINK_MS);
    const off = setTimeout(() => setGone(true), SHRINK_MS + 120);
    return () => {
      clearTimeout(settle);
      clearTimeout(off);
    };
  }, [leaving, setBooted]);

  if (skip || gone) return null;

  return (
    <div
      ref={box}
      data-loader
      data-done={leaving || undefined}
      data-measured={cover ? "" : undefined}
      className="loader font-doto absolute inset-0 z-[70] bg-repeat uppercase"
      style={{
        backgroundImage: "url(/assets/scene/wall-tile.webp)",
        // The Window's own tile size. Inside the Window, --u resolves against
        // the same container the scene uses, so these match without arithmetic
        // -- and because the whole Window scales, they shrink into place with
        // everything else.
        backgroundSize: "var(--wall-tile-size) auto",
        opacity: leaving ? 0 : 1,
        transition: leaving
          ? "opacity var(--duration-drop) var(--ease-accelerate)"
          : "none",
        pointerEvents: leaving ? "none" : undefined,
      }}
    >
      {/* Decoration behind the type, and only while there is something to wait
          for -- a trail chasing the pointer across the handover muddies it. */}
      <ImageTrail active={!leaving} />

      {/*
        Counter-scale. The Window is blown up by --boot-scale, so without this
        every word in here is drawn at that size too. Both transitions share a
        duration and a curve, so the type holds its size while the room shrinks
        around it.
      */}
      <div className="loader-compensate pointer-events-none relative h-full p-5 text-fine">
        <LoaderCount percent={percent} />
      </div>
    </div>
  );
}
