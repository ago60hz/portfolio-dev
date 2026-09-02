import { expect, test } from "@playwright/test";

/** 178 / 1077 -- a can's share of the Window, straight off the handoff. */
const CAN_RATIO = 178 / 1077;

async function measure(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".kitchen-stage") as HTMLElement;
    const can = document.querySelector(".can-label") as HTMLElement;
    const canWidth = can.getBoundingClientRect().width;
    return {
      stage: stage.getBoundingClientRect().width,
      can: canWidth,
      // getComputedStyle returns --u as its unresolved clamp() token, so read
      // the resolved value back off the thing it sizes: the can is 178u wide.
      u: canWidth / 178,
    };
  });
}

test.describe("the scene scales by proportion, not by breakpoint", () => {
  test("a can keeps its share of the Window across widths", async ({ page }) => {
    await page.goto("/");

    await page.setViewportSize({ width: 1440, height: 900 });
    const wide = await measure(page);

    await page.setViewportSize({ width: 1180, height: 900 });
    const narrow = await measure(page);

    // Both are above the --u floor, so the ratio must be the design's ratio at
    // BOTH widths. A breakpoint-stepped layout would fail this.
    expect(wide.can / wide.stage).toBeCloseTo(CAN_RATIO, 2);
    expect(narrow.can / narrow.stage).toBeCloseTo(CAN_RATIO, 2);

    // ...and the can genuinely changed size, so this isn't passing by accident.
    expect(narrow.can).toBeLessThan(wide.can - 10);
  });

  test("the scene stops shrinking once it would stop being legible", async ({
    page,
  }) => {
    await page.goto("/");

    await page.setViewportSize({ width: 390, height: 844 });
    const tiny = await measure(page);

    // --u is clamped, so the can holds a readable width and the Window pans
    // instead of crushing the artwork.
    expect(tiny.u).toBeCloseTo(0.62, 2);
    expect(tiny.can).toBeGreaterThan(100);

    const scene = page.locator(".kitchen-scene");
    const width = await scene.evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeGreaterThan(tiny.stage);
  });
});
