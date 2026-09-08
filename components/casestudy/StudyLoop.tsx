import type { Loop } from "@/content/case-studies";
import { MediaFrame, fitClass } from "./MediaFrame";

/**
 * A silent UI recording.
 *
 * Two deliberate departures from the rest of the media on this page.
 *
 * A plain <img> rather than next/image: the optimiser re-encodes what it is
 * given and drops the animation, so the GIF has to be served untouched.
 * width/height are still set, so it reserves its space like everything else.
 * These are large, and deliberately so -- legibility of the interface being
 * demonstrated beats file size here. loading="lazy" is what pays for that.
 *
 * And a <picture> whose first source is a reduced-motion media query. Under
 * that setting the browser picks the still first frame and never fetches the
 * animation -- no effect, no state, no JavaScript, and less to download for
 * the people who asked for less movement.
 */
export function StudyLoop({ media }: { media: Loop }) {
  return (
    <figure>
      <MediaFrame width={media.width} height={media.height}>
        <picture className={fitClass(media.width, media.height)}>
          <source media="(prefers-reduced-motion: reduce)" srcSet={media.still} />
          <img
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            loading="lazy"
            decoding="async"
            className={fitClass(media.width, media.height)}
          />
        </picture>
      </MediaFrame>
      {media.caption && (
        <figcaption className="font-doto mt-2 text-fine tracking-[-0.04em] text-kitchen-brown-deep">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}
