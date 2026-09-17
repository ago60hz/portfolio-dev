/**
 * Case study content, as typed data rather than MDX.
 *
 * MDX would mean another dependency, another build path, and image dimensions
 * that nothing checks. Typed blocks ride the vitest/tsc gate we already have,
 * and the progress rail derives its section offsets from the very same array
 * that renders the body -- one source, so the rail can never drift out of sync
 * with the page it is describing.
 */

/** Anything with intrinsic dimensions. Width and height are mandatory: they are
 *  what preserve aspect ratio at full column width, and what stop the page
 *  shifting as media loads. `scripts/normalize-assets.mjs` measures them. */
export type Media = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

/** An animated GIF plus a still first frame for prefers-reduced-motion. */
export type Loop = Media & { still: string };

export type Block =
  /** A section. `railLabel` is what the progress rail prints -- short and
   *  uppercase, because the rail sets it in Doto 12 and 112u is not wide. */
  | { type: "heading"; id: string; railLabel: string; text: string }
  /**
   * A scannable break inside a section. Deliberately a separate type from
   * "heading": headingsOf() collects only headings, so subheadings can never
   * reach the progress rail -- 112u of margin has room for five section labels,
   * not twenty. The rail describes the shape of the article; these help someone
   * skim the inside of a section.
   */
  | { type: "subheading"; text: string }
  | { type: "prose"; text: string }
  /** A short bulleted run, for constraints or steps that read as a set rather
   *  than as a sentence. Keep items to a line or two; anything longer is prose. */
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "metrics"; items: { value: string; label: string }[] }
  | { type: "image"; media: Media }
  /** Two side by side above `md`, stacked below. */
  | { type: "gallery"; items: Media[] }
  /**
   * A silent UI recording, served as the original GIF.
   *
   * An <img>, not a <video>: these have no audio and no controls. Re-encoding
   * them smaller was tried and rejected -- the whole point of these clips is
   * that you can read the interface being demonstrated, and compression takes
   * that first. Weight is handled by lazy loading instead.
   *
   * The still frame is swapped in by a <picture> media query under reduced
   * motion, so that path needs no JavaScript and downloads far less.
   */
  | { type: "loop"; media: Loop }
  /** Vimeo, chromeless and muted. `id` is the numeric id, not the URL. */
  | { type: "vimeo"; id: string; poster: string; title: string; width: number; height: number }
  /** A Google Drive video in Drive's preview player. `id` is the file id from
   *  the share link, and the file must be shared "Anyone with the link". */
  | { type: "drive"; id: string; title: string; width: number; height: number };

export type CaseStudy = {
  /** Must match a `Work.slug`. Asserted by content/case-studies/index.test.ts. */
  slug: string;
  /** Breadcrumb + masthead. "MetaMask (Consensys)". */
  client: string;
  /** The right half of the masthead's `Client | Sector` line. "Web3". */
  sector: string;
  /** Shown in the study breadcrumb chip. Usually "<Work> Design". */
  chipLabel: string;
  title: string;
  /**
   * The Gochi Hand pull quote under the title. A real line from the work -- a
   * research quote, a client sentence -- never invented copy.
   *
   * These four are optional because a study can land before all of them are
   * known. Absent renders nothing; it never renders a placeholder. A page that
   * says "TODO" to a visitor is worse than one that stays quiet, and a made-up
   * timeline is worse than both.
   */
  hook?: string;
  role?: string;
  scope?: string;
  timeline?: string;
  /** The client mark in the masthead (192x192, on sand). */
  icon: string;
  /** Also what the next-study footer shows (712x400). */
  cover: Media;
  blocks: Block[];
};

/** Sections, in order, for the rail. Derived rather than authored so it cannot
 *  disagree with the body. */
export const headingsOf = (study: CaseStudy) =>
  study.blocks.flatMap((b, index) =>
    b.type === "heading" ? [{ id: b.id, label: b.railLabel, index }] : [],
  );
