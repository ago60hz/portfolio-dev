"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { Cta, Work } from "@/content/works";
import { HotTag } from "./HotTag";

/** The pill row at (8u, 41u), right-aligned. Colours per the hover board. */
const CTA_PILL =
  "flex items-center justify-center rounded-full whitespace-nowrap text-fine leading-none " +
  "transition-transform duration-(--duration-press) active:scale-[0.97] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink";

const PILL_BOX = {
  height: "calc(18 * var(--u))",
  paddingInline: "calc(8 * var(--u))",
} as const;

function Ctas({ cta, slug }: { cta: Cta; slug: string }) {
  if (cta === "coming-soon") {
    return (
      <span
        className={`${CTA_PILL} bg-kitchen-brown text-kitchen-paper`}
        style={PILL_BOX}
      >
        coming soon
      </span>
    );
  }

  return (
    <>
      {cta === "more-view" && (
        <Link
          href={`/work/${slug}`}
          className={`${CTA_PILL} bg-kitchen-lime text-kitchen-ink`}
          style={PILL_BOX}
        >
          more
        </Link>
      )}
      <Link
        href={`/work/${slug}`}
        className={`${CTA_PILL} bg-kitchen-ink text-kitchen-paper`}
        style={PILL_BOX}
      >
        view
      </Link>
    </>
  );
}

/**
 * The hover card (1:525).
 *
 * 231u wide against the can's 178u and offset -26u horizontally, so it
 * deliberately overhangs both sides of the can it belongs to. Anchored at 19u
 * from the card top, which puts it across the label rather than above it.
 *
 * Spring rather than tween: hovering along a shelf interrupts the previous
 * card's animation constantly, and a spring redirects from its current
 * velocity where a tween would restart from zero.
 */
export function WorkPopover({ work }: { work: Work }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 520, damping: 24, mass: 0.7 }}
      className="pointer-events-none absolute z-30"
      style={{
        left: "calc(-26 * var(--u))",
        top: "calc(19 * var(--u))",
        width: "calc(231 * var(--u))",
      }}
    >
      <HotTag />

      {/* The red sits behind everything and shows as the 2u top edge.
          It starts 22u down because that band belongs to the HOT ribbon, which
          pokes up above the card rather than sitting on top of it. */}
      <div
        className="relative overflow-hidden bg-kitchen-red backdrop-blur-[2px]"
        style={{
          marginTop: "calc(22 * var(--u))",
          height: "calc(69 * var(--u))",
          borderRadius:
            "var(--radius-window) var(--radius-window) calc(2 * var(--u)) calc(2 * var(--u))",
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0 flex"
          style={{ top: "calc(2 * var(--u))" }}
        >
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
              <Ctas cta={work.cta} slug={work.slug} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
