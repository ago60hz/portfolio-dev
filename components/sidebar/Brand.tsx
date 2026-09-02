import Image from "next/image";

/**
 * Praise Fabilola / 'JO'DISCO lockup (1:376).
 *
 * "Praise Fabilola" is live Gochi Hand text -- the handoff hides the bitmap
 * layer in favour of the typeface, which also makes the name selectable and
 * indexable. 'JO'DISCO stays a bitmap: it is pixel art, and the traced SVG is
 * 148 KB against 8 KB for the WebP.
 */
export function Brand() {
  return (
    <div className="flex w-full shrink-0 items-center gap-2 border-b border-kitchen-ink px-4 py-2">
      <span className="font-gochi text-logo whitespace-nowrap text-kitchen-ink">
        Praise Fabilola
      </span>
      <span aria-hidden className="text-body">
        /
      </span>
      <Image
        src="/assets/brand/jodisco.webp"
        alt="'JO'DISCO"
        width={326}
        height={64}
        priority
        className="h-[clamp(13px,1.2vw,19px)] w-auto"
      />
    </div>
  );
}
