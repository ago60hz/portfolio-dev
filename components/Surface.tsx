"use client";

import type { ReactNode } from "react";
import { useOnSand } from "@/hooks/useOnSand";
import { useKitchen } from "@/lib/store";

/**
 * The page ground, which follows the room you are in.
 *
 * A client component only so it can read the route and the one flag that also
 * repaints it; the sidebar and the page pass straight through as children and
 * stay server-rendered. Keeping it this thin is what stops the shared layout
 * from becoming a client boundary and dragging the whole sidebar across with
 * it.
 *
 * Three grounds, one variable: purple in the kitchen, sand while reading a
 * study (51:1569), paper while the gallery is up (457:1411). The route wins --
 * the gallery belongs to the Window, and a study has none.
 */
export function Surface({ children }: { children: ReactNode }) {
  const onSand = useOnSand();
  const infiniteOpen = useKitchen((s) => s.infiniteOpen);

  return (
    <main
      data-surface={onSand ? "sand" : infiniteOpen ? "paper" : "purple"}
      className="bg-kitchen-surface flex h-dvh w-full gap-2 p-2"
    >
      {children}
    </main>
  );
}
