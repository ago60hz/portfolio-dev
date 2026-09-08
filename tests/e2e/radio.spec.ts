import { expect, test } from "@playwright/test";

/**
 * The radio (90:346) sits bottom-left of the wall gallery. It was unmounted
 * once for being audible on load, so the silence assertion here is the point
 * of the file, not a nicety.
 *
 * It is no longer a child of the gallery: it is mounted in the layout so the
 * music survives a case study, and it tracks an invisible anchor the gallery
 * draws at the design's slot. Anything measuring it in scene units therefore
 * has to read --u from inside the Window, not from the slot.
 */
test.describe("the radio", () => {
  test.skip(
    () => test.info().project.name !== "desktop",
    "the gallery is a desktop composition; the panning viewports crop it",
  );

  test("mounts a scene without bursting its 125 x 151 slot", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // R3F mounts the canvas at the HTML default 300x150 and only sizes it once
    // its ResizeObserver fires. Measuring before that reads the placeholder.
    // Generous timeout on purpose: the suite runs four projects in parallel and
    // every one of them now stands up its own WebGL context.
    await expect
      .poll(() => canvas.evaluate((c) => c.getBoundingClientRect().width), { timeout: 30_000 })
      .toBeLessThan(200);

    const fits = await page.evaluate(() => {
      const c = document.querySelector("canvas")!;
      const slot = c.closest("[data-radio-slot]") as HTMLElement;
      const anchor = document.querySelector("[data-radio-anchor]") as HTMLElement;
      const cb = c.getBoundingClientRect();
      const sb = slot.getBoundingClientRect();
      const ab = anchor.getBoundingClientRect();
      // --u is a container query unit against the Window, so it only means
      // anything measured on an element inside it. The slot is not one.
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;width:calc(1000*var(--u));height:0";
      anchor.appendChild(probe);
      const u = probe.getBoundingClientRect().width / 1000;
      probe.remove();
      return {
        slotW: sb.width / u,
        slotH: sb.height / u,
        // The dock is only right if it is sitting exactly on the anchor.
        offX: Math.abs(sb.left - ab.left),
        offY: Math.abs(sb.top - ab.top),
        overflowRight: cb.right - sb.right,
        overflowBottom: cb.bottom - sb.bottom,
      };
    });

    expect(fits.slotW).toBeCloseTo(125, 0);
    expect(fits.slotH).toBeCloseTo(151, 0);
    // Mounted in the layout, it is only in the right place if it tracks the
    // anchor. A pixel of slack for the sub-pixel --u arithmetic.
    expect(fits.offX).toBeLessThanOrEqual(1);
    expect(fits.offY).toBeLessThanOrEqual(1);
    // The package's root is an inline `aspect-ratio: 4/3`; at 125 wide that is
    // 94 tall and crops the cable. If these go positive, the !important
    // overrides in RadioSlot stopped reaching it.
    expect(fits.overflowRight).toBeLessThanOrEqual(1);
    expect(fits.overflowBottom).toBeLessThanOrEqual(1);
  });

  test("starts silent and powered off", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible();

    // The package announces its own state, which is the only observable that
    // does not require reaching inside a cross-origin iframe.
    await expect(page.getByText("Off", { exact: true })).toBeAttached();

    const playing = await page.evaluate(() =>
      [...document.querySelectorAll("audio,video")].some((m) => !(m as HTMLMediaElement).paused),
    );
    expect(playing, "something was playing before any gesture").toBe(false);
  });

  test("offers the disco while it is off, and stops once it is on", async ({ page }) => {
    await page.goto("/");
    const slot = page.locator("[data-radio-slot]");
    await expect(page.locator("canvas")).toBeVisible();

    await slot.hover();
    await expect(page.getByText("Turn on radio for a disco party")).toBeVisible();

    // Power on through the package's own control row, which drives the same
    // machine the 3D buttons do. Keyboard, not mouse: those controls are
    // visually hidden BEHIND the canvas, so a real click hits the canvas
    // instead -- which is exactly how a keyboard user reaches them anyway.
    const power = page.getByRole("button", { name: "Power" });
    await power.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Off", { exact: true })).not.toBeAttached();

    await page.mouse.move(0, 0);
    await slot.hover();
    await expect(page.getByText("Turn on radio for a disco party")).toBeHidden();
  });
});
