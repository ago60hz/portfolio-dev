import { expect, test } from "@playwright/test";

// Motion frozen, so a baseline captures layout rather than whatever frame the
// springs happened to be on.
test.use({ reducedMotion: "reduce" });

/**
 * Desktop only, and enforced here rather than left to whoever runs the suite.
 *
 * Mobile is unfinished, so a baseline would lock in a state that is about to
 * change and generate noise on every run. That was always the intent, but
 * nothing expressed it in code -- and Playwright WRITES missing snapshots
 * rather than skipping them, so a plain `npx playwright test` silently created
 * laptop and tablet baselines for every test in this file.
 */
test.skip(() => test.info().project.name !== "desktop", "baselines are desktop-only");

async function settle(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForLoadState("load");
  // next/image decodes after load; without this the cans photograph empty.
  /*
   * Wait for every image that actually occupies space, and force the lazy ones.
   *
   * Two traps, and they pull in opposite directions. `decode()` on an <img>
   * with no resolved source NEVER settles -- it does not reject, it hangs --
   * so a lazy image inside a `display: none` wrapper (the phone's menu button,
   * at a desktop width) froze this until the test timed out. But simply
   * skipping source-less images let the can covers through unloaded, and three
   * of them photographed blank.
   *
   * Filtering on `getClientRects()` separates the two: a hidden image has no
   * boxes and is genuinely not in the shot, while a lazy can cover has one and
   * has to be waited for. Flipping it to `eager` is what makes that wait
   * terminate.
   */
  await page.evaluate(async () => {
    const shown = [...document.images].filter((i) => i.getClientRects().length > 0);
    for (const i of shown) i.loading = "eager";
    await Promise.all(
      shown.map(
        (i) =>
          new Promise<void>((resolve) => {
            if (i.complete) return resolve();
            i.addEventListener("load", () => resolve(), { once: true });
            i.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
    await Promise.all(shown.map((i) => i.decode().catch(() => {})));
  });
  await sceneReady(page);
}

/**
 * The wall gallery's radio is WebGL. R3F mounts its canvas at the HTML default
 * 300x150 and sizes it only once the ResizeObserver fires, and the first draw
 * lands a frame after that -- so a baseline taken on `load` photographs an
 * empty, over-sized canvas clipped to the top-left of the slot, which reads as
 * "no radio". Wait for the canvas to be sized, then for one painted frame.
 */
async function sceneReady(page: import("@playwright/test").Page) {
  const canvas = page.locator("canvas");
  if ((await canvas.count()) === 0) return;
  await expect
    .poll(() => canvas.evaluate((c) => c.getBoundingClientRect().width), { timeout: 30_000 })
    .toBeLessThan(200);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

test("default", async ({ page }) => {
  await settle(page);
  await expect(page).toHaveScreenshot("default.png", { maxDiffPixelRatio: 0.01 });
});

test("a can hovered, popover open", async ({ page }) => {
  await settle(page);
  await page.getByRole("button", { name: /MetaMask/ }).hover();
  await expect(page.getByText("Redesigning MetaMask Card")).toBeVisible();
  await expect(page).toHaveScreenshot("hover.png", { maxDiffPixelRatio: 0.01 });
});

test("contact menu open", async ({ page }) => {
  await settle(page);
  await page.getByRole("button", { name: /Contact Praise Fabilola/ }).click();
  await expect(page.getByRole("link", { name: /Resume/ })).toBeVisible();
  await expect(page).toHaveScreenshot("contact-menu.png", { maxDiffPixelRatio: 0.01 });
});

/**
 * Was "a sticker has opened its sidebar panel": the kitchen's revenue sticker
 * used to reveal the Clients & Achievements accordion. Both are gone -- the
 * design cleared the posters off the shelves and the stack replaced the
 * accordion -- so what is worth photographing now is the stack having been
 * dealt: the top card sent to the back and the next one promoted.
 */
test("the sticker stack has been dealt", async ({ page }) => {
  await settle(page);
  const top = page.locator("[data-sticker-stack] button");
  await expect(top).toHaveAccessibleName(/deeply understands problems/);
  await top.click();
  await expect(top).toHaveAccessibleName(/exceptional speed of execution/);
  await expect(page).toHaveScreenshot("sticker-opened.png", {
    maxDiffPixelRatio: 0.01,
  });
});

/** Opens a sidebar panel by its label, without depending on pixel positions. */
async function openPanel(page: import("@playwright/test").Page, label: string) {
  await page.evaluate((l) => {
    const t = [...document.querySelectorAll("[data-slot=accordion-trigger]")].find(
      (x) => x.textContent?.trim().startsWith(l),
    ) as HTMLElement | undefined;
    t?.click();
  }, label);
}

test("Meet the head Cheff, expanded", async ({ page }) => {
  await settle(page);
  await openPanel(page, "Meet");
  await expect(page.getByText("IJO DISCO is my kitchen", { exact: false })).toBeVisible();
  await expect(page).toHaveScreenshot("panel-chef.png", { maxDiffPixelRatio: 0.01 });
});

test("Comments, expanded as a thread", async ({ page }) => {
  await settle(page);
  await openPanel(page, "Comments");
  await expect(page.getByText("Marco De Rossi").first()).toBeVisible();
  await expect(page).toHaveScreenshot("panel-comments.png", { maxDiffPixelRatio: 0.01 });
});

/**
 * The case study, at the top of the page.
 *
 * reducedMotion is already on for this file, which conveniently also holds the
 * Vimeo players at their posters -- so this captures layout rather than
 * whichever frame five autoplaying clips happened to be on.
 */
test("a case study, at the top", async ({ page }) => {
  await page.goto("/work/metamask");
  await page.waitForLoadState("load");
  // Only the images actually on screen. Everything below the fold is lazy and
  // will never load while the page sits at the top, so awaiting decode() on the
  // whole document hangs until the test times out.
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        // `getClientRects()` first, for the same reason `settle` uses it: a
        // `display: none` image reports top 0 and so passes a viewport test,
        // and `decode()` on one with no resolved source never settles.
        .filter(
          (i) =>
            !i.complete &&
            i.getClientRects().length > 0 &&
            i.getBoundingClientRect().top < innerHeight,
        )
        .map((i) => i.decode().catch(() => {})),
    ),
  );
  // The sidebar arrives with the route and the masthead settles behind it.
  await page.waitForTimeout(1200);
  await expect(page).toHaveScreenshot("case-study.png", { maxDiffPixelRatio: 0.01 });
});

/** The shelf with a filter applied, matching 4:1656. */
test("a filter has cleared the shelf", async ({ page }) => {
  await settle(page);
  await page.getByRole("button", { name: /Product Design/ }).click();
  // The exit runs on --duration-max, but the shelf is not settled the moment
  // it ends: the re-frame made the room taller and the covers that scroll into
  // view load after the click. Measured stable by ~1.9s; 2000 leaves margin
  // without waiting on a fixed guess of the animation alone.
  await page.waitForTimeout(2000);
  await expect(page).toHaveScreenshot("filtered.png", { maxDiffPixelRatio: 0.01 });
});
