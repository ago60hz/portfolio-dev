import type { CaseStudy } from "./types";
import { MEDIA } from "./media.generated";

/** A showreel. Copy started as Praise's Coda doc and went through one editing pass. */
export const fagbemiStudios: CaseStudy = {
  slug: "fagbemi-studios",
  client: "Fagbemi Studios",
  sector: "Fine art",
  chipLabel: "Fagbemi Studios Design",
  title: "A brand that hints at depth instead of explaining it.",
  hook: "Where Memory Lives.",
  role: "Brand identity, AI creative direction",
  scope: "Midjourney, Nano Banana.",
  icon: "/assets/client-icons/fagbemi.webp",
  cover: {
    src: "/assets/covers/fagbemi-studios.webp",
    alt: "Fagbemi Studios case study cover",
    width: 712,
    height: 400,
  },
  blocks: [
    { type: "heading", id: "background", railLabel: "Background", text: "Work that carries weight instead of announcing it" },
    {
      type: "prose",
      text: "Fagbemi Studios is a fine art practice. The work sits with pain and memory, unresolved. The brand needed the same restraint: hint at the weight.",
    },

    { type: "heading", id: "the-work", railLabel: "The work", text: "Built around one word: chiaroscuro" },
    {
      type: "prose",
      text: "I built the entire brief around one word: chiaroscuro. Light and shadow. Memory pulling itself into shape. Most artist branding chases a premium look with gloss. I went the other way and built a visual language heavy enough to hold what the work is actually about.",
    },
    { type: "image", media: MEDIA["fagbemi-studios/01-brand-reel"] },
    {
      type: "prose",
      text: "The monogram sits on materials that age on purpose: wax seals, scratched silver plate, gold relief, worn fabric. Each surface makes the mark answer a different question. The photography runs on the same rule: film grain, available light, Black women photographed in quiet authority rather than performance. Nothing in it is staged.",
    },
    {
      type: "prose",
      text: "The most considered piece in the system is the quote card, and the words on it are the artist's own:",
    },
    {
      type: "quote",
      text: "I’m never grateful for suffering, for pain. What I am grateful for is the resilience that may exist in my family and our ability to adapt.",
    },
    {
      type: "prose",
      text: "Set in garnet and gold with the monogram floating above it, the card is the most honest asset in the system: the artist's own words, rendered like they matter. I built the brand language to hold a line like that without flinching.",
    },
    /*
     * These close the reel, each at full column width rather than paired in a
     * `gallery`: both are 4:5 and dense with detail -- the exhibition poster as
     * the finished artifact the paragraph above describes, and the studio as
     * the place it came from -- and a half-column crop of either loses the
     * thing worth looking at.
     */
    { type: "image", media: MEDIA["fagbemi-studios/02-exhibition"] },
    { type: "image", media: MEDIA["fagbemi-studios/03-work-in-progress"] },
  ],
};
