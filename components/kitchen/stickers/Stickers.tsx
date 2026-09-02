"use client";

import { useState } from "react";
import { useKitchen } from "@/lib/store";
import { TESTIMONIALS } from "@/content/copy";
import { Poster } from "./Poster";

const CHEF_PHOTOS = ["/assets/chef/chef-0.webp", "/assets/chef/chef-1.webp", "/assets/chef/chef-2.webp"];

/** Every sticker is a real button -- each one does something. */
const HIT =
  "hit-32 cursor-pointer text-left transition-transform duration-(--duration-press) " +
  "hover:-rotate-1 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4";

const NOTE_BOX = {
  width: "calc(188.335 * var(--u))",
  paddingInline: "calc(8 * var(--u))",
  paddingBlock: "calc(4 * var(--u))",
  // Reserve room for the photo that overhangs the right edge, so the copy
  // never runs underneath it.
  paddingRight: "calc(56 * var(--u))",
} as const;

/** Purple note, dashed red border, lime copy. Used for the two callouts. */
function Note({
  children,
  photo,
  onClick,
  label,
}: {
  children: React.ReactNode;
  photo: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`${HIT} focus-visible:outline-kitchen-lime`}>
      <Poster
        tone="note"
        photo={photo}
        photoBorder="var(--color-kitchen-purple)"
        className="border border-dashed border-kitchen-red bg-kitchen-purple"
        style={NOTE_BOX}
      >
        {/* Width is left to flow inside the 188u box. Pinning it to Figma's
            134u text box overflowed the sticker as soon as our leading
            differed from the design's by even a fraction. */}
        <p className="text-micro text-kitchen-lime">{children}</p>
      </Poster>
    </button>
  );
}

/** "66% revenue growth in a month" -- opens Clients & Achievements. */
export function RevenueSticker() {
  const revealAccordion = useKitchen((s) => s.revealAccordion);
  return (
    <Note
      photo="/assets/poster/revenue-photo.webp"
      onClick={() => revealAccordion("achievements")}
      label="66% revenue growth in a month — open Clients and Achievements"
    >
      66% revenue growth in
      <br />a month
    </Note>
  );
}

/** The floating testimonial -- opens Comments. */
export function TestimonialSticker() {
  const revealAccordion = useKitchen((s) => s.revealAccordion);
  return (
    <Note
      photo="/assets/poster/testimonial-photo.webp"
      onClick={() => revealAccordion("comments")}
      label="Read the comments"
    >
      &ldquo;{TESTIMONIALS[0].quote}&rdquo;
    </Note>
  );
}

/** "CHEF WAS CUTE" -- cycles the three photos in place, and wraps. */
export function VibeSticker() {
  const [index, setIndex] = useState(0);

  return (
    <button
      type="button"
      onClick={() => setIndex((i) => (i + 1) % CHEF_PHOTOS.length)}
      aria-label={`Chef was cute — photo ${index + 1} of ${CHEF_PHOTOS.length}. Show the next one.`}
      className={`${HIT} focus-visible:outline-kitchen-lime`}
    >
      <Poster
        tone="vibe"
        photo={CHEF_PHOTOS[index]}
        photoBorder="var(--color-kitchen-red)"
        className="border-2 border-solid border-kitchen-ink bg-kitchen-red"
        style={{
          width: "calc(200.069 * var(--u))",
          height: "calc(44.313 * var(--u))",
          padding: "calc(8 * var(--u))",
        }}
      >
        <p
          className="font-danfo text-fine leading-none text-kitchen-lime"
          style={{ fontVariationSettings: '"ELSH" 0' }}
        >
          CHEF WAS CUTE
          <br />
          WILL EAT HERE AGAIN
        </p>
      </Poster>
    </button>
  );
}
