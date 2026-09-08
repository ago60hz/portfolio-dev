import { describe, expect, it } from "vitest";
import { activeSection, isRead, playheadFor, tickCount, tickFor, tickWidth } from "./rail";

describe("progress rail geometry", () => {
  it("fits ticks to the height at the design pitch", () => {
    expect(tickCount(176)).toBe(17); // the sketch's own rail, 35:313
    expect(tickCount(0)).toBe(2); // never degenerate
  });

  it("places a section by its share of the article", () => {
    expect(tickFor(0, 1000, 17)).toBe(0);
    expect(tickFor(500, 1000, 17)).toBe(8);
    expect(tickFor(1000, 1000, 17)).toBe(16);
  });

  it("clamps rather than running off the end of the rail", () => {
    expect(tickFor(9999, 1000, 17)).toBe(16);
    expect(tickFor(-50, 1000, 17)).toBe(0);
    expect(tickFor(100, 0, 17)).toBe(0);
  });

  describe("the travelling bump", () => {
    it("peaks under the playhead and tapers away from it", () => {
      const at = (i: number) => tickWidth(i, [], 10);
      expect(at(10)).toBe(40);
      // Monotonically decreasing in both directions.
      for (let d = 1; d <= 7; d++) {
        expect(at(10 + d)).toBeLessThan(at(10 + d - 1));
        expect(at(10 - d)).toBeLessThan(at(10 - d + 1));
      }
    });

    it("is symmetrical", () => {
      for (let d = 1; d <= 7; d++) {
        expect(tickWidth(10 + d, [], 10)).toBe(tickWidth(10 - d, [], 10));
      }
    });

    it("returns to base width beyond its reach", () => {
      expect(tickWidth(30, [], 10)).toBe(10);
      expect(tickWidth(0, [], 30)).toBe(10);
    });

    /**
     * This is what the sketch actually draws. 35:313 shows the rail scrolled to
     * the top, so its opening run is the bump parked at tick 0 -- not a fixed
     * decorative ramp, which is how it was first (wrongly) read.
     */
    it("reproduces the sketch's opening run with the playhead at the top", () => {
      const drawn = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => tickWidth(i, [0, 8, 16], 0));
      expect(drawn[0]).toBe(40); // longest, as drawn
      expect(drawn[7]).toBe(10); // back to base by the eighth
      expect(drawn).toEqual([...drawn].sort((a, b) => b - a)); // strictly stepping down
    });
  });

  it("keeps section ticks longer than their neighbours, away from the playhead", () => {
    expect(tickWidth(8, [0, 8, 16], 30)).toBe(29);
    expect(tickWidth(9, [0, 8, 16], 30)).toBe(10);
  });

  it("never lets a section under the playhead exceed the peak", () => {
    // max(), not a sum: a section at the playhead is 40, not 69.
    expect(tickWidth(8, [8], 8)).toBe(40);
  });

  it("marks everything above the playhead as read", () => {
    expect(isRead(3, 10)).toBe(true);
    expect(isRead(10, 10)).toBe(false);
    expect(isRead(11, 10)).toBe(false);
  });

  it("maps scroll position onto a tick", () => {
    expect(playheadFor(0, 2000, 1000, 17)).toBe(0);
    expect(playheadFor(500, 2000, 1000, 17)).toBe(8);
    expect(playheadFor(1000, 2000, 1000, 17)).toBe(16);
    expect(playheadFor(9999, 2000, 1000, 17)).toBe(16); // clamped
    expect(playheadFor(0, 0, 0, 17)).toBe(0); // no division by zero
  });

  it("switches section at the reading line, not the viewport edge", () => {
    const tops = [0, 800, 1600];
    expect(activeSection(tops, 100)).toBe(0);
    expect(activeSection(tops, 799)).toBe(0);
    expect(activeSection(tops, 800)).toBe(1);
    expect(activeSection(tops, 5000)).toBe(2);
  });
});
