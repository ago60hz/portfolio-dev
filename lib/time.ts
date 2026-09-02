/** Praise works from Lagos; the kitchen clock shows his time, not the visitor's. */
export const HOME_TZ = "Africa/Lagos";

/**
 * Pure so it can be tested against fixed dates. Always 24-hour, zero-padded,
 * which is what the design draws ("13:26").
 */
export function formatLocalTime(date: Date, timeZone: string = HOME_TZ): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}
