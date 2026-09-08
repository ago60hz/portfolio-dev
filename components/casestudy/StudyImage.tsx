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
export function StudyImage({ media }: { media: Media }) {
  return (
    <figure>
      <MediaFrame width={media.width} height={media.height}>
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          sizes="(max-width: 640px) 100vw, 519px"
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
