"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ACCELERATE, DURATION, SLOW_DOWN } from "@/lib/motion";

type Item = {
  src: "chili" | "tomato" | "onion";
  /** All four are Figma pixels off the row's top-left, fed straight to --u. */
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  flipY?: boolean;
};

/**
 * Chillies, tomatoes and onions resting in the shelf.
 *
 * Positions are lifted verbatim from the handoff rows (1:224 / 1:289 / 1:329)
 * rather than invented, so the composition matches the design at every width --
 * expressing them in --u is what makes fixed coordinates responsive.
 *
 * Several sit at negative x or past 1077: they are meant to be clipped by the
 * Window edge, which is why the stage keeps `overflow: hidden`.
 *
 * They render at z-10, behind both the plank and the glass lip, so their feet
 * are hidden and they read as resting *in* the shelf. `data-garnish` is the
 * hook the Phase 4 slash game hit-tests against.
 *
 * Each one pops under the pointer. That is partly the brief's "slight scale up
 * with an overshoot motion", and partly groundwork: the game needs these to
 * already feel like objects a visitor can hit, so the affordance arrives
 * before the mechanic does. The container stays pointer-events-none and the
 * items opt back in, so the empty space between them never swallows a click
 * meant for a can.
 *
 * Clicking one cuts it. The piece falls out of the shelf and is not replaced --
 * the composition is the handoff's, so a garnish that respawned would either
 * pop back into a spot the visitor just cleared or drift the arrangement away
 * from the design. What is cut stays cut for the life of the page.
 */
/**
 * A chilli's box, sized from the artwork rather than typed.
 *
 * The replacement chilli is 203x113 -- 1.80 wide-to-tall, where the old one
 * was 2.07 and the boxes below were written for it. `object-contain` fits by
 * the tighter axis, so a 1.80 image in a 2.11 box (112x53) was fitted by WIDTH
 * and stood 62u tall inside a 53u box, overflowing ~5u top and bottom. The
 * bottom overflow is the tip that hung below the shelf plank: the box ended
 * where the plank could still hide it, the ART did not.
 *
 * Deriving the height from the ratio keeps the drawing inside the box, which
 * is what every y below is measured against.
 */
const CHILLI_RATIO = 203 / 113;
const chilli = (w: number) => ({ w, h: Number((w / CHILLI_RATIO).toFixed(2)) });

/**
 * What a tomato actually measures on screen, and what the chillies are sized
 * against.
 *
 * Not its box width. tomato.webp is 165x123 with the fruit occupying 126x95 of
 * it -- 20px of transparent padding either side -- and `object-contain` fits
 * that by HEIGHT into the 73x48 box, so the drawing lands 64.4u wide and the
 * visible fruit is
 *
 *   48 * (126 / 123) = 49.17u
 *
 * across. The 73 is the box; the box was never the drawing.
 *
 * chili.webp has no padding at all -- its ink is the full 203x113 -- and the
 * helper above builds a box at exactly the artwork's ratio, so a chilli's box
 * width IS its visual width, with nothing subtracted. That is the entire
 * discrepancy: the old `chilli(88)` drew 88u of chilli next to 49u of tomato,
 * and read as nearly twice the vegetable.
 *
 * Measured off the files rather than eyeballed, so re-exporting either one with
 * different padding is a number that moves here rather than a drift nobody
 * catches.
 */
const TOMATO_VISUAL_W = Number((48 * (126 / 123)).toFixed(2));

/**
 * Every chilli, at the tomato's width.
 *
 * The composition carried two chilli sizes, 88 and 106, a fifth apart. Both are
 * this now: the ask was parity with the tomato, and a chilli 20% over it still
 * read as the bigger vegetable, which is the thing being fixed. To put the
 * variation back, give the four `CHILLI_W_LG` sites their own constant at
 * `TOMATO_VISUAL_W * (106 / 88)` -- the seating below derives from the height,
 * so nothing else has to move.
 */
const CHILLI_W = TOMATO_VISUAL_W;
const CHILLI_W_LG = CHILLI_W;

/**
 * Garnishes rest ON the shelf floor: their box bottom lands just inside the
 * plank (which runs 223u to 231u of a 230u row at z-20) so the last few units
 * are swallowed and they read as sitting in the shelf rather than on it. The
 * tomato and onion already did this -- the chilli's box bottom was at 237.
 *
 * A chilli lying at ~173 degrees also sweeps its bounding box a little lower
 * than its height, so the rotated ones start correspondingly higher.
 */
const RESTS = 227;
const chilliY = (h: number, rotated = false) => Number((RESTS - h - (rotated ? 4 : 0)).toFixed(2));

