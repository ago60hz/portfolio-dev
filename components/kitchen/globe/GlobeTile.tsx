"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode, RefObject } from "react";
import type { GalleryTile } from "@/content/gallery";
import { ROWS, STRIPS } from "@/lib/globe";
import { useKitchen } from "@/lib/store";

/**
 * One side of a row's hinge chain, built from the centre outward.
 *
 * Nested, not siblings, and that is the whole mechanism: each strip is hinged
 * to the one inside it, so turning every hinge by the same small angle bends
 * the picture into an arc with no per-strip trigonometry anywhere. A strip's
 * transform is relative to its parent's, the parent's to ITS parent's, and the
 * curve accumulates on its own -- flat when the angle is zero, wrapped round
 * the sphere when it is a whole step.
 *
 * `k` is the strip's column in the picture, which is all its face needs to
 * show the right slice.
 */
function chain(side: "l" | "r"): ReactNode {
  const half = STRIPS / 2;
  const ks =
    side === "r"
      ? Array.from({ length: half }, (_, i) => half + i)
      : Array.from({ length: half }, (_, i) => half - 1 - i);
  return ks.reduceRight<ReactNode>(
    (inner, k, depth) => (
      <span
        className="globe-arc"
        data-side={side}
        data-root={depth === 0 || undefined}
        data-end={depth === ks.length - 1 || undefined}
        style={{ "--k": k } as CSSProperties}
      >
        {inner}
      </span>
    ),
    null,
  );
}

/**
 * One half of a print's row chain, from the middle crease outward. `kv` is
 * the row's place in the picture from the top, which its strips need to show
 * the right band of it.
 */
function rows(side: "t" | "b"): ReactNode {
  const half = ROWS / 2;
  const kvs =
    side === "b"
      ? Array.from({ length: half }, (_, i) => half + i)
      : Array.from({ length: half }, (_, i) => half - 1 - i);
  return kvs.reduceRight<ReactNode>(
    (inner, kv, depth) => (
      <span
        className="globe-row"
        data-v={side}
        data-end={depth === kvs.length - 1 || undefined}
        style={{ "--kv": kv } as CSSProperties}
      >
        {chain("l")}
        {chain("r")}
        {inner}
      </span>
    ),
    null,
  );
}

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
 * decode per tile -- the pool is generated at 480px by scripts/gallery-tiles.mjs
 * precisely so that this costs 175KB in all. The link carries the alt text
 * instead, which is where a screen reader looks for a link's name anyway.
 */
export function GlobeTile({
  tile,
  style,
  elRef,
  dragged,
  hero = false,
}: {
  tile: GalleryTile;
  style: CSSProperties;
  elRef: (el: HTMLAnchorElement | null) => void;
  /** Set by the pan while the pointer is down, so a drag never navigates. */
  dragged: RefObject<boolean>;
  /** Taped down: one of the few prints the collage is built around. */
  hero?: boolean;
}) {
  return (
    <Link
      ref={elRef}
      href={tile.href}
      className="globe-tile"
      data-hero={hero || undefined}
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
          "--strips": STRIPS,
          "--rows": ROWS,
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
      {/* The rows: a second hinge chain, running up and down from a crease
          across the middle, each row carrying its own pair of strip chains.
          The rows curve the print top to bottom and the strips side to side,
          so it lies on the ball in both directions instead of standing proud
          of it at its top and bottom edges -- which is where neighbouring
          prints used to cut through it. */}
      {rows("t")}
      {rows("b")}
    </Link>
  );
}
