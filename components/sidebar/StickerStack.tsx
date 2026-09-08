"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { STACK, type StackSticker } from "@/content/stickers";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DURATION, overshoot } from "@/lib/motion";
import { HEART, HEART_OUTLINE, type HeartArt } from "./heartArt";

/**
 * The sidebar sticker stack (86:224, "Frame 94" -- between the filter chips
 * and the accordions).
 *
 * The design draws two cards, the same component at two depths: the front one
 * 210 x 47.84 at +1 degree, and behind it the same card at 0.824 and -1. We
 * carry eight, so everything past the second sits in that same back slot -- a
 * neat pile rather than a fan, which is what the two drawn cards imply.
 *
 * Both cards are centred in the frame (front 64.77 + 105 = 169.77 against a
 * 339 frame's 169.5), so they are centred here too rather than pinned at
 * Figma's x -- the sidebar is `clamp(272px, 24.7vw, 380px)` and a fixed 339
 * frame was wider than it at every width, which pushed the pile off-centre.
 *
 * Plain px, not --u: the sidebar has no `container-type` ancestor, so cqw there
 * resolves against the viewport and the unit means nothing.
 */

/**
 * 86:225 unrotated, solved back out of Figma's axis-aligned 210.80 x 51.50.
 *
 * The card stretches in WIDTH only. Locking its aspect ratio and widening it to
 * 70% also made it 8px taller, which left the copy stranded near the top of a
 * box the design never made that tall. So height is the design's, fixed, and
 * every vertical number below is a design pixel.
 */
const CARD = { w: 210, h: 47.84, radius: 6.69 };

/**
 * The card fills 70% of the stack's width -- with a floor, because the height
 * is fixed and the copy has to fit inside it.
 *
 * The sidebar is `clamp(272px, 24.7vw, 380px)`, so between 768 and ~1101 of
 * viewport it sits at its 272 minimum. 70% of that is a 173 card, which puts
 * the longest testimonial on five lines against room for three -- a line and a
 * half of someone's words silently clipped. 236 is the width that holds three
 * lines, and above ~1090 of sidebar 70% is wider than that anyway, so this
 * only ever does anything at the narrow end.
 */
const CARD_WIDTH = "min(100%, max(70%, 236px))";

/** 78:237 is the same card at 173 wide -- 0.824 of it, tilted the other way. */
const BEHIND = 173 / CARD.w;

/** Vertical offsets straight out of Frame 94, in design px. */
const FRONT = { top: 4, scale: 1 };
const BACK = { top: 32.15, scale: BEHIND };
/** The top of the arc, clear of the card it is handing over to. */
const LIFT_TOP = FRONT.top - 22;

/**
 * One tilt per depth, alternating either side of square.
 *
 * Frame 94 draws only two angles, +1 and -1, because it draws only two cards.
 * We carry eight in a single back slot, so two angles made everything behind
 * the top card land in exactly the same place -- a pile with nothing to see.
 *
 * An earlier pass fanned them on a one-way ramp from +2.4 down to -3.4. This
 * alternates instead: every card leans the opposite way to the one it is
 * sitting on, which is what a stack of cards actually does when it is set down
 * by hand, and it opens a wider gap between neighbours than a ramp does at the
 * same angle -- so the depth reads with fewer cards showing.
 */
const TILT_STEP = 2;
const TILTS = Array.from({ length: 8 }, (_, depth) =>
  depth % 2 === 0 ? TILT_STEP : -TILT_STEP,
);

const tilt = (depth: number) => TILTS[Math.min(depth, TILTS.length - 1)];

/**
 * One shadow per depth: the top card sits highest off the pile and casts the
 * most, and each card below it casts less, until the one at the bottom is
 * barely lifted off the sidebar at all.
 *
 * Two layers each -- a wide soft cast plus a tight contact shadow -- because a
 * single blur at this size reads as a grey halo rather than as height. Both
 * fade together, so depth is carried by the whole shadow and not by opacity
 * alone.
 *
 * Kept very light. The geometry does the work -- the drop and blur still fall
 * away with depth, which is what says "lifted" -- while the opacities sit at
 * roughly a third of what they were. At the old 0.3 the cast read as a grey
 * band under a card on a pale sidebar, and eight of them stacked into a bruise;
 * the alternating tilt already separates the cards, so the shadow no longer has
 * to.
 */
