import { TONE_CLASS, type WorkTag as Tag } from "@/content/tags";
import { cn } from "@/lib/utils";

/**
 * A category tag on a can label (1:245).
 *
 * Dashed black border, category fill, and two inset shadows that curve the
 * chip around the tin -- the same cylindrical trick the label itself uses,
 * which is what keeps the tag looking printed on rather than stuck over.
 *
 * Scales with the can, so its box is in --u; only the type is absolute.
 */
export function WorkTag({ tag }: { tag: Tag }) {
  return (
    <span
      className={cn(
        "chip trim-cap relative border-dashed text-kitchen-ink",
        TONE_CLASS[tag.tone],
      )}
      style={{
        // Scales with the can: this one IS scene geometry, unlike the sidebar
        // chips, which sit at absolute sizes.
        // Floored, like every other piece of type in the room. The box is
        // scene geometry and scales, but at the phone frame's 0.62 u it came
        // out 8.7px tall around 7.4px text -- the tags read as coloured
        // smudges rather than as words. The floors cost nothing above ~1000px
        // of Window, where the scaled value is already the larger of the two.
        ["--chip-h" as string]: "max(calc(14 * var(--u)), 15px)",
        gap: "max(calc(4 * var(--u)), 3px)",
        paddingInline: "max(calc(6 * var(--u)), 5px)",
        fontSize: "max(calc(12 * var(--u)), 10px)",
        boxShadow: "1px 0 1px 0 rgba(0,0,0,0.25)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-0.5px] rounded-[inherit]"
        style={{
          boxShadow:
            "inset -6px 0 8px 0 rgba(255,255,255,0.25), inset 6px 0 8px 0 rgba(0,0,0,0.25)",
        }}
      />
      {tag.label}
    </span>
  );
}