const ROWS: Item[][] = [
  [
    { src: "tomato", x: -25, y: 179, w: 73, h: 48 },
    { src: "chili", x: 303, y: chilliY(chilli(CHILLI_W).h, true), ...chilli(CHILLI_W), rotate: -172.89, flipY: true },
    { src: "onion", x: 700.98, y: 177.33, w: 52.976, h: 49.153 },
    { src: "chili", x: 925.01, y: chilliY(chilli(CHILLI_W_LG).h, true), ...chilli(CHILLI_W_LG), rotate: -171.18, flipY: true },
  ],
  [
    { src: "tomato", x: 325, y: 177, w: 73, h: 48 },
    { src: "chili", x: 660, y: chilliY(chilli(CHILLI_W).h), ...chilli(CHILLI_W) },
    { src: "tomato", x: 1029.19, y: 177.59, w: 73, h: 48 },
  ],
  [
    { src: "chili", x: -43, y: chilliY(chilli(CHILLI_W).h), ...chilli(CHILLI_W) },
    { src: "onion", x: 337, y: 167, w: 64, h: 60, rotate: 180, flipY: true },
    { src: "tomato", x: 683.88, y: 179.29, w: 73, h: 48 },
    { src: "chili", x: 949, y: chilliY(chilli(CHILLI_W).h), ...chilli(CHILLI_W) },
    { src: "onion", x: 1029, y: 171, w: 64, h: 60 },
  ],
];

/**
 * The same shelves on the phone frame, which is 600 units wide rather than
 * 1077.
 *
 * A separate table, not the desktop one scaled: scaling x by 600/1077 would
 * pull every garnish inward while its own width stayed 178u-relative, so they
 * would crowd the cans and lose the spacing that makes them read as scattered.
 * These are placed against the two-can grid instead -- one at each edge to be
 * cut by the Window, one in the gap the two cans leave between them (231u to
 * 369u), which is the only clear ground on a two-column shelf.
 *
 * Five shelves cycle through three rows, so rows repeat from the fourth down.
 * That is what the desktop table does too, and at a shelf's distance the
 * repeat does not read.
 */
const MOBILE_ROWS: Item[][] = [
  [
    { src: "tomato", x: -20, y: 179, w: 73, h: 48 },
    { src: "chili", x: 252, y: chilliY(chilli(CHILLI_W).h, true), ...chilli(CHILLI_W), rotate: -172.89, flipY: true },
    { src: "onion", x: 556, y: 177.33, w: 52.976, h: 49.153 },
  ],
  [
    { src: "chili", x: -35, y: chilliY(chilli(CHILLI_W).h), ...chilli(CHILLI_W) },
    { src: "tomato", x: 262, y: 177, w: 73, h: 48 },
    { src: "chili", x: 545, y: chilliY(chilli(CHILLI_W_LG).h, true), ...chilli(CHILLI_W_LG), rotate: -171.18, flipY: true },
  ],
  [
    { src: "onion", x: -12, y: 167, w: 64, h: 60, rotate: 180, flipY: true },
    { src: "tomato", x: 268, y: 179.29, w: 73, h: 48 },
    { src: "chili", x: 540, y: chilliY(chilli(CHILLI_W).h), ...chilli(CHILLI_W) },
  ],
];

const u = (n: number) => `calc(${n} * var(--u))`;

/**
 * Three knife cuts, and where each piece goes.
 *
 * The clip paths lean a few percent off vertical and meet edge to edge, so the
 * three shapes tile the artwork exactly: no sliver of the original is left
 * behind between them, and no piece overlaps its neighbour. They are applied in
 * the artwork's own space -- inside the rotation and the flip -- so a chilli
 * lying at -172 degrees is cut across its body rather than across the screen.
 *
 * `x` and `rotate` are the tumble, and they run left-to-right and
 * anticlockwise-to-clockwise: the outside pieces are thrown wide, the middle
 * one mostly just drops. Percentages, not units, so the whole thing scales with
 * the Window like everything else here.
 */
const PIECES = [
  { clip: "polygon(0% 0%, 34% 0%, 27% 100%, 0% 100%)", x: -24, rotate: -34 },
  { clip: "polygon(34% 0%, 69% 0%, 62% 100%, 27% 100%)", x: 2, rotate: 8 },
  { clip: "polygon(69% 0%, 100% 0%, 100% 100%, 62% 100%)", x: 22, rotate: 40 },
];

/**
 * How far a piece falls, as a multiple of its own height.
 *
 * Relative rather than absolute because the garnishes are 48-60u tall and the
 * Window scales: 260% clears the shelf below at every width. The stage's own
 * `overflow: hidden` takes whatever is still visible at the end, and the fade
 * lands before that so nothing is seen being clipped.
 */
const FALL = "260%";

