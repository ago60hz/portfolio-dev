"use client";

import { useRef, useState } from "react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { AnimatePresence, motion } from "motion/react";
import type { Work } from "@/content/works";
import { exitOffset, matchesFilter } from "@/lib/filters";
import { Reveal, stagger } from "@/components/motion/Reveal";
import { SPRING, T, bootDelay } from "@/lib/motion";
import { useSceneUnit } from "@/hooks/useSceneUnit";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useKitchen } from "@/lib/store";
import { getKitchenSound } from "@/lib/audio/engine";
import { cn } from "@/lib/utils";
import { WorkPopover } from "./work/WorkPopover";
import { WorkSheet } from "./work/WorkSheet";
import { CanArt } from "./can/CanArt";

/**
 * A spice-oil can (Work Card, 1:226) -- everything about it that moves.
 *
 * Three layers, three concerns, and they must stay separate because they all
 * want `transform`:
 *
 *   outer div     the filter exit, slides the can off by its nearest edge
 *   motion.button the hover lift and its ring-out
 *   CanArt        the artwork, which never moves
 */
/**
 * How far the can comes off the shelf, in Figma pixels. The brief asks for
 * "+24px lift off"; expressed in scene units it stays proportional, so a can
 * at half scale is not picked up by half its own height.
 */
const LIFT = 24;

/** The can's own width in scene units, which is how --u gets measured. */
const CAN_UNITS = 178;

/**
 * The ring-out: a decaying wobble as the can is set back down.
 *
 * Module-level so the array keeps its identity across renders -- a fresh array
 * every render retriggers the keyframes on any unrelated store update.
 *
 * The decay is in these numbers rather than in an easing, because motion takes
 * exactly two keyframes with a spring. Pairing this array with SPRING.drop
 * throws at runtime; WorkPopover.test.tsx is what caught it.
 */
const RING_OUT = [0, 1.4, -0.7, 0.28, 0];
const AT_REST = 0;

