"use client";

import Link from "next/link";
import type { CSSProperties, RefObject } from "react";
import type { GalleryTile } from "@/content/gallery";
import type { Patch, Tape } from "@/lib/globe";
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
 * The picture is painted by the strips as a background, not by an <img>. Each
 * strip shows one slice of the same URL, so it is still one request and one
 * decode per tile -- the pool is generated at 640px by scripts/gallery-tiles.mjs
 * precisely so that this costs 291KB in all. The link carries the alt text
 * instead, which is where a screen reader looks for a link's name anyway.
 */
export function GlobeTile({
  tile,
  style,
  elRef,
  dragged,
  patches,
  tape,
}: {
  tile: GalleryTile;
  style: CSSProperties;
  elRef: (el: HTMLAnchorElement | null) => void;
  /** Set by the pan while the pointer is down, so a drag never navigates. */
  dragged: RefObject<boolean>;
  /** The decal, laid out for the current scene unit (see lib/globe). */
  patches: Patch[];
  /** A hero print's strip of tape, as its own little decal. */
  tape?: Tape;
}) {
  return (
    <Link
      ref={elRef}
      href={tile.href}
      className="globe-tile"
      aria-label={tile.alt}
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
      style={
        {
          ...style,
          "--src": `url(${JSON.stringify(tile.src)})`,
        } as CSSProperties
      }
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
      {patches.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="globe-patch"
          data-t={p.edges.t || undefined}
          data-b={p.edges.b || undefined}
          data-l={p.edges.l || undefined}
          data-r={p.edges.r || undefined}
          style={
            {
              left: p.x,
              top: p.y,
              width: p.w,
              height: p.h,
              "--curve": p.curve,
              "--px": `${p.x}px`,
              "--py": `${p.y}px`,
            } as CSSProperties
          }
        />
      ))}
      {tape && (
        <span
          aria-hidden
          className="globe-tape"
          data-tone={tape.tone}
          style={
            {
              left: tape.x,
              top: tape.y,
              width: tape.w,
              height: tape.h,
              "--curve": tape.curve,
              "--flat": tape.flat,
            } as CSSProperties
          }
        />
      )}
    </Link>
  );
}
