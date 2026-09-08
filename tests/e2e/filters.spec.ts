import { expect, test } from "@playwright/test";

/** The three works tagged product-design in content/works.ts, which is also
 *  exactly what 4:1656 draws as remaining. */
const PRODUCT_DESIGN = ["MetaMask", "Bonadocs", "PassportMonie"];

/**
 * The homepage is not ready the moment `load` fires: the wall gallery's radio
 * is a WebGL scene, and initialising it (generating textures, building the
 * PMREM environment, compiling shaders) blocks the main thread once, for a few
 * hundred milliseconds. A filter clicked inside that window has its exit
 * transition start late and still be running when the assertions read it --
 * cans photographed at opacity 0.63 rather than 0.
 *
 * R3F sizes the canvas last, so a canvas narrower than its 300px HTML default
 * is the signal that the scene is up. Same reason visual.spec.ts has settle().
 */
async function ready(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForLoadState("load");
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const c = document.querySelector("canvas");
          // No canvas at all (no WebGL) is also "nothing left to wait for".
          return c ? c.getBoundingClientRect().width : 0;
        }),
      { timeout: 10_000 },
    )
    .toBeLessThan(200);

  // Canvas sized is necessary but not sufficient -- shader compilation and the
  // first draw still follow. Wait for the main thread to actually go quiet,
  // which is the condition these assertions really depend on.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => resolve(), { timeout: 3000 });
        } else {
          setTimeout(resolve, 500);
        }
      }),
  );

  /*
   * Below md the sidebar is a drawer, so the chips are not on screen at all
   * until it is opened -- every test in this file then timed out clicking a
   * chip it could not reach, and the mobile project has never actually
   * exercised filtering. Opening it here is what makes these assertions mean
   * the same thing at 390 as they do at 1440.
   */
  const railVisible = await page.evaluate(
    () => !!(document.querySelector("aside") as HTMLElement | null)?.offsetParent,
  );
  if (!railVisible) {
    await page.getByRole("button", { name: /Open profile and filters/i }).click();
    await expect(page.getByRole("button", { name: /Product Design/ })).toBeVisible();
  }
}

const cans = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".can-grid > li > div")].map((c) => ({
      label: (c.querySelector("button")?.getAttribute("aria-label") ?? "").split(" — ")[0],
      opacity: Number(getComputedStyle(c).opacity),
      shifted: getComputedStyle(c).transform !== "none" &&
        Math.abs(Number(getComputedStyle(c).transform.split(",")[4])) > 1,
      inert: c.hasAttribute("inert"),
    })),
  );

test("a chip clears the shelf of everything it does not match", async ({ page }) => {
  await ready(page);
  expect((await cans(page)).every((c) => c.opacity === 1)).toBe(true);

  await page.getByRole("button", { name: /Product Design/ }).click();

  // Wait for the exit to have FINISHED rather than for --duration-max to have
  // elapsed. A fixed wait assumes the transition started the instant the click
  // landed, which stopped being true once the room got a WebGL radio in it: a
  // click during scene init starts the transition late and this read caught
  // cans mid-fade. Poll the end state itself -- polling merely for "nothing is
  // mid-fade" passes instantly, before the transition has even begun.
  await expect
    .poll(
      async () =>
        (await cans(page)).filter(
          (c) => c.opacity !== (PRODUCT_DESIGN.some((n) => c.label.startsWith(n)) ? 1 : 0),
        ).length,
      { timeout: 5000 },
    )
    .toBe(0);

  const after = await cans(page);
  for (const c of after) {
    const shouldStay = PRODUCT_DESIGN.some((n) => c.label.startsWith(n));
    expect(c.opacity, `${c.label} opacity`).toBe(shouldStay ? 1 : 0);
    expect(c.shifted, `${c.label} moved`).toBe(!shouldStay);
  }
});

test("a dismissed can leaves by the side it sits nearest", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: /Product Design/ }).click();
  await page.waitForTimeout(600);

  const cans = await page.evaluate(() => {
    // Read the column count off the grid rather than assuming three: below md
    // the shelf carries two, and the exit side is a function of the column.
    const columns = getComputedStyle(document.querySelector(".can-grid")!)
      .gridTemplateColumns.split(" ").length;
    return [...document.querySelectorAll(".can-grid > li > div")].map((c, i) => {
      const t = getComputedStyle(c).transform;
      return {
        columns,
        column: i % columns,
        row: Math.floor(i / columns),
        x: t === "none" ? 0 : Number(t.split(",")[4]),
        dismissed: (c as HTMLElement).getAttribute("inert") !== null,
      };
    });
  });

  /*
   * Left column out to the left, right column out to the right. Nothing
   * crosses the window to leave by the far side; the centre column has no
   * nearer edge and alternates by row (see exitDirection).
   *
   * Asserted from each can's POSITION rather than by naming works at fixed
   * indices, which is how this read before. The shelf order is content, and it
   * has already been re-cut once -- a test that hardcodes "x[2] is dean"
   * fails on an editorial decision that has nothing to do with the behaviour
   * it is guarding.
   */
  const dismissed = cans.filter((c) => c.dismissed);
  expect(dismissed.length).toBeGreaterThan(0);

  for (const can of dismissed) {
    const middle = (can.columns - 1) / 2;
    const expected =
      can.column < middle
        ? "left"
        : can.column > middle
          ? "right"
          : can.row % 2 === 0
            ? "right"
            : "left";
    if (expected === "left") expect(can.x, `column ${can.column} exits left`).toBeLessThan(0);
    else expect(can.x, `column ${can.column} exits right`).toBeGreaterThan(0);
  }

  // And a can that survives the filter has not moved at all.
  for (const can of cans.filter((c) => !c.dismissed)) expect(can.x).toBe(0);
});

test("a dismissed can is unreachable, not just invisible", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: /Product Design/ }).click();
  await page.waitForTimeout(600);

  // inert removes it from the tab order and from the accessibility tree, so a
  // keyboard or screen-reader user cannot land on a can that is not there.
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll(".can-grid > li > div")]
      .filter((c) => Number(getComputedStyle(c).opacity) === 0)
      .every((c) => c.hasAttribute("inert")),
  );
  expect(hidden).toBe(true);
});

test("clicking the chip again brings the shelf back", async ({ page }) => {
  await ready(page);
  const chip = page.getByRole("button", { name: /Product Design/ });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await page.waitForTimeout(600);
  expect((await cans(page)).every((c) => c.opacity === 1 && !c.inert)).toBe(true);
});

test("the selected chip is lime with an ink label, per 51:1722", async ({ page }) => {
  await ready(page);
  const chip = page.getByRole("button", { name: /Product Design/ });
  await chip.click();
  await expect(chip).toHaveCSS("background-color", "rgb(221, 244, 91)");
  await expect(chip).toHaveCSS("color", "rgb(0, 0, 0)");
  await expect(chip).toHaveCSS("border-top-color", "rgb(0, 0, 0)");
});
