import type { CaseStudy } from "./types";
import { MEDIA } from "./media.generated";
import { VIMEO } from "./vimeo.generated";

/**
 * A showreel, not a case study, and treated as one.
 *
 * There is no research beat behind this piece, so it has none. The Outcome
 * section is the one exception and it is real: Praise confirmed the work turned
 * into an ongoing retainer producing DEAN's marketing and social assets.
 * Nothing here is narrated beyond that.
 */
export const dean: CaseStudy = {
  slug: "dean",
  client: "DEAN",
  sector: "Booking and scheduling",
  chipLabel: "DEAN Design",
  title: "Fresh luxury. Time as the product.",
  hook: "“Actually enjoy the cool down.” The tagline works like a permission slip.",
  role: "Brand identity, AI creative direction",
  scope: "Midjourney, Nano Banana.",
  icon: "/assets/client-icons/dean.webp",
  cover: {
    src: "/assets/covers/dean.webp",
    alt: "DEAN case study cover",
    width: 712,
    height: 400,
  },
  blocks: [
    { type: "heading", id: "background", railLabel: "Background", text: "For studios that outgrew generic scheduling" },
    {
      type: "prose",
      text: "DEAN sells time to businesses where time is the entire experience: Pilates studios, spas, wellness spaces stuck with scheduling software built for everyone and no one. I aimed the direction at fresh luxury: calm, unhurried, priced like it's worth protecting.",
    },
    { type: "vimeo", ...VIMEO["dean/showcase"] },

    { type: "heading", id: "the-work", railLabel: "The work", text: "Art directed through prompts, with no shoot" },
    {
      type: "prose",
      text: "The logo shows up everywhere a studio needs it: glowing on an LED alarm clock, stamped into a chrome belt buckle, stitched across the back of a shirt. The photography and social system around it were built entirely in Midjourney. No studio, no models, no shoot day. I still made every call a photo director makes: who's in frame, how the light falls, what the grade looks like, how the shot is composed. The tool changed. The job didn't.",
    },
    { type: "image", media: MEDIA["dean/01-logo-mockups"] },
    {
      type: "prose",
      text: "The photography sits in terracotta and natural light, with people caught between moments instead of posing for one. That's the read DEAN needed: a studio session should feel like something you were already doing.",
    },
    {
      type: "prose",
      text: "The mockups solve a real problem. Handed a flat logo file, most people can't picture it on a product. Show it embroidered on a shirt or engraved on a belt buckle, and the client stops asking what it'll look like and starts approving it.",
    },

    { type: "heading", id: "outcome", railLabel: "Outcome", text: "The showreel became the pitch" },
    {
      type: "prose",
      text: "DEAN kept me on after the initial work: an ongoing retainer producing marketing and social assets month to month, same AI-directed process.",
    },
  ],
};
