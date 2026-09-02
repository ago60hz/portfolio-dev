"use client";

import Image from "next/image";
import { AnimatePresence } from "motion/react";
import type { Work } from "@/content/works";
import { useKitchen } from "@/lib/store";
import { cn } from "@/lib/utils";
import { WorkPopover } from "./work/WorkPopover";
import { WorkTag } from "./work/WorkTag";

/**
 * A spice-oil can: lid + label + rim (Work Card, 1:226).
 *
 * Geometry is 1-to-1 with the handoff, expressed in --u so the whole can scales
 * with the Window: card 178, lid 180x24 (1 of overhang each side), label
 * 178x100, rim 178x3.
 *
 * The covers in `works/cover_images` are clean artwork, so the category tags
 * are real elements laid over the label -- live text, tokenised fills, and
 * legible at any size. They sit 4u in from the label's bottom-left corner.
 */
export function WorkCan({ work }: { work: Work }) {
  const setHoveredWork = useKitchen((s) => s.setHoveredWork);
  const hovered = useKitchen((s) => s.hoveredWork === work.slug);

  return (
    <div
      className="relative flex justify-center"
      style={{ width: "var(--can-w)" }}
      onPointerEnter={() => setHoveredWork(work.slug)}
      onPointerLeave={() => setHoveredWork(null)}
      // Focus is tracked on the wrapper, not the button, so that tabbing from
      // the can INTO the popover's own View link does not blur the can and
      // unmount the element that just took focus. React's onBlur is focusout,
      // so it bubbles and relatedTarget tells us where focus actually went.
      onFocus={() => setHoveredWork(work.slug)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoveredWork(null);
        }
      }}
    >
      <button
        type="button"
        aria-label={`${work.title} — ${work.blurb}`}
        aria-expanded={hovered}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center",
          "transition-[filter,transform] duration-(--duration-press) ease-(--ease-out-soft)",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kitchen-ink",
          hovered && "-translate-y-0.5",
        )}
        style={{
          filter: hovered
            ? "drop-shadow(0 4px 20px var(--color-kitchen-lime))"
            : "drop-shadow(-2px 2px 8px rgba(0,0,0,0.25))",
        }}
      >
        {/* Lid -- 180 against the card's 178, so it overhangs ~1 each side. */}
        <Image
          src="/assets/can/top.webp"
          alt=""
          aria-hidden
          width={270}
          height={36}
          className="shrink-0 select-none object-fill"
          style={{ width: "var(--can-lid-w)", height: "var(--can-lid-h)" }}
        />

        {/* Label. Cylindrical form is three inset shadows, not a gradient. */}
        <span
          className="can-label relative block w-full shrink-0 overflow-hidden rounded-(--radius-label)"
          style={{ height: "var(--can-label-h)" }}
        >
          <Image
            src={work.image}
            alt={work.title}
            fill
            sizes="(max-width: 768px) 45vw, 25vw"
            className="select-none object-cover"
          />

          <span
            className="absolute flex flex-wrap items-center"
            style={{
              left: "calc(4 * var(--u))",
              bottom: "calc(4 * var(--u))",
              gap: "calc(4 * var(--u))",
            }}
          >
            {work.labelTags.map((t) => (
              <WorkTag key={t.label} tag={t} />
            ))}
          </span>
        </span>

        {/* Rim */}
        <Image
          src="/assets/can/base.webp"
          alt=""
          aria-hidden
          width={267}
          height={5}
          className="w-full shrink-0 select-none object-fill"
          style={{ height: "var(--can-base-h)" }}
        />

      </button>

      <AnimatePresence>
        {hovered && <WorkPopover key={work.slug} work={work} />}
      </AnimatePresence>
    </div>
  );
}
