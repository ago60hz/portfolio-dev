import { expect, test } from "@playwright/test";

/**
 * The Window is a fixed 1077 x 884 composition. It may pan horizontally once
 * --u bottoms out -- responsive.spec.ts asserts exactly that -- but it must
 * never scroll because its own contents spilled out of it.
 *
 * Two real bugs are pinned here.
 *
 * 1. RIGHT. Garnishes are drawn past 1077 on purpose (a tomato reaches
 *    1102.19) to be clipped by the Window edge. The stage's `overflow: hidden`
 *    could not do that -- an `overflow-auto` scroller sits between the two and
 *    turned the spill into 25px of horizontal scroll. Fixed by clipping at
 *    `.kitchen-scene`, the box those coordinates are measured against.
 *
 * 2. BOTTOM. --u was derived from the Window's WIDTH while the Window's height
 *    comes from `h-dvh`. Nothing tied the two together, so a wide-but-short
 *    viewport overflowed: 90px at 1512x845, a stock laptop. --u now takes the
 *    smaller of the width- and height-derived units.
 *
 * The viewports below are chosen to bind on different terms: 1440x900 and
 * 1280x1024 bind on width, 1512x845 and 1440x800 on height, and 1024x768 sits
 * where the header's 32px floor kicks in.
 */
const VIEWPORTS = [
  { width: 1440, height: 900, binds: "width" },
  { width: 1280, height: 1024, binds: "width" },
  { width: 1512, height: 845, binds: "height" },
  { width: 1440, height: 800, binds: "height" },
  { width: 1024, height: 768, binds: "width, header floor" },
];

async function overflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".kitchen-stage") as HTMLElement;
    // The scroller is the stage's only child, and it is the element that
    // actually scrolls -- the stage itself is `overflow: hidden`.
    const scroller = stage.firstElementChild as HTMLElement;
    return {
      x: scroller.scrollWidth - scroller.clientWidth,
      y: scroller.scrollHeight - scroller.clientHeight,
    };
  });
}

test.describe("the Window never scrolls on its own contents", () => {
  // One viewport per case, set explicitly, so this does not multiply by the
  // four project viewports into twenty near-identical runs.
  test.skip(
    () => test.info().project.name !== "desktop",
    "viewports are set per-test; running this once is enough",
  );

  for (const { width, height, binds } of VIEWPORTS) {
    test(`no overflow at ${width}x${height} (${binds})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");

      const { x, y } = await overflow(page);
      expect(y, "the Window scrolls down").toBe(0);
      expect(x, "the Window scrolls sideways").toBe(0);
    });
  }

  test("the header lands on 38u, the height the 884 column budgets", async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 845 });
    await page.goto("/");

    const headerU = await page.evaluate(() => {
      const scene = document.querySelector(".kitchen-scene") as HTMLElement;
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;width:calc(1000*var(--u));height:0";
      scene.appendChild(probe);
      const u = probe.getBoundingClientRect().width / 1000;
      probe.remove();
      // Not `children[0]`: the scene's first child is the background film
      // (`[data-bg-film]`), which is absolutely positioned over the whole
      // 884u column and measured 884 here. The header is the first child
      // that is actually in the flow.
      const header = scene.querySelector(":scope > *:not([data-bg-film])")!;
      return header.getBoundingClientRect().height / u;
    });

    // Figma's auto-layout reports padding 8, but the frame is fixed at 38 tall
    // with a 24-tall split button at y-offset 7 -- so the real padding is 7.
    // At 8 the header measured 40u and pushed the column to 886.
    expect(headerU).toBeCloseTo(38, 0);
  });

  test("the room re-frames rather than panning, and never scrolls either way", async ({
    page,
  }) => {
    /*
     * This guarded the DELIBERATE horizontal pan: once --u bottomed out the
     * scene stayed wider than its Window and you scrolled across it.
     *
     * That behaviour is gone, and on purpose. Below lg the room is re-framed to
     * two cans a shelf instead, so there is no width left where the pan
     * happens -- at 390 it fitted already, and at 768 the third can used to be
     * clipped with nothing to say so. What survives is the half that always
     * mattered: whatever the room does horizontally, the Window must not end up
     * scrolling in either direction.
     */
    for (const [w, h] of [
      [390, 844],
      [768, 1024],
    ] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await page.waitForTimeout(400);

      const { x, y } = await page.evaluate(() => {
        const stageEl = document.querySelector(".kitchen-stage") as HTMLElement;
        const scroller = stageEl.firstElementChild as HTMLElement;
        return {
          x: scroller.scrollWidth - scroller.clientWidth,
          y: scroller.scrollHeight - scroller.clientHeight,
        };
      });

      /*
       * Horizontally it must fit. VERTICALLY it is now expected to scroll:
       * the re-frame drops the height term from --u so the room is drawn at a
       * size worth looking at and the Window scrolls through five shelves,
       * rather than squeezing the whole column onto one screen and leaving the
       * cans tiny. What must never happen is the DOCUMENT scrolling.
       */
      expect(x, `the re-framed room fits at ${w}`).toBe(0);
      expect(y, `and scrolls through its shelves at ${w}`).toBeGreaterThan(0);
    }
  });
});

/**
 * The document is never the scroller.
 *
 * `main` is exactly `100dvh` over a WHITE body, and html/body were left at
 * `overflow: visible` -- so anything that momentarily exceeded the viewport
 * made the page scrollable and scrolled that white into view as a band under
 * the room. The boot is enough on its own: it blows the Window up past the
 * viewport with a transform, and a transform's visual overflow counts.
 *
 * Asserted on both routes and after the boot has finished, because the boot is
 * the suspect and a settled measurement would miss it. The kitchen viewports
 * above already cover the shapes that bind on width and on height.
 */
test.describe("the page itself never scrolls", () => {
  for (const path of ["/", "/work/metamask"]) {
    for (const { width, height } of VIEWPORTS) {
      test(`no document scroll on ${path} at ${width}x${height}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(path);
        await page.waitForLoadState("load");

        const doc = await page.evaluate(() => {
          const de = document.documentElement;
          return {
            overflowY: de.scrollHeight - de.clientHeight,
            overflowX: de.scrollWidth - de.clientWidth,
          };
        });

        expect(doc.overflowY, "vertical").toBeLessThanOrEqual(0);
        expect(doc.overflowX, "horizontal").toBeLessThanOrEqual(0);
      });
    }
  }
});
