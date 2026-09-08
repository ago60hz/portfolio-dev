"use client";

import { useCallback } from "react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const SRC = "/assets/scene/kitchen-loop.mp4";
const POSTER = "/assets/scene/kitchen-loop-poster.webp";

/**
 * The film behind the tiled wall (1:192, "Video").
 *
 * Figma draws it as a frame filling the whole 1077 x 884 Window, its fill set
 * to `scaleMode: FILL` and the frame composited in OVERLAY. So it is treated
 * here as part of the wall rather than as content: silent, unattended,
 * unreachable, and behind every other thing in the room.
 *
 * `z-0` is what puts it there. It has to be ABOVE `.kitchen-scene`'s own
 * background, which is the tile it blends with, and BELOW everything else --
 * and it is, because every sibling that follows is either positioned (the
 * header at z-40, each shelf `relative`, the gallery) or paints later in tree
 * order at the same level.
 *
 * OVERLAY blends against whatever sits under it in the nearest stacking
 * context, so `.kitchen-scene` carries `isolate`. Without it the blend reaches
 * past the scene and tints the Window's paper ground and its border along with
 * the wall.
 *
 * Opacity is 0.5 per the brief. Note the Figma fill reads 0.4 -- flagged
 * rather than silently followed, since the brief is the newer instruction.
 *
 * DARKEN is a filter rather than a second black layer over the top, and the
 * order is why it works: CSS applies `filter` to the element itself, and only
 * then does `mix-blend-mode` composite the result against the wall. So the
 * footage is darkened first and the darker footage is what gets blended --
 * which is what "darken the video" means. A black overlay above it would
 * instead darken the blend's OUTPUT, muddying the tile along with the film,
 * and would cost an extra composited layer per frame.
 */
const DARKEN = "brightness(0.8)";

export function BackgroundVideo() {
  const reduced = usePrefersReducedMotion();
  /*
   * Nothing at all until the room has been handed over.
   *
   * The loader covers the entire viewport for the length of the boot, so for
   * those seconds this is a film playing behind a wall nobody can see through
   * -- while competing for the connection and the main thread with the images
   * the loader's progress is actually waiting on. Mounting it after `booted`
   * costs the visitor nothing they can perceive on a half-opacity background
   * loop, and gives the entrance the machine to itself.
   *
   * `useEntranceReady` is also true on a case study, where the loader never
   * runs -- but this component only exists inside the kitchen Window, so that
   * branch never applies here.
   */
  const ready = useEntranceReady();

  /**
   * React sets `muted` as a DOM property but does not always emit it as an
   * attribute in the server HTML, and Chrome decides whether an autoplay is
   * allowed from the attribute at parse time. So it is forced here, before the
   * play attempt, rather than trusted to the prop alone.
   *
   * The `play()` rejection is swallowed on purpose: a browser that refuses to
   * autoplay is exercising a policy we are not entitled to argue with, and the
   * poster underneath is already a complete picture.
   */
  const start = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, []);

  /*
   * AFTER every hook, not before.
   *
   * Returning early above `useCallback` changed the hook count between the
   * render where `ready` was false and the one where it was true -- React
   * error #310, which took the whole kitchen down with it rather than just
   * this element. Every hook runs unconditionally; only the output is
   * conditional.
   */
  if (!ready) return null;

  /**
   * Reduced motion gets the still, not a slower loop -- the same answer the
   * hearth gives. It is the poster frame the video would have shown anyway, so
   * the room looks composed rather than missing a layer.
   */
  if (reduced) {
    return (
      <div
        aria-hidden
        data-bg-film
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${POSTER})`,
          filter: DARKEN,
          mixBlendMode: "overlay",
          opacity: 0.5,
        }}
      />
    );
  }

  return (
    <video
      ref={start}
      // Not a `<track>`-bearing, captioned piece of media: it carries no
      // information, so it is hidden from assistive tech entirely rather than
      // described. Silent by construction -- `muted`, no controls, and nothing
      // can reach it to change that.
      aria-hidden
      data-bg-film
      tabIndex={-1}
      src={SRC}
      poster={POSTER}
      autoPlay
      muted
      loop
      // Without this iOS takes an autoplaying video fullscreen instead of
      // leaving it in the layout.
      playsInline
      /*
       * `metadata`, not `auto`. The loader's progress is real -- it waits on
       * the room's images -- and a 850KB film fetched at full tilt alongside
       * them competes for the same connection during the one window where
       * every byte is being counted. Under a loaded machine that was enough to
       * leave cans still arriving after the boot had handed over.
       *
       * The poster is 27KB and paints immediately, so the wall is never bare;
       * the film starts a moment later, which nobody can perceive on a
       * background loop at half opacity.
       */
      preload="metadata"
      disablePictureInPicture
      className="pointer-events-none absolute inset-0 z-0 size-full object-cover"
      style={{ filter: DARKEN, mixBlendMode: "overlay", opacity: 0.5 }}
    />
  );
}
