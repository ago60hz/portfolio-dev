import { WORKS } from "@/content/works";
import { TRAIL } from "@/content/trail.generated";

/**
 * How long the loader is allowed to hold the room.
 *
 * The floor is five seconds, at Praise's request: long enough that every
 * picture, font and video poster the kitchen needs is in before the room
 * opens, so nothing pops in behind the visitor. A warm cache resolves in 40ms,
 * and a loading animation that flashes is worse than none.
 *
 * The ceiling exists because progress is tied to real network requests and a
 * bad connection must not be able to trap anyone in here -- past this the room
 * opens whether the pictures arrived or not.
 */
/**
 * How long the Window takes to shrink back into its frame.
 *
 * Mirrors --duration-drop. Kept here because the handover waits on it: the
 * room is only allowed to fill in once the frame has landed.
 */
export const SHRINK_MS = 900;

/* 2000 + the 900 of SHRINK_MS is a ~2.9s boot, which is the 3 seconds asked
   for. The floor exists so a warm cache cannot flash the loader out of
   existence; five seconds of it was well past the point of making that point. */
export const MIN_MS = 2000;
/* And a 4s ceiling, so a bad network tops out under five seconds all-in
   rather than holding the door shut for nine. */
export const MAX_MS = 4000;

/** Everything the first paint of the kitchen actually needs. */
export function bootAssets(): string[] {
  return [
    "/assets/scene/wall-tile.webp",
    "/assets/scene/shelf-plank.webp",
    "/assets/can/top.webp",
    "/assets/can/base.webp",
    ...WORKS.map((w) => w.image),
    ...TRAIL.map((t) => t.src),
  ];
}

/**
 * What the counter shows.
 *
 * The lower of two progresses: how much has actually loaded, and how much of
 * the minimum display time has passed. Taking the lower of the two is what
 * stops the counter reaching 100 and then sitting there -- a progress readout
 * that finishes before the thing it measures is a progress readout nobody
 * believes a second time.
 *
 * Pure so it can be tested without a network.
 */
export function displayProgress({
  loaded,
  total,
  elapsed,
  minMs = MIN_MS,
}: {
  loaded: number;
  total: number;
  elapsed: number;
  minMs?: number;
}): number {
  const byAsset = total > 0 ? loaded / total : 1;
  const byTime = minMs > 0 ? elapsed / minMs : 1;
  return Math.max(0, Math.min(100, Math.round(Math.min(byAsset, byTime) * 100)));
}

/**
 * Kicks off the preloads and reports how many have settled.
 *
 * Settled, not succeeded: a 404 must advance the counter too, or one missing
 * file holds the door shut until MAX_MS.
 */
export function preload(srcs: string[], onSettled: (n: number) => void) {
  let done = 0;
  let live = true;
  const tick = () => live && onSettled(++done);
  for (const src of srcs) {
    const img = new Image();
    img.onload = tick;
    img.onerror = tick;
    img.src = src;
  }
  return () => {
    live = false;
  };
}

/**
 * The boot animation is a once-per-page-load event, and this is the claim on it.
 *
 * Module scope, deliberately not sessionStorage: Praise wants it on every full
 * page load, and a module variable is reset by exactly that and by nothing
 * else. What it stops is the client-side case: the kitchen unmounts when you
 * open a case study, so without this, navigating back would remount the loader
 * and make someone sit through five seconds they already sat through.
 *
 * `claimBoot` is called during the loader's first render, which happens before
 * any parent effect; `spendBoot` is called from a provider effect, so an app
 * that first rendered on a case study has already spent its boot by the time
 * the kitchen is reached.
 */
let bootAvailable = true;

/**
 * Call this from the BROWSER only.
 *
 * Module scope on the server is the process, not the request, so a claim made
 * during a server render is permanent and applies to every visitor -- see the
 * note in Loader.tsx.
 */
export function claimBoot(): boolean {
  if (!bootAvailable) return false;
  bootAvailable = false;
  return true;
}

export function spendBoot() {
  bootAvailable = false;
}
