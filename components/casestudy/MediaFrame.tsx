import type { ReactNode } from "react";

/**
 * The frame every piece of study media sits in (35:300).
 *
 * Radius 2 and a 1px brown edge with the house 2px bottom. Landscape media
 * fills the column at its own aspect ratio, which is what the brief asks for.
 *
 * Portrait media does not: a 3:5 phone recording at full column width would be
 * over 800px tall and shove the rest of the article off the screen. Those sit
 * inside a 4:3 well on solid brown instead, centred and contained -- the well
 * keeps the article's rhythm and reads as a deliberate mount rather than an
 * image that got away.
 */
export function MediaFrame({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const portrait = height > width;

  return (
    <div
      className={
        "overflow-hidden rounded-[2px] border border-b-2 border-kitchen-brown" +
        (portrait ? " flex aspect-[4/3] items-center justify-center bg-kitchen-brown" : "")
      }
    >
      {children}
    </div>
  );
}

/** How the media itself is sized inside the frame. */
export const fitClass = (width: number, height: number) =>
  height > width ? "h-full w-auto max-w-full object-contain" : "h-auto w-full";
