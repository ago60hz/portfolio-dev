"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "motion/react";
import { T, beat } from "@/lib/motion";

/**
 * One entrance, two triggers.
 *
 * `boot` waits for the loader to hand the room over and fires at its beat off
 * lib/motion's BOOT table. `view` waits for the element to reach the viewport
 * and fires once. Everything that enters on this site goes through here, which
 * is what stops the entrance becoming nine components each holding their own
 * magic delay.
 *
 * Reduced motion is handled by MotionConfig at the root: it drops the
 * transforms and keeps the opacity, so this stays one code path.
 *
 * It renders a plain div. The wall gallery's pinned artwork is absolutely
 * positioned and cannot take a wrapper without losing its box, so that one
 * animates its own spans against the same transitions from lib/motion.
 */
export type RevealKind = "slide-left" | "slide-top" | "pop" | "rise" | "arrive";

/**
 * `pop` starts at 0.86 rather than 0, for two reasons: something growing from
 * nothing reads as a glitch, and the overshoot curve multiplies the delta --
 * from 0 its 1.68 peak is a 68% overshoot, from 0.86 it is a 9% bloom.
 */
const FROM: Record<RevealKind, TargetAndTransition> = {
  "slide-left": { opacity: 0, x: -24 },
  "slide-top": { opacity: 0, y: -20 },
  pop: { opacity: 0, scale: 0.86 },
  rise: { opacity: 0, y: 18 },
  // The case study's sections: the brief asks for "move and scale in effect,
  // direction down-up, initial scale at like 110%". Starting ABOVE full size
  // and settling down to it reads as the section coming toward the reader.
  arrive: { opacity: 0, y: 24, scale: 1.1 },
};

const TO: TargetAndTransition = { opacity: 1, x: 0, y: 0, scale: 1 };

/** `pop` is the one that wants the overshoot; the rest arrive and stop. */
const EASE: Record<RevealKind, Transition> = {
  "slide-left": T.enter,
  "slide-top": T.enter,
  pop: T.pop,
  rise: T.enter,
  arrive: T.enter,
};

/**
 * The same entrance as `Reveal`, as props you can spread onto your own
 * `motion` element.
 *
 * For the places a wrapper div would break the layout: the Window header is a
 * flex child the scene column measures, and the gallery's pinned artwork is
 * absolutely positioned. Both animate themselves, and both get exactly the
 * numbers Reveal uses -- which is the point of exporting this rather than
 * letting those two files invent their own.
 */
export function useRevealProps(kind: RevealKind, shown: boolean, delay = 0) {
  const reduced = useReducedMotion();
  const [readyAtMount] = useState(shown);
  // Someone who has asked for less motion should not have to wait out a
  // sequence they opted out of -- and, more to the point, must never be left
  // looking at an empty room if the handover never arrives. So reduced motion
  // is not "the same entrance, faster"; it is no entrance, and the content is
  // simply present from the first paint.
  if (reduced || readyAtMount)
    return { "data-reveal": kind, initial: false as const, animate: TO };
  return {
    "data-reveal": kind,
    initial: FROM[kind],
    animate: shown ? TO : FROM[kind],
    transition: { ...EASE[kind], delay: shown ? delay : 0 },
  };
}

export function Reveal({
  children,
  kind = "rise",
  delay = 0,
  on = "boot",
  booted,
  className,
  style,
}: {
  children: ReactNode;
  kind?: RevealKind;
  /** Seconds. Use lib/motion's `bootDelay` rather than a literal. */
  delay?: number;
  on?: "boot" | "view";
  /** Only for `on="boot"`. Passed in so one store read can serve many Reveals. */
  booted?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (on !== "view" || seen) return;
    const el = ref.current;
    if (!el) return;
    // Rooted at the case study's own scroller. The kitchen does not scroll and
    // the window is never the scroll container -- ProgressRail makes the same
    // choice for the same reason.
    const root = document.querySelector<HTMLElement>("[data-study-scroll]");
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setSeen(true),
      { root, rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on, seen]);

  const shown = on === "boot" ? !!booted : seen;
  // Ready before the first paint means there is nothing to enter FROM. A case
  // study is in that position: it never runs the loader, so its sidebar is
  // ready on mount and should simply be there.
  const [readyAtMount] = useState(shown);
  // See useRevealProps: reduced motion is no entrance, not a quick one.
  const anim = reduced || readyAtMount
    ? { initial: false as const, animate: TO }
    : {
        initial: FROM[kind],
        animate: shown ? TO : FROM[kind],
        transition: { ...EASE[kind], delay: shown ? delay : 0 },
      };

  return (
    <motion.div
      ref={ref}
      // A stable hook for the motion spec, which otherwise has to guess at
      // wrapper depth -- and did, measuring the button inside instead of the
      // wrapper that actually carries the opacity.
      data-reveal={kind}
      className={className}
      style={style}
      {...anim}
    >
      {children}
    </motion.div>
  );
}

/** Sugar for a staggered run: seconds for the nth item after `base`. */
export const stagger = (base: number, i: number) => base + beat(i);
