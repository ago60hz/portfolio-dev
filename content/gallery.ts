import { LOOPS, MEDIA } from "./case-studies/media.generated";
import { TILE_ART } from "./gallery.generated";
import { mediaAnchor } from "@/lib/anchors";

/**
 * The infinite gallery's pool: the product UI Praise wants judged on sight.
 *
 * Clean interface and finished brand work, and nothing else. A tile is read at
 * about 150u across, which is the whole editorial rule here: at that size a
 * picture either shows a designed surface at a glance or it shows nothing.
 *
 * So four kinds of image are out, however good the argument they make inside
 * the article:
 *
 *   - Research artefacts. Interview stills, journey maps, affinity walls,
 *     sketch scans. They earn their place in a case study, not in a wall of
 *     craft.
 *   - Annotated screens. Callout arrows, circled values, handwritten captions.
 *     At tile size the annotation is illegible and reads as damage to the UI.
 *   - Text-heavy boards. A page of prose is a grey rectangle.
 *   - The recordings' first frames. A GIF that opens on an empty state gives a
 *     blank still, and four blank tiles is what made the sphere read as paper.
 *
 * The brand boards stay: colour, gradients, art direction, merch and the icon
 * set are finished work and they carry the colour the product screens do not.
 *
 * And a key is only allowed here if the STUDY renders it. `media.generated.ts`
 * carries every file in the folder, including two PassportMonie boards the
 * article does not draw, and a tile pointing at one of those lands the reader
 * at the top of a long page with no idea why. `gallery.test.ts` is the guard.
 *
 * `scripts/gallery-tiles.mjs` reads TILE_KEYS out of this file and resizes
 * exactly these images, so adding a key here and re-running the script is the
 * whole job of adding a tile.
 */
const TILE_KEYS = [
  // MetaMask.
  "metamask/05-dashboard-states",
  // Bonadocs.
  "bonadocs/01-hero",
  // PassportMonie -- a whole identity and the product it dresses.
  "passportmonie/01-app-icon",
  "passportmonie/02-logotype",
  "passportmonie/03-color",
  "passportmonie/05-gradients",
  "passportmonie/06-art-direction",
  "passportmonie/08-merch",
  "passportmonie/11-in-product",
  "passportmonie/12-icon-set",
  "passportmonie/13-onboarding-flow",
  "passportmonie/14-home",
  "passportmonie/15-account-setup",
  "passportmonie/16-fund-account",
  "passportmonie/17-pay-with-passport",
  // DEAN.
  "dean/01-logo-mockups",
  // Axia Africa.
  "axia-africa/01-onboarding",
  "axia-africa/02-course-page",
  "axia-africa/03-illustrations",
  "axia-africa/04-video-lesson",
  "axia-africa/05-video-page",
  "axia-africa/06-schedule-and-quiz",
] as const;

export type GalleryTile = {
  /** `<slug>/<name>`, the same key MEDIA and LOOPS use. */
  key: string;
  slug: string;
  /** The resized print, not the article's artwork: 480px wide... */
  src: string;
  /** ...and 960px, for dense screens. */
  src2x: string;
  width: number;
  height: number;
  alt: string;
  /** The study, at the picture: `/work/<slug>#media-<name>`. */
  href: string;
};

const describe = (key: string) => {
  const art = TILE_ART[key as keyof typeof TILE_ART];
  const media =
    MEDIA[key as keyof typeof MEDIA] ?? LOOPS[key as keyof typeof LOOPS];
  if (!art || !media) throw new Error(`gallery: no art or media for "${key}"`);
  return {
    key,
    slug: key.split("/")[0],
    src: art.src,
    src2x: art.src2x,
    width: art.width,
    height: art.height,
    alt: media.alt,
    href: `/work/${key.split("/")[0]}#${mediaAnchor(media.src)}`,
  };
};

/**
 * Round-robin across the studies rather than study by study.
 *
 * PassportMonie alone is seventeen of the thirty-seven, so in source order the
 * first screen of the wall is one project and the gallery
 * reads as a single case study rather than as a body of work. Dealing one tile
 * from each study in turn puts five clients in the first handful of positions,
 * which is the whole reason the gallery exists.
 */
function interleave(keys: readonly string[]): string[] {
  const bySlug = new Map<string, string[]>();
  for (const key of keys) {
    const slug = key.split("/")[0];
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), key]);
  }
  const lanes = [...bySlug.values()];
  const out: string[] = [];
  for (let i = 0; out.length < keys.length; i++) {
    for (const lane of lanes) if (lane[i]) out.push(lane[i]);
  }
  return out;
}

export const GALLERY_TILES: GalleryTile[] = interleave(TILE_KEYS).map(describe);
