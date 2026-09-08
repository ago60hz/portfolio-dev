import { COMMENTS } from "./comments";

/**
 * The sidebar sticker stack (86:224). Cards pile on top of each other; tapping
 * the top one sends it to the back.
 *
 * Two kinds of card, drawn identically -- a pull-quote from a comment, and an
 * achievement. That is deliberate: the stack replaces the Clients &
 * Achievements accordion, so it has to carry both.
 *
 * PROVENANCE, because half of this is quoting real people:
 *
 * - Every `quote` is a VERBATIM fragment of the corresponding body in
 *   comments.ts, shortened only by an ellipsis where words are dropped -- the
 *   same treatment 86:230 gives Tyreek's. Nothing is paraphrased. If you edit
 *   one, check it still appears word-for-word in the source.
 * - Achievement numbers are lifted from the `metrics` blocks of the case
 *   studies, not invented: 30M+ and ~50% from metamask.ts:112-113, the protocol
 *   list and the fellowship from bonadocs.ts:113-114.
 * - The 66% revenue figure is the one already painted on the kitchen's revenue
 *   sticker. Its client attribution is the one thing here NOT sourced from a
 *   case study -- Praise to confirm before this ships.
 */

export type StackSticker = {
  id: string;
  /** `**bold**` marks the phrase the eye should land on first. */
  text: string;
  /** Taped to the card's right edge, as Poster draws it. */
  photo: string;
  /** Spoken to screen readers in place of the markup. */
  label: string;
};

const avatar = (id: string) =>
  COMMENTS.find((c) => c.id === id)!.author.avatar;

const name = (id: string) => COMMENTS.find((c) => c.id === id)!.author.name;

export const STACK: StackSticker[] = [
  // Tyreek first, per the brief. 86:230 is this exact excerpt.
  {
    id: "tyreek",
    text: "“He **deeply understands problems** ... communicates transparently...”",
    photo: avatar("tyreek"),
    label: `${name("tyreek")}: he deeply understands problems and communicates transparently`,
  },
  {
    id: "marco",
    text: "“Strong design taste with **exceptional speed of execution**...”",
    photo: avatar("marco"),
    label: `${name("marco")}: strong design taste with exceptional speed of execution`,
  },
  {
    id: "joshua",
    text: "“Exceptional **product thinking and design taste**...”",
    photo: avatar("joshua"),
    label: `${name("joshua")}: exceptional product thinking and design taste`,
  },
  {
    id: "metamask-users",
    text: "**30M+ users** on the MetaMask flow",
    photo: "/assets/client-icons/metamask.webp",
    label: "30M plus users on the MetaMask flow",
  },
  {
    id: "bonadocs-protocols",
    text: "Adopted by **Arbitrum, Compound, Optimism, Base**",
    photo: "/assets/client-icons/bonadocs.webp",
    label: "Adopted by Arbitrum, Compound, Optimism and Base",
  },
  {
    id: "metamask-delegation",
    text: "**~50% better** delegation completion",
    photo: "/assets/client-icons/metamask.webp",
    label: "About 50 percent better delegation completion",
  },
  {
    id: "bonadocs-fellowship",
    text: "**Consensys Fellowship**, maiden cohort",
    photo: "/assets/client-icons/bonadocs.webp",
    label: "Selected for the maiden Consensys Fellowship",
  },
  // 78:242 draws this one, and the kitchen's revenue sticker carries it too.
  {
    id: "revenue",
    text: "**66% revenue growth** in a month",
    photo: "/assets/poster/revenue-photo.webp",
    label: "66 percent revenue growth in a month",
  },
];
