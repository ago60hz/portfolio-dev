"use client";

import { Folder, Star, X } from "lucide-react";
import { FILTERS } from "@/content/filters";
import { useKitchen } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICONS = { folder: Folder, star: Star } as const;

export function FilterChips() {
  const activeFilter = useKitchen((s) => s.activeFilter);
  const toggleFilter = useKitchen((s) => s.toggleFilter);

  return (
    <div className="flex w-full flex-1 flex-col p-3">
      <ul className="flex flex-wrap content-start items-center gap-2">
        {FILTERS.map((f) => {
          const Icon = ICONS[f.icon];
          const active = activeFilter === f.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggleFilter(f.id)}
                className={cn(
                  // hit-32 expands the click target to 32px without changing
                  // the painted box, which the design draws at 17px tall.
                  // trim-cap is what gets it to 17: Figma trims the label to
                  // its cap height, so the font's leading never pads the box.
                  // Satoshi 500, per the node tree. At 400 every chip renders
                  // narrower than drawn, which is what threw the row wrapping.
                  "chip hit-32 trim-cap cursor-pointer text-body font-medium",
                  "transition-colors duration-(--duration-press)",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink",
                  "active:scale-[0.97]",
                  active
                    ? "bg-kitchen-ink text-kitchen-purple"
                    : "hover:bg-kitchen-ink hover:text-kitchen-purple",
                )}
              >
                <Icon aria-hidden className="size-3 shrink-0" />
                {f.label}
                {/* The active chip reveals a clear affordance, as Chip/hover
                    draws it. Decorative: the whole chip already toggles. */}
                {active && <X aria-hidden className="size-3 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
