import type { CaseStudy } from "./types";
import { MEDIA } from "./media.generated";

/**
 * From "AI in My Creative Practice" (Praise's Coda doc).
 *
 * Shorter than the product studies by nature: this is art direction, and the
 * brand slides carry most of the argument themselves. The structure drops the
 * research and outcome beats rather than padding them out with claims the
 * source does not make.
 */
export const passportmonie: CaseStudy = {
  slug: "passportmonie",
  client: "PassportMonie",
  sector: "Fintech",
  chipLabel: "PassportMonie Design",
  title: "Make financial infrastructure feel like the beginning of a vacation.",
  hook: "The Carter Bridge floating on clouds with sunflowers is not an accident. It is Lagos, rendered as a place worth leaving from.",
  role: "Art direction, illustration",
  scope: "Brand system, AI illustration, UI assets.",
  icon: "/assets/client-icons/passportmonie.webp",
  cover: {
    src: "/assets/covers/passportmonie.webp",
    alt: "PassportMonie case study cover",
    width: 712,
    height: 400,
  },
  blocks: [
    { type: "heading", id: "background", railLabel: "Background", text: "A payments app for people who are going somewhere" },
    {
      type: "prose",
      text: "PassportMonie moves money for people about to travel, and the whole direction came from one sentence: make financial infrastructure feel like the start of a trip.",
    },
    { type: "image", media: MEDIA["passportmonie/01-app-icon"] },

    { type: "heading", id: "direction", railLabel: "Direction", text: "Vintage gadgets, botanical texture, Lagos" },
    {
      type: "prose",
      text: "I held three references together at once: vintage gadgets, botanical texture, Lagos iconography. None of them belong together on paper. That's what keeps this from reading like generic fintech branding.",
    },
    { type: "image", media: MEDIA["passportmonie/06-art-direction"] },
    { type: "subheading", text: "Color, type and gradient" },
    {
      type: "prose",
      text: "The palette, Deep Current, Bold Velocity, Neon Pulse, Clear Horizon, Friendly Glow, Ice White, runs warm without losing the contrast a financial product needs to stay usable. DM Sans carries the type because it holds up at the small sizes people actually read inside a banking app; nothing about that choice is decorative. The gradients are spectral and textured instead of flat, so the interface reads as material you can touch.",
    },
    { type: "image", media: MEDIA["passportmonie/03-color"] },
    { type: "image", media: MEDIA["passportmonie/04-typography"] },
    { type: "image", media: MEDIA["passportmonie/05-gradients"] },
    { type: "image", media: MEDIA["passportmonie/02-logotype"] },
    { type: "subheading", text: "How it should sound" },
    {
      type: "prose",
      text: "Fast and direct. Versatile. Personable and warm. Empowering. Four words, and each one is there to stop a playful visual system from turning careless in a product where the stakes are somebody's money.",
    },
    { type: "image", media: MEDIA["passportmonie/07-tone-of-voice"] },

    { type: "heading", id: "applications", railLabel: "Applications", text: "Generated with AI, shipped to production" },
    {
      type: "prose",
      text: "Every asset here was generated with AI and shipped into the live product: onboarding illustrations, wallet card backgrounds, setup banners, a full icon set. One palette runs through all of it. That consistency is the difference between a design system and a folder of nice images.",
    },
    { type: "image", media: MEDIA["passportmonie/12-icon-set"] },
    { type: "image", media: MEDIA["passportmonie/11-in-product"] },
    { type: "image", media: MEDIA["passportmonie/09-onboarding"] },
    { type: "image", media: MEDIA["passportmonie/10-product-screens"] },
    { type: "image", media: MEDIA["passportmonie/08-merch"] },

    { type: "heading", id: "reflection", railLabel: "Reflection", text: "The brief came before the prompt" },
    {
      type: "prose",
      text: "The references, the palette, and the tone pillars existed before I generated a single image. That order is the entire point: I'd already made the decisions, the AI only executed them. That's why the output could ship.",
    },
  ],
};
