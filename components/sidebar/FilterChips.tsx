"use client";

import { Folder, Star } from "lucide-react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { Reveal, stagger } from "@/components/motion/Reveal";
import { bootDelay } from "@/lib/motion";
import { FILTERS } from "@/content/filters";
import { useApplyFilter } from "@/hooks/useApplyFilter";
import { useKitchen } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICONS = { folder: Folder, star: Star } as const;

export function FilterChips() {
  const activeFilter = useKitchen((s) => s.activeFilter);
  const booted = useEntranceReady();
  // Toggles here, but navigates home with the chip set when the visitor is
  // inside a case study. See useApplyFilter.
  const applyFilter = useApplyFilter();

  return (
    // No `flex-1`: growing to fill the rail opened several hundred pixels of
    // dead purple between the chips and the sticker stack on a tablet. The
    // slack belongs at the bottom of the column, not in the middle of it.
    <div className="flex w-full flex-col p-3">
      <ul className="flex flex-wrap content-start items-center gap-2">
        {FILTERS.map((f, i) => {
          const Icon = ICONS[f.icon];
          const active = activeFilter === f.id;
          return (
            // flex, not the default block: the chip is inline-flex, so a block
            // li gives it a line box and the descender space under it pushed the
            // row pitch to 32 where 51:1717 draws 25 (17 + 8).
            <li key={f.id} className="flex">
              <Reveal
                kind="slide-left"
                booted={booted}
                delay={stagger(bootDelay("chips"), i)}
                className="flex"
              >
              <button
                type="button"
                aria-pressed={active}
                onClick={() => applyFilter(f.id)}
                className={cn(
                  // hit-32 expands the click target to 32px without changing
                  // the painted box, which the design draws at 17px tall.
                  // trim-cap is what gets it to 17: Figma trims the label to
                  // its cap height, so the font's leading never pads the box.
                  // Satoshi 500, per the node tree. At 400 every chip renders
                  // narrower than drawn, which is what threw the row wrapping.
                  "chip hit-32 trim-cap springy cursor-pointer text-body font-medium",
                  // Same 2-bottom drop shadow as the tool tiles. The chip has a
                  // fixed height and border-box sizing, so this costs no layout.
                  "hover:border-b-2",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink",
                  // Selected state is 51:1722: lime fill, ink border, ink
                  // label. The .chip class already supplies the ink border and
                  // radius 8, so only the fill and label colour change here.
                  // Ink on lime is ~15:1, and it reads the same on either
                  // surface -- the chip stops depending on the ground behind it.
                  active
                    ? "bg-kitchen-lime text-kitchen-ink"
                    : "hover:bg-kitchen-ink hover:text-kitchen-surface",
                )}
              >
                <Icon aria-hidden className="size-3 shrink-0" />
                {/* No clear affordance: 51:1722 does not draw one, and adding
                    an icon only on the selected chip changes its width, which
                    re-wraps the rows underneath it. The whole chip toggles, and
                    aria-pressed carries the state. */}
                {f.label}
              </button>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
