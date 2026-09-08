"use client";

import { useKitchen } from "@/lib/store";

/**
 * The 20% dim over the Window while a filter is active (V1 brief).
 *
 * Sits at z-25: above the wall, the garnishes and the shelf fronts, and BELOW
 * the cans at z-30. Dimming the cans as well would defeat the point -- the
 * overlay exists to push the kitchen back so the remaining cans read as the
 * subject, not to darken the whole picture evenly.
 *
 * Note this layer is not in 4:1656; the design carries no dim of its own. It is
 * built from the brief, which asks for one explicitly.
 */
export function FilterOverlay() {
  const active = useKitchen((s) => s.activeFilter) !== null;
  const revealed = useKitchen((s) => s.galleryRevealed);

  // The gallery's reveal dims harder than a filter does, and for the opposite
  // reason: a filter pushes the room back so the surviving CANS read as the
  // subject, where the reveal is putting the board in front of everything.
  // So it also sits at a different depth -- above the cans and the shelf lips,
  // not below them. There is no case where both are on.
  const opacity = revealed ? 0.5 : active ? 0.2 : 0;

  return (
    <div
      aria-hidden
      className={`absolute inset-0 bg-kitchen-ink transition-opacity duration-(--duration-state) ease-(--ease-smooth) motion-reduce:transition-none ${revealed ? "z-[45] pointer-events-auto" : "z-25 pointer-events-none"}`}
      style={{ opacity }}
    />
  );
}
