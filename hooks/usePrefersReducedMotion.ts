"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * Whether the reader has asked for less motion.
 *
 * useSyncExternalStore rather than an effect, because this is a subscription to
 * something outside React: it stays correct if the setting is changed mid-visit,
 * and it reads the real value on the first client render instead of flashing the
 * wrong answer for a frame. The server assumes motion is fine and hydration
 * corrects it -- the alternative would hold every video back for everyone.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
