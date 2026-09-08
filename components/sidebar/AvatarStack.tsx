import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type StackItem = { src: string; label?: string };

/**
 * Overlapping image stack used on the accordion rows.
 *
 * Geometry is 21:215: 20x20 at radius 6, on a 16 pitch, so each sits 4 over the
 * one before. The radius was 2px, which is what made the tool icons read as
 * squashed squares rather than rounded tiles.
 *
 * An item with a label becomes a real tooltip trigger -- focusable, so the tool
 * names are reachable by keyboard and not mouse-only. Unlabelled items stay
 * decorative rather than being given an invented name.
 */
export function AvatarStack({
  items,
  shape = "square",
  alt = "",
  /** Show this many, and reveal the rest when the row is hovered or focused. */
  collapseAfter,
}: {
  items: StackItem[];
  shape?: "square" | "circle";
  alt?: string;
  collapseAfter?: number;
}) {
  const round = shape === "circle" ? "rounded-full" : "rounded-[6px]";

  return (
    <span className="flex shrink-0 items-center" aria-label={alt || undefined}>
      {items.map((item, i) => {
        const hidden = collapseAfter !== undefined && i >= collapseAfter;
        const img = (
          <Image
            src={item.src}
            alt={item.label ?? ""}
            aria-hidden={!item.label}
            width={80}
            height={80}
            // The house drop-shadow: 2 along the bottom, 1 elsewhere, no blur.
            className={`size-5 shrink-0 border border-b-2 border-kitchen-ink object-cover ${round}`}
          />
        );

        /* The extra tools collapse to zero width rather than unmounting, so the
           row's own width is the only thing that animates and nothing below it
           jumps. Width, not display, because display cannot transition. */
        const wrap = (inner: React.ReactNode, key: string) => (
          <span
            key={key}
            className={
              "flex overflow-hidden transition-[width,opacity,margin] duration-(--duration-state) ease-(--ease-slow-down) motion-reduce:transition-none " +
              // The 4 overlap (a 16 pitch on a 20 tile, per 21:215) has to
              // collapse with the width, or a hidden item still pulls the stack
              // 4 to the left and the resting row measures short.
              (hidden
                ? "w-0 opacity-0 ml-0 group-hover/accordion-trigger:-ml-1 group-hover/accordion-trigger:w-5 group-hover/accordion-trigger:opacity-100 group-focus-within/accordion-trigger:-ml-1 group-focus-within/accordion-trigger:w-5 group-focus-within/accordion-trigger:opacity-100"
                : `w-5 ${i > 0 ? "-ml-1" : ""}`)
            }
          >
            {inner}
          </span>
        );

        if (!item.label) return wrap(img, item.src);

        return wrap(
          <Tooltip key={item.src}>
            <TooltipTrigger
              // A span, not a button: the accordion trigger is already the
              // interactive ancestor and nesting buttons is invalid.
              render={
                <span
                  tabIndex={hidden ? -1 : 0}
                  className={`flex ${round} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink`}
                />
              }
            >
              {img}
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>,
          item.src,
        );
      })}
    </span>
  );
}
