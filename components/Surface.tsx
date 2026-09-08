"use client";

import type { ReactNode } from "react";
import { useOnSand } from "@/hooks/useOnSand";

/**
 * The page ground, which follows the room you are in.
 *
 * A client component only so it can read the route; the sidebar and the page
 * pass straight through as children and stay server-rendered. Keeping it this
 * thin is what stops the shared layout from becoming a client boundary and
 * dragging the whole sidebar across with it.
 */
export function Surface({ children }: { children: ReactNode }) {
  return (
    <main
      data-surface={useOnSand() ? "sand" : "purple"}
      className="bg-kitchen-surface flex h-dvh w-full gap-2 p-2"
    >
      {children}
    </main>
  );
}
