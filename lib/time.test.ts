import { describe, expect, it } from "vitest";
import { formatLocalTime, HOME_TZ } from "./time";

describe("formatLocalTime", () => {
  it("renders Lagos time by default", () => {
    // 12:26 UTC -> 13:26 in Lagos (UTC+1, no DST).
    expect(formatLocalTime(new Date("2026-09-01T12:26:00Z"))).toBe("13:26");
  });

  it("zero-pads both fields", () => {
    expect(formatLocalTime(new Date("2026-09-01T08:05:00Z"))).toBe("09:05");
  });

  it("uses 24-hour time, never AM/PM", () => {
    const t = formatLocalTime(new Date("2026-09-01T20:00:00Z"));
    expect(t).toBe("21:00");
    expect(t).not.toMatch(/[ap]m/i);
  });

  it("rolls over midnight in the target zone, not UTC", () => {
    // 23:30 UTC is already 00:30 the next day in Lagos.
    expect(formatLocalTime(new Date("2026-09-01T23:30:00Z"))).toBe("00:30");
  });

  it("honours an explicit zone", () => {
    const d = new Date("2026-09-01T12:00:00Z");
    expect(formatLocalTime(d, "UTC")).toBe("12:00");
    expect(formatLocalTime(d, "America/New_York")).toBe("08:00");
    expect(formatLocalTime(d, HOME_TZ)).toBe("13:00");
  });
});
