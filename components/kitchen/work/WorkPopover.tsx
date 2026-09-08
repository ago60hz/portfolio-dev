"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { SPRING, T } from "@/lib/motion";
import type { Work } from "@/content/works";
import { Ctas } from "./WorkCtas";
import { HotTag } from "./HotTag";

/**
 * The hover card (1:525).
 *
 * 231u wide against the can's 178u and offset -26u horizontally, so it
 * deliberately overhangs both sides of the can it belongs to. Anchored at 19u
 * from the card top, which puts it across the label rather than above it.
 *
 * It hangs. The brief asks for "when you drop a hanging ID card, it has some
 * wiggle before it damps out" -- follow-through and overlapping action.
 *
 * The pin is real geometry, not an invented anchor. Node 1:525 carries no rope;
 * the hanger is the HOT ribbon, 1:526, a 19-wide frame at x-offset 106 in a 231
 * card. 106 + 19/2 = 115.5, and 231/2 = 115.5 -- the ribbon is dead centre. So
 * the transform origin is the top centre, and everything below swings from it.
 *
 * Spring rather than tween, for two reasons: hovering along a shelf interrupts
 * the previous card constantly, and a spring redirects from its current
 * velocity where a tween restarts from zero; and a spring on `rotate` IS a
 * damped oscillation, so the wiggle is the physics rather than a keyframed
 * impression of it.
 *
 * `scaleY` from the same pin is the mask-in the brief allows for: the card
 * unrolls downward from the ribbon instead of appearing whole.
 */
export function WorkPopover({ work }: { work: Work }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, rotate: -4, scaleY: 0.9 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scaleY: 1 }}
      // The exit does not swing. A card being taken away has no reason to
      // settle, and letting the spring play out on the way off screen leaves
      // it hanging around for most of a second while the pointer has already
      // moved to the next can.
      exit={{ opacity: 0, y: -8, rotate: -2, scaleY: 0.94, transition: T.exit }}
      transition={SPRING.card}
      data-work-popover
      className="pointer-events-none absolute z-30"
      style={{
        left: "calc(-26 * var(--u))",
        top: "calc(19 * var(--u))",
        width: "calc(231 * var(--u))",
        // The ribbon's pin. Everything above swings about it.
        transformOrigin: "50% 0",
      }}
    >
      <HotTag />

      {/* The red sits behind everything and shows as the 2u top edge.
          It starts 22u down because that band belongs to the HOT ribbon, which
          pokes up above the card rather than sitting on top of it.

          `minHeight` rather than `height`: 69u is the resting size, but a longer
          blurb (The Faraway runs to four lines) needs the card to grow instead
          of `overflow-hidden` clipping the CTA row off the bottom. The 2u red
          top edge is now a paddingTop so it survives that growth. */}
      <div
        className="relative flex overflow-hidden bg-kitchen-red backdrop-blur-[2px]"
        style={{
          marginTop: "calc(22 * var(--u))",
          minHeight: "calc(69 * var(--u))",
          paddingTop: "calc(2 * var(--u))",
          borderRadius:
            "var(--radius-window) var(--radius-window) calc(2 * var(--u)) calc(2 * var(--u))",
        }}
      >
        <div className="flex flex-1">
          {/* Brand swatch */}
          <div
            className="flex shrink-0 items-center justify-center bg-kitchen-lime"
            style={{ width: "calc(38 * var(--u))" }}
          >
            <span
              className="relative block"
              style={{
                width: "calc(24 * var(--u))",
                height: "calc(24 * var(--u))",
              }}
            >
              <Image
                src={work.mark}
                alt=""
                aria-hidden
                fill
                sizes="32px"
                className="object-contain"
              />
            </span>
          </div>

          {/* Body */}
          <div
            className="flex min-w-0 flex-1 flex-col justify-between bg-kitchen-paper"
            style={{
              paddingInline: "calc(8 * var(--u))",
              paddingBlock: "calc(6 * var(--u))",
            }}
          >
            <p className="text-fine text-pretty text-kitchen-ink">{work.blurb}</p>
            <div
              className="pointer-events-auto flex items-center justify-end"
              style={{ gap: "calc(4 * var(--u))" }}
            >
              <Ctas work={work} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
