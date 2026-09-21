"use client";

import Link from "next/link";
import type { CSSProperties, RefObject } from "react";
import type { GalleryTile } from "@/content/gallery";
import { useKitchen } from "@/lib/store";

/**
 * One picture on the globe.
 *
 * A `next/link` rather than a div with a handler, because it IS a link: the
 * middle-click, the copied address and the keyboard all come free, and the
 * route prefetches while the tile is on screen. Every tile points at its own
 * picture inside the study -- `/work/<slug>#media-<name>` -- so a visitor who
 * liked one screen lands on the paragraph that explains it rather than at the
 * top of a long article.
 *
 * A plain <img>, deliberately. These are already the right size: the pool is
 * generated at 300px by scripts/gallery-tiles.mjs precisely so that forty of
 * them cost 224KB, and routing each one through the image optimiser would add
 * forty requests to serve bytes that are already minimal. `loading="lazy"` does
 * nothing useful here either -- every tile is inside the layer's box from the
 * first frame -- so the weight has to be small rather than deferred.
 */
export function GlobeTile({
  tile,
  style,
  elRef,
  dragged,
}: {
  tile: GalleryTile;
  style: CSSProperties;
  elRef: (el: HTMLAnchorElement | null) => void;
  /** Set by the pan while the pointer is down, so a drag never navigates. */
  dragged: RefObject<boolean>;
}) {
  return (
    <Link
      ref={elRef}
      href={tile.href}
      className="globe-tile"
      /*
       * No viewport prefetch. Thirty-three links are all "in view" from the
       * moment the layer mounts -- it is transparent, not unlaid-out -- so the
       * default warmed the RSC payload of every case study on a visit to the
       * kitchen, work nobody asked for on a decoration that may never be
       * opened. It also broke the one thing prefetching is for: the can
       * popover's own hover prefetch became a cache hit that never hit the
       * network, and `case-study.spec.ts` caught it.
       */
      prefetch={false}
      style={style}
      draggable={false}
      onClick={(e) => {
        if (dragged.current) {
          e.preventDefault();
          return;
        }
        // Told on the way out, not on the way in: this page unmounts the moment
        // the route changes, so anything that has to leave has to be told by
        // the click that causes it.
        useKitchen.getState().setLeavingKitchen(true);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- see above. */}
      <img
        src={tile.src}
        alt={tile.alt}
        width={tile.width}
        height={tile.height}
        decoding="async"
        draggable={false}
      />
    </Link>
  );
}
