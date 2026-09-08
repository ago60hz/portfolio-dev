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

    // 320, not 390. The phone frame is 480u now, so 390 resolves --u at ~0.78
    // and it is the smallest phones that actually sit on the floor.
    await page.setViewportSize({ width: 320, height: 844 });
    const tiny = await measure(page);

    /*
     * The floor is a GUARANTEE, not a target. Pinned to 0.62 exactly, this
     * asserted an accident: the old 600u frame happened to resolve to the
     * floor on a phone, so the number looked deliberate. At 480u a 320px
     * screen lands at 0.629 -- just above it -- and the floor only binds
     * somewhere below 305px of viewport, which is narrower than anything
     * being supported. What has to hold at the narrowest width is that --u
     * never goes under the clamp and a can never becomes illegible.
     */
    expect(tiny.u).toBeGreaterThanOrEqual(0.62);
    expect(tiny.can).toBeGreaterThan(100);

    /*
     * What happens with the width left over is what changed, and it changed
     * twice. This first asserted the scene was WIDER than its Window at 390 --
     * that the room panned sideways. Then the phone frame landed and the
     * assertion moved to a portrait tablet, where panning was still the truth.
     * Now the re-frame covers everything below lg, so there is no supported
     * width left that pans at all.
     *
     * The floor still does its job -- that is the two assertions above, and
     * they are the ones worth keeping. What follows the clamp is now a re-frame
     * rather than a pan, so this checks the room FITS.
     */
    const fits = await page.evaluate(() => {
      const scroller = document.querySelector(".kitchen-scene")!.parentElement!;
      return scroller.scrollWidth - scroller.clientWidth;
    });
    expect(fits, "the re-framed room fits its Window").toBe(0);
  });
});

/**
 * The phone frame.
 *
 * Below md the room is re-framed to 600 x 1344 units and the shelves carry two
 * cans instead of three, rather than the scene panning sideways and hiding
 * about half of itself. These assert the two things that made it worth doing:
 * the shelf actually reflows, and nothing is left off-screen.
 */
test.describe("the phone frame", () => {
  test("reflows to two cans a shelf and never scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForFunction(() => !document.querySelector("[data-loader]"), null, {
      timeout: 20_000,
    });
    await page.waitForTimeout(2000);

    // Nine works over two-can shelves is five shelves, not three.
    await expect(page.locator("section[aria-label^='Shelf']")).toHaveCount(5);
    await expect(page.locator(".can-grid").first().locator("> li")).toHaveCount(2);

    const overflow = await page.evaluate(() => {
      const scroller = document.querySelector(".kitchen-scene")!.parentElement!;
      return {
        scene: scroller.scrollWidth - scroller.clientWidth,
        doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    // The whole point: no sideways pan, and the document still never scrolls.
    expect(overflow.scene).toBe(0);
    expect(overflow.doc).toBe(0);

    // Both cans are inside the Window, which is what "no pan" has to mean in
    // practice -- zero overflow with a can clipped off the edge would pass the
    // check above and still be broken.
    const bounds = await page.evaluate(() => {
      const grid = document.querySelector(".can-grid")!;
      const r = grid.getBoundingClientRect();
      return [...grid.children].map((li) => {
        const b = li.getBoundingClientRect();
        return b.left >= r.left - 1 && b.right <= r.right + 1;
      });
    });
    expect(bounds).toEqual([true, true]);
  });

  test("a case study still reflows rather than panning", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/work/metamask");
    await page.waitForTimeout(1500);
    const doc = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(doc).toBe(0);
  });
});
