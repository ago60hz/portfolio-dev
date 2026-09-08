import { Brand } from "./Brand";
import { SidebarReveal } from "./SidebarReveal";
import { Bio } from "./Bio";
import { FilterChips } from "./FilterChips";
import { StickerStack } from "./StickerStack";
import { cn } from "@/lib/utils";
import { Accordions } from "./Accordions";
import { Footer } from "./Footer";

/**
 * The inner panel. Border weight is asymmetric by design — 2px on the bottom
 * against 1px elsewhere, which reads as a slight lift off the page.
 */
export function Sidebar({ variant = "rail" }: { variant?: "rail" | "drawer" }) {
  const inDrawer = variant === "drawer";

  return (
    <SidebarReveal>
      {/* Packed to the top, footer pinned to the bottom by its own `mt-auto`.
          `justify-between` distributed the spare height BETWEEN every section,
          so a tall tablet rail opened a gap above the bio, another above the
          chips and another above the sticker stack -- the column read as four
          things floating rather than one panel. */}
      <div
        className={cn(
          "flex w-full flex-col rounded-md border border-b-2 border-kitchen-ink bg-kitchen-surface",
          // In the drawer the SHEET scrolls, not this. Two nested `h-full`
          // scrollers inside the sheet's max-height could not size themselves,
          // which is why the panel was cut off and nothing moved.
          inDrawer ? "min-h-full" : "h-full overflow-y-auto",
        )}
      >
        <Brand />
        <Bio />
        <FilterChips />
        {/* The base of the panel: stickers, accordions, footer, together.
            `mt-auto` puts ALL the spare height between the chips and this
            group, so the three read as one block sitting on the bottom edge
            rather than drifting apart down the column.
            The stack is scenery and the drawer has no room to spare for it. */}
        <div className="mt-auto flex w-full shrink-0 flex-col">
          {!inDrawer && <StickerStack />}
          <Accordions />
          <Footer />
        </div>
      </div>
    </SidebarReveal>
  );
}
