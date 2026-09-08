"use client";

import type { ReactNode } from "react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { Reveal } from "@/components/motion/Reveal";
import { bootDelay } from "@/lib/motion";
import { useOnSand } from "@/hooks/useOnSand";

/**
 * The sidebar's entrance.
 *
 * A client shell so Sidebar itself can stay a server component. It reads
 * `booted` once and hands it down, rather than every child subscribing to the
 * store for the same boolean.
 *
 * On a case study there is no entrance at all. The sidebar is the one thing
 * that survives navigating in there -- it is mounted by the layout, not the
 * page -- so animating it on arrival would be the room's furniture sliding
 * around while the reader is trying to start reading. The case study's motion
 * belongs to the article.
 *
 * `h-full` is load-bearing: Reveal renders a real div between the aside and
 * the panel, and without it the panel loses the height it stretches to.
 */
export function SidebarReveal({ children }: { children: ReactNode }) {
  const booted = useEntranceReady();
  const onSand = useOnSand();

  if (onSand) return <div className="h-full w-full">{children}</div>;

  return (
    <Reveal
      kind="slide-left"
      on="boot"
      booted={booted}
      delay={bootDelay("sidebar")}
      className="h-full w-full"
    >
      {children}
    </Reveal>
  );
}
