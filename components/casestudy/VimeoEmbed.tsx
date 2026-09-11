"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { MediaFrame, fitClass } from "./MediaFrame";

/**
 * Vimeo players are enabled, but they will not play until the site's domain is
 * added to each clip's embed allowlist. THIS IS A PRE-DEPLOY CHECKLIST ITEM.
 *
 * Vimeo > the video > Settings > Privacy > "Where can this be embedded?"
 *   -> add the production domain, and localhost for development.
 *
 * Note this is a SEPARATE setting from "Who can watch", which is already
 * public. That distinction cost several wrong diagnoses, so here is the
 * evidence, all of it from one real Chrome session:
 *
 *   praisefabilola.framer.website  players run, currentTime advances
 *   localhost:3000                 same clips, same browser, spinner forever
 *   vimeo.com/<id> watch page      200, plays
 *   curl / headless Chromium       401 (they also fail a Cloudflare Turnstile
 *                                  challenge, which is a red herring -- it
 *                                  looks like an access error and is not)
 *
 * Until the domain is allowed, viewers see the poster frame, which is a real
 * frame of the clip and reads as intentional. Set this to false to force that
 * state deliberately.
 *
 * The parameter string below is copied exactly from the Framer embed, the one
 * configuration observed playing on this account. `background=1` is a paid
 * feature and is silently ignored here, leaving the player unmuted so the
 * browser refuses to autoplay; `dnt=1` disables player features. Neither
 * belongs here, and muted must survive any future edit -- it is what keeps the
 * site's "nothing plays before a user gesture" rule intact.
 */
const VIMEO_EMBEDS_ENABLED = true;

/**
 * How long a player gets to say it loaded before we assume it never will.
 *
 * Vimeo is blocked outright on some networks -- every Indonesian ISP, under the
 * Kominfo filter, since 2014, plus assorted corporate and school proxies. There
 * the request is answered by a block page instead, and the iframe shows the
 * browser's "player.vimeo.com refused to connect". An iframe gives no error
 * event for that, and its `load` fires for the block page too, so neither can
 * tell a broken frame from a working one.
 *
 * What CAN tell them apart: a real player posts `{"event":"ready"}` to its
 * parent the moment it boots, unasked -- observed in Chrome on the production
 * domain. No block page ever will. So no ready within this window means the
 * frame is swapped back for the poster and a link out.
 *
 * Generous on purpose. A slow connection that would have played is a worse
 * outcome to cut off than a blocked one is to wait on, since the blocked reader
 * is looking at the poster-coloured frame either way.
 */
const READY_TIMEOUT_MS = 8000;

/**
 * A Vimeo clip, muted and looping.
 *
 * The parameter string is copied exactly from Praise's Framer site, because
 * that is the only configuration observed actually playing on this account.
 *
 * Two things were tried and rejected. `background=1` is a paid Vimeo feature,
 * silently ignored here, and without it the player stays unmuted and the
 * browser correctly refuses to autoplay. `dnt=1` was the only parameter ours
 * carried that the working embed did not, and Vimeo's do-not-track mode turns
 * off player features. Muted is what keeps the site's "nothing plays before a
 * user gesture" rule intact, so it must survive any future edit here.
 *
 * The iframe mounts only as the block nears the viewport. Five players would
 * otherwise open five connections on load for clips most readers never reach.
 * Until then the poster holds the exact space, so nothing shifts on arrival.
 *
 * Under prefers-reduced-motion nothing autoplays: the poster stays and a button
 * hands over a normal player, with controls, to anyone who wants it.
 */
export function VimeoEmbed({
  id,
  poster,
  title,
  width,
  height,
}: {
  id: string;
  poster: string;
  title: string;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const [asked, setAsked] = useState(false);
  const [unreachable, setUnreachable] = useState(false);

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

  const autoplaying = VIMEO_EMBEDS_ENABLED && inView && !reduced;
  const src = asked && VIMEO_EMBEDS_ENABLED
    ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1`
    : autoplaying
      ? `https://player.vimeo.com/video/${id}?muted=1&autoplay=1&autopause=0&controls=0&loop=1`
      : null;

  // Wait for this player's own ready message, or give up. See READY_TIMEOUT_MS.
  useEffect(() => {
    if (!src) return;

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://player.vimeo.com") return;
      // Up to five players share this window, so only our own counts.
      if (e.source !== frame.current?.contentWindow) return;
      let data: unknown = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if ((data as { event?: string } | null)?.event === "ready") {
        clearTimeout(timer);
        window.removeEventListener("message", onMessage);
      }
    };

    const timer = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      setUnreachable(true);
    }, READY_TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [src]);

  const showFrame = src && !unreachable;

  return (
    <figure ref={ref}>
      <MediaFrame width={width} height={height}>
        <div
          className={`relative ${fitClass(width, height)}`}
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {showFrame ? (
            <iframe
              ref={frame}
              src={src}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <Image
              src={poster}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, 519px"
              className="object-cover"
            />
          )}
        </div>
      </MediaFrame>

      {/* The player never booted: the poster is back in its place, and this is
          the way through for anyone who can reach vimeo.com some other way. */}
      {unreachable && (
        <a
          href={`https://vimeo.com/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-doto mt-2 inline-block text-fine tracking-[-0.04em] text-kitchen-brown-deep underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink"
        >
          Video didn’t load here. Watch “{title}” on Vimeo
        </a>
      )}

      {VIMEO_EMBEDS_ENABLED && reduced && !asked && !unreachable && (
        <button
          type="button"
          onClick={() => setAsked(true)}
          className="font-doto mt-2 cursor-pointer text-fine tracking-[-0.04em] text-kitchen-brown-deep underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink"
        >
          Play “{title}”
        </button>
      )}
    </figure>
  );
}
