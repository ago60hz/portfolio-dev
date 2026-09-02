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
  image: string;
  mark: string;
};

const img = (n: string) => `/assets/works/${n}.webp`;
const mark = (n: string) => `/assets/brands/${n}.webp`;

/**
 * Shelf order is top-left to bottom-right, matching the handoff Window (1:223).
 *
 * `tags` are derived from the painted chips plus the Figma category list.
 * Corrections belong here and nowhere else -- one edit re-filters the shelf.
 */
export const WORKS: Work[] = [
  {
    slug: "katsusando",
    title: "Katsusando",
    blurb: "Scan your wallet for existing sandwich attacks.",
    tags: ["shipped", "brand-design", "ai-assisted"],
    labelTags: [tag("Shipped")],
    cta: "more-view",
    image: img("katsusando"),
    mark: mark("katsusando"),
  },
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
    slug: "dean",
    title: "DEAN",
    blurb: "Fresh Luxury: Brand identity & creative direction for DEAN.",
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
    cta: "coming-soon",
    image: img("faraway"),
    mark: mark("faraway"),
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
    slug: "unrefyned",
    title: "Unrefyned",
    blurb: "Built the Shopify store, then grew it 66% in a month.",
    tags: ["growth-automation", "shipped"],
    labelTags: [tag("E-commerce"), tag("growth")],
    cta: "view",
    image: img("unrefyned"),
    mark: mark("unrefyned"),
  },
  {
    slug: "passportmonie",
    title: "PassportMonie",
    blurb: "Art direction and Ui face-lift for a travel & lifestyle payments app.",
    tags: ["product-design", "brand-design", "ai-assisted"],
    labelTags: [tag("product"), tag("brand")],
    cta: "view",
    image: img("passportmonie"),
    mark: mark("passportmonie"),
  },
  {
    slug: "fagbemi-studios",
    title: "Fagbemi Studios",
    blurb: "Brand identity and art direction for Fagbemi Studios.",
    tags: ["brand-design", "ai-assisted"],
    labelTags: [tag("brand")],
    cta: "view",
    image: img("fagbemi-studios"),
    mark: mark("fagbemi"),
  },
  {
    slug: "sentio",
    title: "Sentio",
    blurb: "Website design and art direction for a news analysis app.",
    tags: ["websites"],
    labelTags: [tag("Website")],
    cta: "view",
    image: img("sentio"),
    mark: mark("sentio"),
  },
];
