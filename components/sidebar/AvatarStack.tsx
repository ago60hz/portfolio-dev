import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type StackItem = { src: string; label?: string };

/**
 * Overlapping image stack used on the accordion rows.
 *
 * An item with a label becomes a real tooltip trigger -- focusable, so the tool
 * names are reachable by keyboard and not mouse-only. Unlabelled items stay
 * decorative rather than being given an invented name.
 */
export function AvatarStack({
  items,
  shape = "square",
  alt = "",
}: {
  items: StackItem[];
  shape?: "square" | "circle";
  alt?: string;
}) {
  const cls = (i: number) =>
    "size-5 shrink-0 border border-kitchen-ink object-cover " +
    (shape === "circle" ? "rounded-full " : "rounded-[2px] ") +
    (i > 0 ? "-ml-1" : "");

  return (
    <span className="flex shrink-0 items-center" aria-label={alt || undefined}>
      {items.map((item, i) => {
        const img = (
          <Image
            src={item.src}
            alt={item.label ?? ""}
            aria-hidden={!item.label}
            width={80}
            height={80}
            className={cls(i)}
          />
        );

        if (!item.label) return <span key={item.src}>{img}</span>;

        return (
          <Tooltip key={item.src}>
            <TooltipTrigger
              // A span, not a button: the accordion trigger is already the
              // interactive ancestor and nesting buttons is invalid.
              render={<span tabIndex={0} className="flex rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink" />}
            >
              {img}
            </TooltipTrigger>
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </span>
  );
}
