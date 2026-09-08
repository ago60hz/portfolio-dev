import { describe, expect, it } from "vitest";
import { TRAIL } from "./trail.generated";

describe("the trail pool", () => {
  it("has images, with measured dimensions", () => {
    expect(TRAIL.length).toBeGreaterThan(0);
    for (const t of TRAIL) {
      expect(t.src).toMatch(/^\/assets\/trail\/trail-\d\d\.webp$/);
      expect(t.width).toBeGreaterThan(0);
      expect(t.height).toBeGreaterThan(0);
    }
  });

  it("is resized for the loader rather than shipped at source size", () => {
    // These start life as 1080-1440px camera JPEGs. The loader waits on them,
    // so shipping them whole would make the animation the slowest thing it is
    // loading. They paint at 220 wide; 440 covers 2x.
    for (const t of TRAIL) expect(t.width).toBeLessThanOrEqual(440);
  });
});