const SHADOWS = TILTS.map((_, depth) => {
  const t = depth / (TILTS.length - 1);
  const drop = 9 - 7.6 * t;
  const blur = 16 - 13.5 * t;
  const cast = 0.1 - 0.075 * t;
  const contact = 0.07 - 0.05 * t;
  return (
    `0 ${drop.toFixed(2)}px ${blur.toFixed(2)}px -4px rgba(0,0,0,${cast.toFixed(3)}), ` +
    `0 ${(drop / 4).toFixed(2)}px ${(blur / 5).toFixed(2)}px -2px rgba(0,0,0,${contact.toFixed(3)})`
  );
});

const shadow = (depth: number) => SHADOWS[Math.min(depth, SHADOWS.length - 1)];

/**
 * Straightening under the pointer: the card snaps square and swings a little
 * past level before settling.
 *
 * `overshoot` is the house curve for a pop and peaks at 1.68, so a card resting
 * at +2.4 crosses zero to about -1.6 and comes back -- the snap the brief asks
 * for, at state speed rather than the curve's usual enter speed, because this
 * answers a pointer and anything slower stops feeling like a response.
 */
const STRAIGHTEN = { duration: DURATION.state, ease: overshoot } as const;

/**
 * The back card scales about its own centre, so its lowest point is
 * BACK.top + h x (1 + 0.824) / 2. Plus a pixel so nothing sits on the edge.
 *
 * Plus the fan: a tilted card drops its lower corner by about half its width
 * times sin(tilt). Without that allowance the deepest card's corner reaches
 * into the accordions below.
 *
 * Derived from TILT_STEP rather than typed. It was 7, hand-measured against a
 * 3.4 degree fan, and a stale constant here is a clipped corner nobody thinks
 * to connect back to the angle -- so the angle is the only thing to change.
 */
const TILT_BLEED = Math.ceil((CARD.w / 2) * Math.sin((TILT_STEP * Math.PI) / 180));
const STACK_HEIGHT =
  Math.ceil(BACK.top + (CARD.h * (1 + BEHIND)) / 2) + 1 + TILT_BLEED;

/**
 * Child geometry from 86:225.
 *
 * The heart and the photo are one cluster at the card's right end and must not
 * distort, so they keep their design size and anchor to the RIGHT edge; the
 * copy is the only thing that stretches, which is the point of widening at all.
 *
 * The heart heights are NOT the design's vector bounds, and that is deliberate.
 * note-heart.svg declares viewBox="0 0 80 34" but its path runs to y 66 -- the
 * export is cropped to the top half of the shape. Dropping that cropped art
 * into a box sized to the full 84.76 bounds and then `contain`-fitting it
 * centred the art vertically in a box twice its height, which is what pushed
 * the heart down clear of the photo and killed the bleed. So each box is sized
 * to what the asset actually holds -- design width / viewBox width x viewBox
 * height -- and stretched to fill it exactly.
 */
const LAYERS = {
  // Deliberately taller than the card so the point runs off the bottom edge and
  // is cut square. Sized to the design's box the heart ended just inside the
  // card, and the curve tapering to nothing above the edge read as a mistake.
  heartPurple: { right: 3.51, top: 2, height: 54, width: 88.21 },
  heartRed: { right: 2.83, top: -5, height: 66, width: 107.36 },
  // Pinned top, bottom and right, per the frame's constraints: the picture
  // fills the card's full height and sits flush to its edge.
  photo: { right: 0, top: 0, bottom: 0, width: 51 },
  // Stops short of the photo by the design's 4.24 gutter, and grows with the card.
  // Top and bottom rather than a fixed offset: the copy is centred in the
  // card, so cards with two lines and cards with four both sit right.
  copy: { left: 9.07, right: 51 + 4.24, top: 0, bottom: 0 },
};

/**
 * Splits the trailing punctuation off so it can hang outside the measure.
 * `hanging-punctuation` is the right property and is Safari-only, so the end
 * mark gets a negative margin instead, which works everywhere. 86:230 ends on
 * a closing quote and opens without one, so only the tail actually hangs.
 */
