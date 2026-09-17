"use client";

import { useEffect, useRef, useState } from "react";
import { MediaFrame } from "./MediaFrame";

/**
 * A Google Drive video, in Drive's own preview player.
 *
 * The file has to be shared "Anyone with the link"; a private file renders a
 * sign-in wall inside the frame instead of a player.
 *
 * Unlike the Vimeo clips this never autoplays. These are full lessons with
 * sound, and the preview player has no muted-autoplay mode, so it waits for a
 * press -- which also keeps the site's "nothing plays before a user gesture"
 * rule intact without any parameters to guard.
 *
 * Mounted only as it nears the viewport, like the Vimeo players. Until then a
 * brown well holds the exact 16:9 space, so nothing shifts when it arrives.
 */
export function DriveEmbed({
  id,
  title,
  width,
  height,
}: {
  id: string;
  title: string;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);

  return (
    <figure ref={ref}>
      <MediaFrame width={width} height={height}>
        <div
          className="relative w-full bg-kitchen-brown"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {inView && (
            <iframe
              src={`https://drive.google.com/file/d/${id}/preview`}
              title={title}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          )}
        </div>
      </MediaFrame>
    </figure>
  );
}
