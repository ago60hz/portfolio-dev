"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GALLERY_TILES } from "@/content/gallery";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useSceneUnit } from "@/hooks/useSceneUnit";
import { TILE_W, collagePoses, decal, layoutSpread, tapeFor, tileTransforms } from "@/lib/globe";
import { DURATION, bootDelay } from "@/lib/motion";
import { useKitchen } from "@/lib/store";
import { GlobeTile } from "./GlobeTile";
import { useSpreadScroll } from "./useSpreadScroll";

/** 45s a turn. Measured off the reference, where a tile crosses the near face
 *  at about 7.5 degrees a second -- slow enough to read a screenshot on. */
const DEG_PER_MS = 360 / 45_000;

/**
 * How long a pointer has to rest on the globe before the wall opens.
 *
 * The same 120ms the contact menu waits, for the same reason: short enough to
 * feel like the wall was already there, long enough that a pointer crossing the
 * Window on its way somewhere else does not throw it open.
 */
const HOVER_MS = 120;

/** How long the wall waits, untouched, before it gathers itself back up. */
const IDLE_MS = 4000;

/**
 * And how long hover is ignored after it has.
 *
 * Without it the wall is a trap: the tiles collapse out from under a pointer
 * that never moved, the sphere arrives beneath it, and the next mouse event
 * re-opens the thing that just closed.
 */
const COOLDOWN_MS = 700;

/**
 * How long after the room lands before the pictures are fetched.
 *
 * `booted` is not late enough on its own. The entrance is a staggered run that
 * goes on for another beat table's worth of time after the handover, and
 * twenty-two image requests landing in the middle of it are twenty-two
 * requests competing with the cans for the connection they arrive on. Read off
 * the beat table rather than guessed, so retiming the entrance retimes this
 * with it.
 */
const AFTER_ENTRANCE_MS = (bootDelay("galleryArt") + DURATION.enter) * 1000;

/**
 * The Window's second view (458:1830 on).
 *
 * Every curated case-study still at once, clumped into a slowly turning sphere
 * and thrown out into an endless wall when it is looked at -- the two halves of
 * the reference recording, in that order.
 *
 * The globe is where it rests. HOVER opens the wall, as the reference plays it;
 * the wall is then scrolled in any direction, and four seconds of stillness
 * gathers it back up on its own. Escape steps back a level, and a tap does the
 * hover's job where hover does not exist.
 *
 * No WebGL. Twenty-odd <img> on `preserve-3d` cost a composited layer each and
 * nothing else -- no context, no shader compilation, and no second rAF loop
 * competing with the radio for frames. The clump and the throw are a CSS
 * transition between two static transform strings (see lib/globe.ts for why the
 * two must match), so the only per-frame work in the feature is the spin, and
 * the scroll spring while a gesture is actually in flight.
 */
