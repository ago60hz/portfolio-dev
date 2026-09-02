"use client";

import { useEffect, useState } from "react";
import { formatLocalTime, HOME_TZ } from "@/lib/time";

/**
 * Returns null on the server and on first paint, then the live time.
 *
 * Deliberate: rendering a timestamp during SSR guarantees a hydration mismatch,
 * because the server's clock is never the client's. Callers render a stable
 * placeholder while this is null.
 */
export function useLocalTime(timeZone: string = HOME_TZ): string | null {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(formatLocalTime(new Date(), timeZone));
    tick();
    // Align to the next minute boundary, then tick once a minute — not once a
    // second, which would re-render 60x more often for no visible change.
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000));

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [timeZone]);

  return time;
}
