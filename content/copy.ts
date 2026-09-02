/**
 * Long-form sidebar copy.
 *
 * NOTE: `CHEF_BIO` was transcribed from the Figma render of the expanded
 * "Meet the head Cheff" panel (node 264:985), not from a text source — worth a
 * proofread against the original before launch.
 */
export const CHEF_BIO = [
  "**Agentic workflows are everywhere now.** Every industry is getting them. The pitch is more productivity and more creativity. It does work. I use it every day.",
  "But there's a catch. **When everyone can build, building stops being the advantage.** The harder part is making something people actually want, giving it a reason to exist, and getting it in front of them. That's the part I care about.",
  "I've never thought of Founding Design as \"doing the product\" or \"doing the brand.\" **I want to work across the whole thing.** Find the position. Shape the identity. Build the thing. Ship it. Watch what happens. Fix what doesn't work. Make the experience convert. B2C. B2B. B2B2C.",
  "IJO DISCO is my kitchen. This is what comes out of it. I built and grew Unrefyned Studio's Shopify store myself. In one month, **revenue grew 66%, with 96% of that growth directly traceable to the work.**",
  "I'm interested in that connection: the distance between a good idea, good work, and an actual number on the bottom line. That gap is where I like to work. Look at the work gallery on the right. If it doesn't make the case, tell me what's missing. If it does, let's talk.",
];

/**
 * Tool icons shown as an avatar group on the row, each with the tooltip the
 * design gives it (extracted from the Tooltip instances in 1:189).
 *
 * TODO: six icons, five labels in the file. The last is unlabelled until
 * Praise says what it is -- better a missing tooltip than an invented one.
 */
export const CHEF_TOOLS: { src: string; label?: string }[] = [
  { src: "/assets/tools/tool-0.webp", label: "Interface design & components" },
  { src: "/assets/tools/tool-1.webp", label: "Automation systems & Code" },
  { src: "/assets/tools/tool-2.webp", label: "Marketing websites." },
  { src: "/assets/tools/tool-3.webp", label: "AI art direction" },
  { src: "/assets/tools/tool-4.webp", label: "Storefront & Retention automations" },
  { src: "/assets/tools/tool-5.webp" },
];

/** Teaser shown on the collapsed row. Full content lands in a later version. */
export const ACHIEVEMENTS_TEASER = "50% Delegation Funding for 30M+ Users";

export const COMMENTERS = [
  { name: "Joshua Tabansi", avatar: "/assets/avatars/joshua-tabansi.webp" },
  { name: "Marco de Rossi", avatar: "/assets/avatars/marco-de-rossi.webp" },
  { name: "Tyreek Houston", avatar: "/assets/avatars/tyreek-houston.webp" },
];

/**
 * The one testimonial present in the design (the floating poster). Attribution
 * isn't legible in the mock, so it stays unattributed rather than guessed.
 */
export const TESTIMONIALS: { quote: string; name?: string }[] = [
  {
    quote:
      "He deeply understands problems and communicates transparently.",
  },
];
