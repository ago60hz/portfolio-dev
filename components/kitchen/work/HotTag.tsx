import Image from "next/image";

/**
 * The HOT ribbon (1:526) -- 19u x 22u, pinned near the popover's right edge
 * and poking up above the card.
 *
 * Praise's own artwork, including the notched tail and the vertical lettering.
 * The earlier code-drawn version was an approximation with a clip-path and a
 * rotated marquee; this is the real thing, so nothing here redraws it.
 */
export function HotTag() {
  return (
    <span
      aria-hidden
      className="absolute top-0 z-10 block"
      style={{
        left: "calc(106 * var(--u))",
        width: "calc(19 * var(--u))",
        height: "calc(22 * var(--u))",
      }}
    >
      <Image src="/assets/works/hot-ribbon.svg" alt="" fill sizes="32px" />
    </span>
  );
}
