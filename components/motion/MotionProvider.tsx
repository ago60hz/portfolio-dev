"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { spendBoot } from "@/lib/loader";

/**
 * One place that says "respect the visitor's motion preference".
 *
 * `reducedMotion="user"` makes every motion/react animation in the tree drop
 * its transform and layout animations while keeping opacity, which is the
 * behaviour the accessibility guidance asks for and which each component would
 * otherwise have to remember on its own. Before this, the popover's spring had
 * no reduced-motion handling at all.
 *
 * CSS transitions are not covered by it -- those still need their own
 * `motion-reduce:` variant or media query.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  /**
   * Whatever page the app first rendered on, the boot is spent.
   *
   * Child effects run before parent effects, so on the kitchen the loader has
   * already claimed it by the time this fires. On a case study nothing claims
   * it, and navigating to the kitchen afterwards gets the room directly rather
   * than five seconds of a loading screen for a page that is already loaded.
   */
  useEffect(() => {
    spendBoot();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>{children}</TooltipProvider>
    </MotionConfig>
  );
}
