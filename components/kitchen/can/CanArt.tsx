import Image from "next/image";
import type { Work } from "@/content/works";
import { WorkTag } from "../work/WorkTag";

/**
 * The can itself: lid + label + rim (Work Card, 1:226).
 *
 * Geometry is 1-to-1 with the handoff, expressed in --u so the whole can
 * scales with the Window: card 178, lid 180x24 (1 of overhang each side),
 * label 178x100, rim 178x3.
 *
 * The covers in `works/cover_images` are clean artwork, so the category tags
 * are real elements laid over the label -- live text, tokenised fills, and
 * legible at any size. They sit 4u in from the label's bottom-left corner.
 *
 * Split out from WorkCan so that file is only the behaviour: the filter exit,
 * the hover spring and the popover. Nothing here moves.
 */
export function CanArt({ work }: { work: Work }) {
  return (
    <>
      {/* Lid -- 180 against the card's 178, so it overhangs ~1 each side. */}
      <Image
        src="/assets/can/top.webp"
        alt=""
        aria-hidden
        // The artwork's own 712x88, not the 180x24 box it is drawn into: these
        // are what Next sizes its srcset from, and declaring the smaller box
        // had it serving a lid upscaled on any hi-dpi screen. The painted size
        // is the design's, and comes from the style below.
        width={712}
        height={88}
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
          className="absolute z-2 flex flex-wrap items-center"
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

    </>
  );
}
