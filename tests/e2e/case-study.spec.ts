import { expect, test } from "@playwright/test";

test("a can's view pill reaches its study, and the chevron comes back", async ({ page }) => {
  await page.goto("/");

  /*
   * Two routes to the same pill, because they are genuinely different
   * affordances. On a pointer device the card is a hover popover; on a phone
   * hover does not exist, so tapping the can raises a bottom sheet carrying
   * the same `Ctas`. The journey being asserted -- can to study -- is the
   * same, and both surfaces have to make it.
   */
  const can = page.getByRole("button", { name: /MetaMask/i }).first();
  const viewport = page.viewportSize();
  if ((viewport?.width ?? 0) < 768) {
    await can.click();
  } else {
    await can.hover();
  }
  await page.getByRole("link", { name: "view" }).first().click();

  await expect(page).toHaveURL(/\/work\/metamask$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("MetaMask Card");

  await page.getByRole("link", { name: "Back to the kitchen" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the study boots clean", async ({ page }) => {
  const errors: string[] = [];
  const badResponses: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    // Vimeo serves a Cloudflare Turnstile challenge to automated clients, which
    // headless Chromium cannot solve, so its player always 401s here. It plays
    // fine in a real browser (verified via the Vimeo player API reporting
    // currentTime advancing). Failing on it would be a permanently red test
    // that says nothing about this codebase.
    if (r.url().startsWith("https://player.vimeo.com/")) return;
    if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
  });

  const response = await page.goto("/work/metamask");
  await page.waitForLoadState("load");

  // Scroll the whole article. Media below the fold is lazy, so a check that
  // only looks at the top of the page proves nothing about it -- five Vimeo
  // players were 401ing behind exactly this gap.
  await page.evaluate(async () => {
    const s = document.querySelector("[data-study-scroll]")!;
    for (let y = 0; y < s.scrollHeight; y += 700) {
      s.scrollTop = y;
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(800);

  expect(response?.status()).toBe(200);
  expect(badResponses, "failed requests").toEqual([]);
  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});

test("the sidebar survives the trip, rather than remounting", async ({ page, viewport }) => {
  /*
   * Desktop widths only. The route into a study is the can's HOVER popover,
   * and hover is what warms the prefetch this depends on -- below md the
   * sidebar is a drawer and the popover is not a journey a touch device
   * makes, so the mobile project was testing a hover interaction it would
   * never perform and racing a prefetch that hover never fired.
   */
  test.skip((viewport?.width ?? 0) < 768, "the popover route is hover-driven");
  await page.goto("/");

  // Tag the live DOM node. If the shell were rebuilt per page instead of
  // living in the route-group layout, React would unmount this element and
  // mount a fresh one, and the tag would not come back.
  //
  // Note this has to be a CLIENT-SIDE navigation to mean anything: page.goto()
  // is a full document load, which discards the tag either way and would make
  // the test pass or fail for reasons that have nothing to do with the layout.
  await page.evaluate(() =>
    document.querySelector("aside")!.setAttribute("data-remount-probe", "1"),
  );

  /*
   * Wait for the hover's own prefetch to land before clicking.
   *
   * Next falls back to a FULL document load when the RSC payload for the target
   * is not in the router cache yet, and a full load discards the probe -- so
   * clicking the instant the popover opens tested the race, not the layout.
   * That is what made this pass on desktop and fail on mobile.
   */
  const prefetched = page.waitForResponse(
    (r) => r.url().includes("/work/metamask") && r.url().includes("_rsc") && r.ok(),
    { timeout: 15_000 },
  );
  await page.getByRole("button", { name: /MetaMask/i }).first().hover();
  await prefetched;

  await page.getByRole("link", { name: "view" }).first().click();
  await expect(page).toHaveURL(/\/work\/metamask$/);

  await expect(page.locator("aside[data-remount-probe]")).toHaveCount(1);
});

test("a work with no study never routes here", async ({ page }) => {
  // sentio, unrefyned, katsusando and faraway live off-site. Their pills must
  // leave the domain rather than land on a 404 we built ourselves.
  const res = await page.goto("/work/sentio");
  expect(res?.status()).toBe(404);
});

test.describe("the article reflows where the kitchen pans", () => {
  for (const width of [390, 768, 1440]) {
    test(`no horizontal overflow at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/work/metamask");

      // Deliberately the inverse of responsive.spec.ts: the kitchen scene is
      // allowed to exceed its container and pan. A document is not.
      const overflow = await page.evaluate(() => {
        const scroller = document.querySelector("[data-study-scroll]")!;
        return {
          doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          scroller: scroller.scrollWidth - scroller.clientWidth,
        };
      });
      expect(overflow.doc, "document scrolls sideways").toBeLessThanOrEqual(0);
      expect(overflow.scroller, "the study scrolls sideways").toBeLessThanOrEqual(0);
    });
  }

  test("the column holds the design's 519 measure on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/work/metamask");
    const width = await page.evaluate(
      () => document.querySelector("article")!.clientWidth,
    );
    expect(width).toBe(519);
  });
});
