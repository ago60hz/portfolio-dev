import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, taught our type scale.
 *
 * Out of the box it groups every `text-*` class together and keeps only the
 * last, so `cn("text-body", active && "text-kitchen-ink")` silently DROPS
 * `text-body` -- the selected filter chip was rendering at the browser default
 * 16px instead of 14, which also made it wider than its unselected neighbours
 * and re-wrapped the rows.
 *
 * Listing the scale here tells the merger these are font sizes, not colours, so
 * a size and a colour can coexist on one element.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["logo", "lead", "body", "fine", "micro", "title"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