function hang(text: string): [string, string] {
  const m = text.match(/([.\u2026"\u201d\u2019']+)$/);
  return m ? [text.slice(0, -m[1].length), m[1]] : [text, ""];
}

/**
 * The copy is one weight throughout, so the `**...**` markers in
 * content/stickers.ts are stripped rather than styled. They stay in the data
 * because they still mark the phrase that matters, and a later design may want
 * it back.
 */
function plain(text: string): string {
  return text.replace(/\*\*/g, "");
}

/** One heart layer: whole shape, our colour, stretched to the design's box. */
function Flourish({
  art,
  color,
  box,
}: {
  art: HeartArt;
  color: string;
  box: { right: number; top: number; width: number; height: number };
}) {
  return (
    <svg
      aria-hidden
      viewBox={art.viewBox}
      // The design's box is 1.267 wide-to-tall against the art's 1.194, so
      // stretch the 6% rather than letterbox it and reintroduce the centring
      // slack that put the heart too low in the first place.
      preserveAspectRatio="none"
      className="pointer-events-none absolute"
      style={box}
    >
      {art.paths.map((path, i) =>
        path.strokeWidth ? (
          <path key={i} d={path.d} fill="none" stroke={color} strokeWidth={path.strokeWidth} />
        ) : (
          <path key={i} d={path.d} fill={color} />
        ),
      )}
    </svg>
  );
}

/** One card. Layer order follows 86:225: flourish, photo, grain, then copy. */
function Card({ sticker, boxShadow }: { sticker: StackSticker; boxShadow: string }) {
  const [body, tail] = hang(sticker.text);
  const opensOnQuote = /^[\u201c"\u2018']/.test(sticker.text);

  return (
    <div
      className="relative w-full overflow-clip bg-kitchen-surface"
      // The cast is on the card, not on the motion wrapper: the wrapper is what
      // scales, and a shadow inside a scaled box scales its blur with it, so
      // the pile's shadows would all soften by a different amount.
      style={{ height: CARD.h, borderRadius: CARD.radius, boxShadow }}
    >
      {/* Paper grain, edge to edge, flipped -- the source weave is directional.
          `background-size` is overridden because the class's `cover` is wrong
          here: paper-texture.webp is a PHOTOGRAPH of a crumpled sheet lying on
          white, so it has real edges and margins in it. Covering a 4.8:1 strip
          with a square photo crops a full-width band that catches the sheet's
          edge and the white surround -- which is the pale rectangle that read
          as the texture being cut. At 200% the visible window is the middle
          half of the sheet at any card width, so the edges never come into
          frame and the crop stays proportional as the card stretches. */}
      <span
        aria-hidden
        className="poster-texture pointer-events-none absolute inset-0 -scale-y-100"
        style={{ backgroundSize: "200% auto", backgroundPosition: "center" }}
      />

      {/* Vector 13 (purple) behind Vector 12 (red), in Figma's own paint
          order. The offset between them is what gives the hand-cut look.

          Inline SVG, not a background or a mask: the exported files crop the
          heart in half at the viewBox, which is what made it read as a red
          block cut off square. See heartArt.ts. Inlining also lets each layer
          take its own fill -- the files are baked red and lime, and this card
          wants purple under red -- and keeps the shape crisp at any width. */}
      {[
        { key: "outline", art: HEART_OUTLINE, color: "var(--color-kitchen-surface)", ...LAYERS.heartPurple },
        { key: "heart", art: HEART, color: "var(--color-kitchen-red)", ...LAYERS.heartRed },
      ].map(({ key, art, color, ...box }) => (
        <Flourish key={key} art={art} color={color} box={box} />
      ))}

      {/* No border. 86:228 draws a 1.11 stroke, but a hard purple line across
          the photo's left edge is exactly where the bleed has to be
          continuous -- it cut the heart off at the picture. */}
      <span aria-hidden className="pointer-events-none absolute overflow-clip" style={LAYERS.photo}>
        <Image src={sticker.photo} alt="" fill sizes="80px" className="object-cover" />
        {/* 86:228's third fill: a GRADIENT_LINEAR whose handles run from
            x 0.189 to x 0, transparent to #e50305. The photo's left edge is
            solid red, gone by 18.92% across -- the heart bleeding into the
            picture rather than stopping at its border. */}
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(229 3 5 / 1) 0%, rgb(229 3 5 / 0) 18.92%)",
          }}
        />
      </span>

      {/* 86:230: plain ink on the purple card. 86:230 carries a 2.23 purple
          text stroke, but 110:388 -- the newer sticker Praise pointed at --
          has none, and a halo that thick around 12px copy reads as a blur
          rather than a separation. */}
      <p
        className="absolute flex items-center font-medium text-kitchen-ink"
        style={{
          ...LAYERS.copy,
          fontSize: 12.26,
          // 86:230 sets 9.81 -- a 0.8 ratio, which crowds three lines of
          // testimonial into an unreadable block at this size.
          lineHeight: "12.5px",
          textIndent: opensOnQuote ? "-0.3em" : undefined,
        }}
      >
        {plain(body)}
        {tail && (
          // Hangs past the measure rather than eating a line.
          <span style={{ marginRight: "-0.45em" }}>{tail}</span>
        )}
      </p>

      {/* The curl. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ boxShadow: "inset -2px 2px 1px 0 rgba(255,255,255,0.3)" }}
      />
    </div>
  );
}

export function StickerStack() {
  const [order, setOrder] = useState<number[]>(() => STACK.map((_, i) => i));
  /** The card mid-flight to the back, so only it gets the arc. */
  const [leaving, setLeaving] = useState<string | null>(null);
  /**
   * Whether the top card is under the pointer or holding focus.
   *
   * Focus counts as well as hover: the card is a button, and a keyboard visitor
   * arriving on it should get the same acknowledgement a pointer does.
   */
  const [straight, setStraight] = useState(false);
  const reduced = usePrefersReducedMotion();

  const sendToBack = () => {
    setLeaving(STACK[order[0]].id);
    setOrder(([top, ...rest]) => (top === undefined ? [] : [...rest, top]));
  };

  return (
    <div className="px-3 pt-2 pb-1">
      <div
        data-sticker-stack
        className="relative w-full"
        style={{ height: STACK_HEIGHT }}
      >
        {order.map((cardIndex, depth) => {
          const card = STACK[cardIndex];
          const top = depth === 0;
          const flying = card.id === leaving && !top;
          const to = top ? FRONT : BACK;
          // Square under the pointer; otherwise this depth's place in the fan.
          const rot = top && straight && !reduced ? 0 : tilt(depth);

          return (
            <motion.div
              key={card.id}
              className="absolute origin-center"
              style={{
                left: "50%",
                width: CARD_WIDTH,
                // Straight to the back slot's z on the tap, so the card is
                // behind the new top one for the whole arc rather than sliding
                // over it. It still reads, because it lifts clear of the top
                // card's edge before it settles.
                zIndex: STACK.length - depth,
              }}
              initial={false}
              animate={
                flying && !reduced
                  ? {
                      // Up, smaller, then down into the back slot.
                      x: "-50%",
                      top: [FRONT.top, LIFT_TOP, BACK.top],
                      scale: [FRONT.scale, BEHIND * 0.8, BACK.scale],
                      // Out of the fan, square through the top of the arc, into
                      // whichever angle its new depth at the back of the pile
                      // calls for.
                      rotate: [tilt(0), 0, rot],
                    }
                  : { x: "-50%", top: to.top, scale: to.scale, rotate: rot }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : flying
                    ? { duration: 0.55, times: [0, 0.42, 1], ease: [0.9, 0, 0, 1] }
                    : {
                        duration: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                        // Only the top card straightens, so only it gets the
                        // overshoot; the rest simply re-fan as the pile shifts.
                        ...(top ? { rotate: STRAIGHTEN } : null),
                      }
              }
              onAnimationComplete={() => {
                if (flying) setLeaving(null);
              }}
              // Only the top card is reachable; the pile behind it is scenery,
              // and eight cards of duplicate copy in the tab order is not.
              aria-hidden={!top}
              inert={!top ? true : undefined}
            >
              {top ? (
                <button
                  type="button"
                  onClick={sendToBack}
                  onPointerEnter={() => setStraight(true)}
                  onPointerLeave={() => setStraight(false)}
                  onFocus={() => setStraight(true)}
                  onBlur={() => setStraight(false)}
                  aria-label={`${card.label}. Show the next one.`}
                  className="hit-32 block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kitchen-lime"
                >
                  <Card sticker={card} boxShadow={shadow(depth)} />
                </button>
              ) : (
                <Card sticker={card} boxShadow={shadow(depth)} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
