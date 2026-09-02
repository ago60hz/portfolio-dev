/**
 * Category colour coding for the tags painted on a can (1:230 and siblings).
 *
 * These used to be baked into the label artwork, which meant a category colour
 * was a property of a JPEG. The covers are clean now, so colour lives here --
 * one edit re-tints every can that carries the tag.
 */
export const TAG_TONES = {
  product: "lime",
  shipped: "lime",
  brand: "red",
  website: "purple",
  ecommerce: "purple",
  growth: "blue",
} as const;

export type TagTone = (typeof TAG_TONES)[keyof typeof TAG_TONES];

export type WorkTag = {
  /** Exactly as drawn -- the design mixes `website` and `Website`. */
  label: string;
  tone: TagTone;
};

/** Every tag fill is a token, never a hex at the call site. */
export const TONE_CLASS: Record<TagTone, string> = {
  lime: "bg-kitchen-lime",
  red: "bg-kitchen-red",
  purple: "bg-kitchen-purple",
  blue: "bg-kitchen-blue",
};

/** Looks a tone up by label, so content stays declarative. */
export function toneFor(label: string): TagTone {
  const key = label.toLowerCase().replace(/[^a-z]/g, "");
  return TAG_TONES[key as keyof typeof TAG_TONES] ?? "lime";
}

export const tag = (label: string): WorkTag => ({ label, tone: toneFor(label) });
