"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { FilterId } from "@/content/filters";
import { useOnSand } from "@/hooks/useOnSand";
import { useKitchen } from "@/lib/store";

/**
 * Choosing a filter, from anywhere in the app.
 *
 * In the kitchen a chip is a toggle -- pressing the active one clears it, which
 * is what `aria-pressed` on those buttons promises.
 *
 * Inside a case study there is no shelf to filter, so the same press means
 * something else: go back and show me this. It sets the chip outright rather
 * than toggling (a study whose category is already the active filter would
 * otherwise navigate home to a cleared shelf) and then routes to `/`, where the
 * sidebar -- which lives in the shared layout and never unmounts -- is already
 * showing that chip as selected when the kitchen paints.
 *
 * Both the sidebar chips and the study breadcrumb's category call this, so the
 * two can never disagree about what a filter press does.
 */
export function useApplyFilter(): (id: FilterId) => void {
  const router = useRouter();
  const onSand = useOnSand();
  const toggleFilter = useKitchen((s) => s.toggleFilter);
  const setFilter = useKitchen((s) => s.setFilter);

  return useCallback(
    (id: FilterId) => {
      if (!onSand) {
        toggleFilter(id);
        return;
      }
      setFilter(id);
      router.push("/");
    },
    [onSand, router, setFilter, toggleFilter],
  );
}
