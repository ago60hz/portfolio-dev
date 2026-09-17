import type { CaseStudy } from "./types";
import { metamask } from "./metamask";
import { bonadocs } from "./bonadocs";
import { passportmonie } from "./passportmonie";
import { dean } from "./dean";
import { axiaAfrica } from "./axia-africa";

/**
 * The five works with a case study in this version.
 *
 * Order is what the "next case study" footer follows, wrapping at the end, so
 * it is a reading order rather than the shelf order in content/works.ts. The
 * other four works link somewhere off-site instead -- see `href` there.
 *
 * DEEPEST FIRST, thinning to the showreels. Someone who follows the footer
 * from the first study reads the fullest argument while they still have the
 * patience for it, and the reel pieces land as a closing gallery rather than
 * as studies that turned out to have nothing in them.
 *
 * Measured, not guessed -- body words and visual blocks per study:
 *
 *   metamask        1046 words   5 sections, 8 subheads, metrics, quote
 *   bonadocs         799 words   5 sections, 6 subheads, 16 visuals, metrics
 *   passportmonie    306 words   4 sections, 12 visuals -- a heavy reel
 *   axia-africa      840 words   5 sections, 9 subheads, 6 visuals, list
 *   dean             164 words   2 sections, 1 sheet
 *
 * MetaMask leads over Bonadocs on the strength of the writing, which is what
 * a reading order should follow; Bonadocs carries more pictures but a third
 * less argument.
 *
 * Praise's call overrides that for the last two changes on the shelf: Axia
 * Africa took Bonadocs' place in the top row, and Bonadocs moved down to the
 * slot Fagbemi Studios left. This list follows the shelf, so the footer never
 * contradicts the order a visitor has already been shown.
 */
export const CASE_STUDIES: CaseStudy[] = [
  metamask,
  axiaAfrica,
  passportmonie,
  dean,
  bonadocs,
];

export const studyBySlug = (slug: string) =>
  CASE_STUDIES.find((s) => s.slug === slug);

/** The one after `slug`, wrapping. Undefined only if the slug is unknown. */
export const nextStudy = (slug: string) => {
  const i = CASE_STUDIES.findIndex((s) => s.slug === slug);
  return i === -1 ? undefined : CASE_STUDIES[(i + 1) % CASE_STUDIES.length];
};

export type { CaseStudy, Block, Media, Loop } from "./types";
export { headingsOf } from "./types";
