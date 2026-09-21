"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useState } from "react";
import { preload } from "react-dom";
import type { Work } from "@/content/works";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { useIsMobile } from "@/hooks/useIsMobile";

/** The hero's `sizes`, shared by the render and the preload so they ask for the
 *  same file -- a preload for a different width is a wasted request. */
const HERO_SIZES = "100vw";

/**
 * The hero, which fades up rather than popping in.
 *
 * With the preload below it is almost always already decoded when the sheet
 * opens, so it is simply there -- the `complete` check on mount is what stops
 * a cached picture fading in every single time the sheet is raised. On a first
 * visit over a slow connection it sits on the paper ground and arrives on the
 * house `enter` beat instead of snapping in halfway through the sheet's rise.
 */
export function SheetHero({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      ref={(img) => {
        if (img?.complete && img.naturalWidth > 0) setLoaded(true);
      }}
      src={src}
      alt={alt}
      fill
      sizes={HERO_SIZES}
      onLoad={() => setLoaded(true)}
      className="select-none object-cover transition-opacity duration-(--duration-enter) ease-(--ease-slow-down) motion-reduce:transition-none"
      style={{ opacity: loaded ? 1 : 0 }}
    />
  );
}

/**
 * Fetch a sheet's pictures before anyone asks for them.
 *
 * The sheet only mounts its content when it opens, so left alone its hero is
 * requested at the moment of the tap and lands visibly after the sheet has
 * risen. This asks for the exact files it will render -- `getImageProps`
 * resolves the same srcset and sizes the <Image> would -- once the room has
 * finished arriving, at low priority, and only on the screens that use sheets
 * at all. Nine heroes from 534px sources is under 300KB, and they are the
 * pictures a phone visitor taps on first.
 */
export function usePreloadSheetArt(work: Work | null) {
  const booted = useEntranceReady();
  const isPhone = useIsMobile();

  useEffect(() => {
    if (!booted || !isPhone || !work) return;
    const warm = () => {
      const hero = getImageProps({ src: work.image, alt: "", fill: true, sizes: HERO_SIZES }).props;
      const mark = getImageProps({ src: work.mark, alt: "", width: 64, height: 64 }).props;
      for (const img of [hero, mark]) {
        preload(img.src, {
          as: "image",
          imageSrcSet: img.srcSet,
          imageSizes: img.sizes,
          fetchPriority: "low",
        });
      }
    };
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : null;
    const id = idle ? idle(warm, { timeout: 4000 }) : window.setTimeout(warm, 1500);
    return () => {
      if (idle) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [booted, isPhone, work]);
}
