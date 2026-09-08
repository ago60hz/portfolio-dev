import { expect, test } from "@playwright/test";

/**
 * The wall gallery has two states: peek, and revealed (121:395 / 121:838).
 * Desktop only -- the gallery is a composition of the 1077-wide Window, and the
 * narrower projects pan it rather than laying it out differently.
 */
test.describe("the wall gallery", () => {
  test.skip(() => test.info().project.name !== "desktop", "a desktop composition");

  const gallery = (page: import("@playwright/test").Page) =>
    page.locator("[data-wall-gallery]");

  async function ready(page: import("@playwright/test").Page) {
    await page.goto("/");
    await page.waitForLoadState("load");
    // The radio's scene init blocks the main thread once; a gesture landing
    // inside that window gets dropped.
    await expect
      .poll(() => page.locator("canvas").evaluate((c) => c.getBoundingClientRect().width), {
        timeout: 30_000,
      })
      .toBeLessThan(200);
  }

  test("a scroll down reveals it, a scroll up puts it back", async ({ page }) => {
    await ready(page);
    await page.locator(".kitchen-stage").hover();

    await page.mouse.wheel(0, 120);
    await expect(gallery(page)).toHaveAttribute("data-revealed", "true");

    await page.mouse.wheel(0, -120);
    await expect(gallery(page)).not.toHaveAttribute("data-revealed", "true");
  });

  test("clicking it reveals it, clicking the room dismisses it", async ({ page }) => {
    await ready(page);

    // Clear of the radio on purpose. It is mounted in the layout now, so it is
    // no longer a descendant of the gallery and Playwright's actionability
    // check treats it as an element intercepting the click -- which is exactly
    // what it is, and exactly what the containment fix in WallGallery handles
    // for a real pointer.
    await gallery(page).click({ position: { x: 220, y: 20 } });
    await expect(gallery(page)).toHaveAttribute("data-revealed", "true");

    // Pressing the radio must not read as a click on the room. It sits over the
    // board and outside its subtree, so `contains` alone said "outside" and
    // shut the gallery the moment anyone reached for the power button.
    await page.locator("[data-radio-slot]").click({ position: { x: 4, y: 4 } });
    await expect(gallery(page)).toHaveAttribute("data-revealed", "true");

    // The header is inside the Window but outside the board.
    await page.locator(".kitchen-stage").click({ position: { x: 500, y: 12 } });
    await expect(gallery(page)).not.toHaveAttribute("data-revealed", "true");
  });

  test("revealed, it scales from the floor and dims the cans with the room", async ({ page }) => {
    await ready(page);
    // The board carries the transform, not the gallery root -- the radio hangs
    // outside it so a WebGL canvas never sits under a scaled ancestor.
    const board = page.locator("[data-gallery-board]");
    const before = await board.boundingBox();

    await gallery(page).click({ position: { x: 220, y: 20 } });
    await expect(gallery(page)).toHaveAttribute("data-revealed", "true");
    await page.waitForTimeout(400);
    const after = await board.boundingBox();

    expect(after!.width).toBeGreaterThan(before!.width * 1.9);

    // At peek the board sits mostly BELOW the Window floor and only its top
    // edge shows; revealing lifts it back up and scales it. So both edges move
    // upward, and the bottom comes to rest on the floor rather than under it.
    const floor = (await page.locator(".kitchen-stage").boundingBox())!;
    expect(after!.y, "the board should rise").toBeLessThan(before!.y);
    expect(before!.y + before!.height, "peek hangs below the floor").toBeGreaterThan(
      floor.y + floor.height - 8,
    );
    expect(
      after!.y + after!.height,
      "revealed, the whole board is inside the Window",
    ).toBeLessThanOrEqual(floor.y + floor.height);

    // The radio is sized for real rather than scaled, so its canvas renders
    // 1:1 in both states instead of being magnified into a blur.
    const radio = await page.evaluate(() => {
      const c = document.querySelector("canvas")!;
      return c.width / c.getBoundingClientRect().width;
    });
    expect(radio).toBeGreaterThan(0.9);

    // The filter dim deliberately sits BELOW the cans; the reveal must not, or
    // the room stays bright behind a board that is meant to be in front of it.
    const z = await page.evaluate(() => {
      // `:not([data-bg-film])`: the scene's first child is the background
      // film, which renders as a <div> under reduced motion and would be
      // picked up here instead of the dim.
      const dim = document.querySelector(
        ".kitchen-scene > div:not([data-bg-film])",
      ) as HTMLElement;
      const can = document.querySelector(".can-grid > li > div") as HTMLElement;
      return {
        dim: Number(getComputedStyle(dim).zIndex),
        can: Number(getComputedStyle(can).zIndex) || 30,
      };
    });
    expect(z.dim).toBeGreaterThan(z.can);
  });
});
