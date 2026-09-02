"use client";

import { useEffect, useState } from "react";

/** Matches the `md` breakpoint Tailwind uses to swap the sidebar for a drawer. */
const QUERY = "(max-width: 767px)";

/**
 * Returns false on the server and on first paint, then the real answer.
 *
 * Deliberate: the sidebar's layout is decided in CSS, so this hook exists only
 * for behaviour that CSS cannot express -- deciding whether opening a panel
 * should also open the drawer. Guessing `true` during SSR would pop the drawer
 * open on desktop for a frame.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobile;
}