export function GlobeGallery() {
  const open = useKitchen((s) => s.globeOpen);
  const setOpen = useKitchen((s) => s.setGlobeOpen);
  const reduced = usePrefersReducedMotion();
  const booted = useEntranceReady();
  const [armed, setArmed] = useState(false);

  const [mode, setMode] = useState<"globe" | "grid">("grid");
  const [wasOpen, setWasOpen] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const angle = useRef(0);

  const unit = useSceneUnit(rulerRef, 100);

  /*
   * The scene unit to a fraction of a pixel, for the decals.
   *
   * useSceneUnit reads a whole-pixel offsetWidth, which is fine for a scroll
   * and 1% out for a matrix -- enough to open a seam between patches laid out
   * in --u and transforms computed in pixels. A ruler a thousand units long,
   * read through borderBoxSize (fractional, and blind to the boot's scale),
   * is good to a thousandth.
   */
  const fineRef = useRef<HTMLSpanElement>(null);
  const [px, setPx] = useState(0);
  useEffect(() => {
    const el = fineRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.borderBoxSize?.[0]?.inlineSize ?? el.offsetWidth;
      setPx(w / 1000);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { slots, periodX, periodY, tiles } = useMemo(() => {
    const aspects = GALLERY_TILES.map((t) => t.width / t.height);
    const spread = layoutSpread(aspects);
    const poses = collagePoses(aspects);
    const reach = Math.max(...spread.slots.map((s) => Math.hypot(s.x, s.y)), 1);
    return {
      ...spread,
      tiles: GALLERY_TILES.map((tile, i) => ({
        tile,
        slot: spread.slots[i],
        pose: poses[i],
        aspect: aspects[i],
        ...tileTransforms(poses[i], spread.slots[i]),
        // A radial beat: the middle of the spread leaves first and the corners
        // follow it in. Capped at two beats, because the reference dissolves
        // the whole grid inside a fifth of the travel -- any longer and the
        // edges read as a second, separate animation.
        delay: (Math.hypot(spread.slots[i].x, spread.slots[i].y) / reach) * 110,
      })),
    };
  }, []);

  // The decals, in pixels: recomputed only when the scene unit moves, which
  // is a resize and nothing else.
  const decals = useMemo(() => {
    if (!px) return null;
    let heroes = 0;
    return tiles.map(({ pose, aspect }) => ({
      w: TILE_W * pose.layout * px,
      h: (TILE_W / aspect) * pose.layout * px,
      patches: decal(pose, aspect, px),
      tape: pose.hero ? tapeFor(pose, aspect, px, heroes++) : undefined,
    }));
  }, [px, tiles]);

  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coldUntil = useRef(0);

  /*
   * The wall is on a dead-man's switch.
   *
   * Every gesture inside it pushes the timer out; four seconds of nothing and
   * the pictures gather back into the globe. That is what keeps the kitchen's
   * resting state the kitchen's resting state -- a wall left open behind a
   * visitor who wandered off is a different homepage from the one they landed
   * on.
   */
  const lastAwake = useRef(0);
  const keepAwake = useCallback(() => {
    // Throttled, because a pointer crossing the wall fires this sixty times a
    // second and the work is only ever "start the four seconds again".
    const now = performance.now();
    if (now - lastAwake.current < 250 && idle.current) return;
    lastAwake.current = now;
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => {
      coldUntil.current = performance.now() + COOLDOWN_MS;
      setMode("globe");
    }, IDLE_MS);
  }, []);

  const scroll = useSpreadScroll(
    layerRef,
    spinRef,
    tileRefs,
    slots,
    { periodX, periodY },
    unit,
    open && mode === "grid",
    keepAwake,
    reduced,
  );

  /*
   * Opening always starts from the spread and clumps, which is the reference's
   * first half. Closing runs it backwards under the cross-fade, so the tiles
   * are already back at their slots the next time it opens -- and the pose has
   * to be put back DURING the render that closes it, not in an effect, or the
   * frame that reopens the gallery paints a sphere that is already assembled
   * and the clump is skipped. This is React's own "adjust state when a prop
   * changes" shape: it re-renders before anything is committed to the screen.
   */
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setMode("grid");
  }

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setMode("globe"));
    return () => cancelAnimationFrame(id);
  }, [open]);

  /*
   * The wall's clock runs only while the wall is actually up.
   *
   * Gated on `open` as well as the pose, and that gate is load-bearing. The
   * layer sits in its wall pose while the gallery is CLOSED -- that is the pose
   * the clump starts from -- so without it the four-second timer ran on an
   * invisible wall, flipped the pose to the globe behind the visitor's back,
   * and the first time they opened the gallery there was nothing left to clump
   * from: the sphere just faded in, already assembled.
   *
   * Every time the wall is left, the scroll goes home with it. The scroll is a
   * gesture, not a position; coming back to a wall still three screens
   * sideways loses the picture the visitor was reaching for anyway.
   */
  const homeScroll = scroll.home;
  useEffect(() => {
    if (!open || mode !== "grid") {
      if (idle.current) clearTimeout(idle.current);
      homeScroll();
      return;
    }
    keepAwake();
    return () => void (idle.current && clearTimeout(idle.current));
  }, [homeScroll, keepAwake, mode, open]);

  // The spin, and the only per-frame work in the feature: one custom property
  // on one element. It stops dead outside the globe, so the spread and the
  // closed gallery cost nothing at all.
  useEffect(() => {
    const spin = spinRef.current;
    if (!spin || !open || mode !== "globe" || reduced) {
      // Hand the throw the NEAREST whole turn to land on, so the sphere opens
      // out into the pose it is already in. Rounding UP instead sends it
      // through as much as a full extra revolution on the way, which reads as
      // a whip; rounding takes the shorter path and is never more than half a
      // turn, usually far less. See the note in globals.css for why the angle
      // is what animates and not the transform.
      spin?.style.setProperty(
        "--spin",
        `${Math.round(angle.current / 360) * 360}deg`,
      );
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      angle.current += (now - last) * DEG_PER_MS;
      last = now;
      spin.style.setProperty("--spin", `${angle.current.toFixed(2)}deg`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, open, reduced]);

  /*
   * The pictures are fetched once the room has landed AND finished arriving.
   *
   * Twenty-two thumbnails is 291KB -- small, but it is 291KB nobody asked for,
   * and in flight during the entrance it is 291KB competing with the cans.
   * Waiting out the beat table and then asking for idle time puts them after
   * the kitchen is usable and still long before anyone pulls the tag. The
   * fallback covers Safari, which has no requestIdleCallback.
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

  // Escape steps back one level rather than closing outright: the spread came
  // from the globe, so that is where it returns to.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mode === "grid") setMode("globe");
      else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, open, setOpen]);

  return (
    <div
      ref={layerRef}
      className="globe-layer"
      data-open={open}
      data-mode={mode}
      aria-label="Gallery of interface work"
      /*
       * Hover on the globe is what throws the wall open, as the reference
       * plays it -- on a picture, not on the layer, so crossing the empty
       * corners of the Window leaves the sphere alone.
       *
       * `pointerover` and not `pointerenter`: the tiles are siblings, so
       * sliding from one to the next would otherwise leave and re-enter and
       * restart the dwell every few pixels.
       */
      onPointerOver={(e) => {
        if (mode !== "globe" || e.pointerType !== "mouse") return;
        if (performance.now() < coldUntil.current) return;
        if (!(e.target as Element).closest(".globe-tile")) return;
        if (dwell.current) clearTimeout(dwell.current);
        dwell.current = setTimeout(() => setMode("grid"), HOVER_MS);
      }}
      // Leaving before the dwell is up cancels it, which is the other half of
      // "a pointer on its way somewhere else must not open the wall".
      onPointerOut={() => dwell.current && clearTimeout(dwell.current)}
      // Looking counts. Someone reading their way across the wall without
      // scrolling is still using it, and having it fold up under a stationary
      // gaze is the whole failure this timer has to avoid.
      onPointerMove={() => mode === "grid" && keepAwake()}
      // Touch has no hover, so a tap on the ground does the same job. On a
      // pointer device it is a second way in rather than the only one.
      onClick={(e) => {
        if (scroll.dragged.current) return;
        if ((e.target as Element).closest(".globe-tile")) return;
        setMode(mode === "globe" ? "grid" : "globe");
      }}
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
      <span
        ref={fineRef}
        aria-hidden
        className="pointer-events-none absolute h-0 w-[calc(1000*var(--u))]"
      />

      <div ref={spinRef} className="globe-spin">
        {(armed || open) &&
          decals &&
          tiles.map(({ tile, globe, grid, delay }, i) => (
            <GlobeTile
              key={tile.key}
              tile={tile}
              dragged={scroll.dragged}
              patches={decals[i].patches}
              tape={decals[i].tape}
              elRef={(el) => void (tileRefs.current[i] = el)}
              style={
                {
                  // Laid out at the larger of its ball and wall sizes; each
                  // pose scales it down to the other (see tileTransforms).
                  // In pixels, the same ones the decal's matrices are in.
                  "--tw": `${decals[i].w.toFixed(2)}px`,
                  "--th": `${decals[i].h.toFixed(2)}px`,
                  "--t-globe": globe,
                  "--t-grid": grid,
                  "--tile-delay": `${delay.toFixed(0)}ms`,
                } as React.CSSProperties
              }
            />
          ))}
      </div>
    </div>
  );
}