export function WorkCan({
  work,
  index,
  columns,
}: {
  work: Work;
  /** Position across the whole grid. Decides the exit side. */
  index: number;
  columns: number;
}) {
  const setHoveredWork = useKitchen((s) => s.setHoveredWork);
  const activeFilter = useKitchen((s) => s.activeFilter);
  const booted = useEntranceReady();
  const dismissed = !matchesFilter(work, activeFilter);
  const hovered = useKitchen((s) => s.hoveredWork === work.slug) && !dismissed;
  // Measured off this can's own box, which CSS already sizes at 178u. Reading
  // the --u token instead returns its unresolved clamp() source text.
  const box = useRef<HTMLDivElement>(null);
  const u = useSceneUnit(box, CAN_UNITS);
  const reduced = usePrefersReducedMotion();
  // A can that has never been picked up has nothing to ring out from, and
  // firing the wobble on mount would have every can on the shelf shivering.
  const [everLifted, setEverLifted] = useState(false);
  // Read as a value, not through getState(): the handler has to stay in sync
  // with the toggle without re-subscribing on every pointer move.
  const soundOn = useKitchen((s) => s.soundEnabled);
  /*
   * On a phone the card is a bottom sheet rather than a hover popover -- see
   * WorkSheet. The hover handlers are suppressed there too: a touch fires
   * `pointerenter` and never leaves, so the can stayed lifted with a card
   * hanging off it until you tapped something else.
   */
  const isPhone = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div
      ref={box}
      className="relative flex justify-center"
      // A dismissed can slides off by its nearest edge and fades, rather than
      // the grid reflowing around it: 4:1656 keeps every can at its own column
      // and takes the non-matching ones to opacity 0. CSS rather than a spring
      // because the distance is in scene units, and calc() interpolates here
      // while a JS animation would need --u measured first.
      inert={dismissed || undefined}
      aria-hidden={dismissed || undefined}
      style={{
        width: "var(--can-w)",
        transform: dismissed
          ? `translateX(calc(${exitOffset(index, columns)} * var(--u)))`
          : "translateX(0)",
        opacity: dismissed ? 0 : 1,
        // Explicitly auto, not inherited: the grid above is now
        // pointer-events-none so the garnishes under it stay hoverable.
        pointerEvents: dismissed ? "none" : "auto",
        // The card is 231u wide against the can's 178u and hangs 26u to the
        // left, so it reaches across its neighbours. Every can wrapper is
        // positioned at z-index auto, and positioned siblings at auto paint in
        // tree order -- which puts the NEXT can on top of this one's card and
        // eats clicks meant for its pills. One step up is enough; the whole
        // grid is inside the ul's z-30, so this stays under the shelf lip.
        zIndex: hovered ? 1 : undefined,
        // Set here rather than as a `motion-reduce:` class: the class cannot
        // beat an inline `transition`, so the exit used to run at full length
        // under reduced motion however many variants were stacked on it.
        transition: reduced
          ? "none"
          : "transform var(--duration-max) var(--ease-smooth), opacity var(--duration-state) var(--ease-smooth)",
      }}
      // The lift and the drop are the two sounds the brief names first. They
      // hang off the pointer, not off focus: tabbing through nine cans would
      // otherwise fire nine of each, and a keyboard user never asked for that.
      onPointerEnter={() => {
        if (isPhone) return;
        setHoveredWork(work.slug);
        setEverLifted(true);
        if (soundOn) getKitchenSound().play("canLift");
      }}
      onPointerLeave={() => {
        if (isPhone) return;
        setHoveredWork(null);
        // Only if it was actually picked up. A pointer crossing a dismissed
        // can, or leaving one it never entered, has nothing to set down.
        if (soundOn && everLifted) getKitchenSound().play("canDrop");
      }}
      // Focus is tracked on the wrapper, not the button, so that tabbing from
      // the can INTO the popover's own View link does not blur the can and
      // unmount the element that just took focus. React's onBlur is focusout,
      // so it bubbles and relatedTarget tells us where focus actually went.
      onFocus={() => {
        setHoveredWork(work.slug);
        setEverLifted(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoveredWork(null);
        }
      }}
    >
      <Reveal
        kind="pop"
        booted={booted}
        delay={stagger(bootDelay("cans"), index)}
        className="w-full"
      >
      {/*
        Springs, not one of the `linear()` presets: sweeping the pointer along a
        shelf interrupts this constantly, and a spring redirects from its
        current velocity where a tween restarts from zero.

        Picking up is short and barely bounces -- it is a deliberate act.
        Putting down is longer and looser, because that one is gravity, and it
        carries a small rotation on top so the can rings rather than merely
        bouncing. Only `filter` is left to CSS; letting the class transition
        `transform` too would have it fighting the spring for the same property.
      */}
      <motion.button
        type="button"
        onClick={() => isPhone && setSheetOpen(true)}
        aria-haspopup={isPhone ? "dialog" : undefined}
        aria-label={`${work.title} — ${work.blurb}`}
        aria-expanded={hovered}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center",
          "transition-[filter] duration-(--duration-press) ease-(--ease-slow-down)",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kitchen-ink",
        )}
        initial={false}
        animate={{
          y: hovered ? -LIFT * u : 0,
          rotate: hovered || !everLifted ? AT_REST : RING_OUT,
        }}
        transition={
          hovered
            ? SPRING.lift
            : { y: SPRING.drop, rotate: T.ringOut }
        }
        style={{
          filter: hovered
            ? "drop-shadow(0 4px 20px var(--color-kitchen-lime))"
            : "drop-shadow(-2px 2px 8px rgba(0,0,0,0.25))",
        }}
      >
        <CanArt work={work} />
      </motion.button>
      </Reveal>

      {/*
        The card travels with the can.

        It is anchored 19u below the can's top edge, so when the can was the
        only thing lifting, the gap between them grew by the whole 24u and the
        card no longer read as attached to anything. This carries the same
        lift on a slower spring than the can's own, which is the overlapping
        action the brief asks for: the can leads, the card follows a beat
        behind and then settles.
      */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ y: hovered ? -LIFT * u : 0 }}
        transition={hovered ? SPRING.card : SPRING.drop}
      >
        <AnimatePresence>
          {hovered && !isPhone && <WorkPopover key={work.slug} work={work} />}
        </AnimatePresence>
      </motion.div>

      {isPhone && (
        <WorkSheet work={work} open={sheetOpen} onOpenChange={setSheetOpen} />
      )}
    </div>
  );
}
