import Image from "next/image";
import type { Media } from "@/content/case-studies";
import { MediaFrame, fitClass } from "./MediaFrame";

/**
 * A still, at the column's full width and its own aspect ratio.
 *
 * width/height are measured by scripts/normalize-assets.mjs rather than typed
 * by hand -- they are what preserve the ratio and reserve the space, so a wrong
 * pair means either a stretched image or a page that jumps as it loads.
 */
export function StudyImage({
  media,
  priority = false,
}: {
  media: Media;
  /**
   * For the one image that is on screen when the article opens.
   *
   * next/image lazy-loads by default, which is right for an article this long
   * and wrong for the top of it: the first still is the largest thing in the
   * first viewport, and lazy-loading the LCP element means it is not even
   * requested until layout settles, so it arrives visibly late. `priority`
   * puts a <link rel="preload" as="image"> in the head and drops the lazy
   * attribute, so it is in flight with the document.
   *
   * Exactly one per page. Preloading more competes with the one that matters
   * and Next warns about it.
   */
  priority?: boolean;
}) {
  return (
    <figure>
      <MediaFrame width={media.width} height={media.height}>
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          sizes="(max-width: 640px) 100vw, 519px"
          priority={priority}
          className={fitClass(media.width, media.height)}
        />
      </MediaFrame>
      {media.caption && (
        <figcaption className="font-doto mt-2 text-fine tracking-[-0.04em] text-kitchen-brown-deep">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}
