import type { FilterId } from "./filters";
import { tag, type WorkTag } from "./tags";

/** The pill(s) drawn at the bottom-right of the hover popover. */
export type Cta = "view" | "more-view" | "coming-soon";

export type Work = {
  slug: string;
  title: string;
  /** Popover copy, transcribed from the hover-states board (1:514). */
  blurb: string;
  /** Drives filtering. Must be FilterIds so a chip can never miss a card. */
  tags: FilterId[];
  /**
   * The category tags shown on the can label.
   *
   * Real elements, not artwork: the covers in `works/cover_images` are clean,
   * so these are live text with a tokenised fill. Colour comes from the label
   * via `toneFor`, so a category is tinted the same way on every can.
   */
  labelTags: WorkTag[];
  cta: Cta;
  /**
   * Overrides the `view` pill's target.
   *
   * Absent means the pill points at this work's own case study, `/work/{slug}`.
   * Present means it leaves the site -- a few works live somewhere else
   * entirely (a live store, a prototype, a Framer page) and have no local
   * study to send anyone to.
   */
  href?: string;
  /** Overrides the `more` pill's target. Only read when `cta` is "more-view". */
  moreHref?: string;
  image: string;
  mark: string;
};

const img = (n: string) => `/assets/works/${n}.webp`;
const mark = (n: string) => `/assets/brands/${n}.webp`;

/**
 * Shelf order is top-left to bottom-right.
 *
 * Praise's running order rather than the handoff Window's (1:223): the shelf
 * leads with MetaMask and works down to the reel pieces, so the first row a
 * visitor meets is the strongest one. `content/case-studies/index.ts` keeps the
 * same sequence for the five that have a study, so the "next case study" footer
 * can never contradict the shelf.
 *
 * `tags` are derived from the painted chips plus the Figma category list.
 * Corrections belong here and nowhere else -- one edit re-filters the shelf.
 */
export const WORKS: Work[] = [
  {
    slug: "metamask",
    title: "MetaMask",
    blurb: "Redesigning MetaMask Card for 30M+ users.",
    tags: ["product-design"],
    labelTags: [tag("product")],
    cta: "view",
    image: img("metamask"),
    mark: mark("metamask"),
  },
  {
    slug: "katsusando",
    title: "Katsusando",
    blurb: "Scan your wallet for existing sandwich attacks.",
    tags: ["shipped", "brand-design", "ai-assisted"],
    labelTags: [tag("Shipped")],
    cta: "more-view",
    href: "https://katsusando.vercel.app/",
    moreHref:
      "https://www.linkedin.com/posts/praisefabilola_despite-how-hard-it-was-to-go-from-zero-experience-activity-7481072935533711360-_Zxr",
    image: img("katsusando"),
    mark: mark("katsusando"),
  },
  {
    slug: "axia-africa",
    title: "Axia Africa",
    blurb: "Product redesign and AI course production for a hybrid learning model.",
    tags: ["product-design", "ai-assisted"],
    labelTags: [tag("product")],
    cta: "view",
    image: img("axia-africa"),
    mark: mark("axia-africa"),
  },
  {
    slug: "passportmonie",
    title: "PassportMonie",
    blurb: "Art direction, illustration, and UI system for a travel-payments app.",
    tags: ["product-design", "brand-design", "ai-assisted"],
    labelTags: [tag("product"), tag("brand")],
    cta: "view",
    image: img("passportmonie"),
    mark: mark("passportmonie"),
  },
  {
    slug: "dean",
    title: "DEAN",
    blurb: "Brand identity and AI creative direction for a fresh-luxury booking platform.",
    tags: ["brand-design", "motion", "ai-assisted"],
    labelTags: [tag("brand")],
    cta: "view",
    image: img("dean"),
    mark: mark("dean"),
  },
  {
    slug: "faraway",
    title: "The Faraway",
    blurb: "Branding, positioning, and revenue funnels for a travel agency.",
    tags: ["brand-design", "websites", "growth-automation"],
    labelTags: [tag("brand"), tag("website"), tag("growth")],
    cta: "view",
    href: "https://book.thefaraway.co/",
    image: img("faraway"),
    mark: mark("faraway"),
  },
  {
    slug: "unrefyned",
    title: "Unrefyned",
    blurb: "Built the Shopify store, then grew it 66% in a month.",
    tags: ["growth-automation", "shipped"],
    labelTags: [tag("E-commerce"), tag("growth")],
    cta: "view",
    href: "https://unrefynedstudio.com/",
    image: img("unrefyned"),
    mark: mark("unrefyned"),
  },
  {
    slug: "bonadocs",
    title: "Bonadocs",
    blurb: "An in-doc widget for testing smart contracts live.",
    tags: ["product-design"],
    labelTags: [tag("product")],
    cta: "view",
    image: img("bonadocs"),
    mark: mark("bonadocs"),
  },
  {
    slug: "sentio",
    title: "Sentio",
    blurb: "Website design and art direction for a news analysis app.",
    tags: ["websites"],
    labelTags: [tag("Website")],
    cta: "view",
    href: "https://sentio.framer.website/",
    image: img("sentio"),
    mark: mark("sentio"),
  },
];