export function Garnish({
  shelfIndex,
  columns,
}: {
  shelfIndex: number;
  /** Which frame to place against -- see MOBILE_ROWS. */
  columns: number;
}) {
  /*
   * Nothing on a phone. At that size the garnishes crowd two cans rather than
   * dressing a room of nine, and the shelf reads cleaner without them. Tablet
   * keeps them -- it has the width to carry them -- which is also why the
   * chilli seating below still matters.
   */
  const isPhone = useIsMobile();
  const rows = columns < 3 ? MOBILE_ROWS : ROWS;
  const items = rows[shelfIndex % rows.length];
  /** Cut, and then cut and finished falling. Absent means whole. */
  const [cut, setCut] = useState<Record<string, "falling" | "gone">>({});
  const reduced = usePrefersReducedMotion();

  // Every hook first: this returns conditionally, and React counts hooks.
  if (isPhone) return null;

  /** Where an item sits in the row, unrotated -- see the note on the fall. */
  const slot = (it: Item) => ({
    position: "absolute" as const,
    left: u(it.x),
    top: u(it.y),
    width: u(it.w),
    height: u(it.h),
  });
  const artTransform = (it: Item) =>
    `rotate(${it.rotate ?? 0}deg) scaleY(${it.flipY ? -1 : 1})`;
  const SHADOW = "drop-shadow(-2px 3px 4px rgba(0,0,0,0.25))";

  const falling = items.filter((_, i) => cut[`${items[i].src}-${i}`] === "falling");

  return (
    <>
      {/* Resting: z-10, behind the plank and the lip, so their feet are hidden
          and they read as sitting *in* the shelf. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
        {items.map((it, i) => {
          const key = `${it.src}-${i}`;
          if (cut[key]) return null;
          return (
            <Image
              key={key}
              src={`/assets/garnishes/${it.src}.webp`}
              alt=""
              width={203}
              height={98}
              data-garnish={it.src}
              // Cut on the way down, not on click: the knife should land with
              // the press, and waiting for the release makes it feel a beat
              // late. Under reduced motion the piece is simply taken away -- a
              // fall shortened to nothing is worse than no fall at all.
              onPointerDown={() =>
                setCut((c) => ({ ...c, [key]: reduced ? "gone" : "falling" }))
              }
              style={{
                ...slot(it),
                transform: artTransform(it),
                filter: SHADOW,
                pointerEvents: "auto",
                cursor: "pointer",
              }}
              className="garnish-pop max-w-none select-none object-contain"
            />
          );
        })}
      </div>

      {/*
        Falling: a second layer at z-50, above the lip.

        It has to be a layer of its own rather than a z-index on the piece: the
        resting container is itself z-10, which is a stacking context, so
        nothing inside it can ever paint in front of the plank. A cut piece
        that stayed there slid behind the wood a few frames after the knife
        landed and the drop was never seen. Shelves are `relative` with no
        z-index of their own, so they share one stacking context and 50 clears
        the lip on every row a piece falls past, not just this one.
      */}
      {falling.length > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-50">
          {items.map((it, i) => {
            const key = `${it.src}-${i}`;
            if (cut[key] !== "falling") return null;
            return (
              <div key={key} style={slot(it)}>
                {PIECES.map((piece, n) => (
                  <motion.div
                    key={n}
                    className="absolute inset-0"
                    initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
                    animate={{ y: FALL, x: `${piece.x}%`, rotate: piece.rotate, opacity: 0 }}
                    /*
                     * The knife and the gravity are two different motions, and
                     * running both on one curve is what made the first version
                     * read as the garnish fading out rather than being cut.
                     *
                     * `accelerate` is nearly flat for its first half -- correct
                     * for a fall, wrong for the cut -- so on one curve the
                     * pieces sat still for 400ms and only then blurred away.
                     * Sideways and rotation are the knife, and they take
                     * `slow-down`: the pieces are flung apart at once and
                     * decelerate, so the cut is legible in the first few
                     * frames. Only the drop accelerates, which is the
                     * overlapping action the can lift already uses -- one thing
                     * leads, the other follows.
                     */
                    transition={{
                      y: { duration: DURATION.drop, ease: ACCELERATE },
                      x: { duration: DURATION.enter, ease: SLOW_DOWN },
                      rotate: { duration: DURATION.enter, ease: SLOW_DOWN },
                      // Held solid until the drop has actually gathered speed:
                      // a piece that fades while it still hangs there reads as
                      // vanishing rather than falling away.
                      opacity: {
                        duration: DURATION.drop * 0.4,
                        delay: DURATION.drop * 0.6,
                      },
                    }}
                    onAnimationComplete={() =>
                      setCut((c) => (c[key] === "falling" ? { ...c, [key]: "gone" } : c))
                    }
                    style={{ filter: SHADOW }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ transform: artTransform(it), clipPath: piece.clip }}
                    >
                      <Image
                        src={`/assets/garnishes/${it.src}.webp`}
                        alt=""
                        width={203}
                        height={98}
                        className="size-full max-w-none select-none object-contain"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
