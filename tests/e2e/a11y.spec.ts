import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("no accessibility violations on the home page", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("load");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    violations,
    violations.map((v) => `${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});

/**
 * The collapsed page hides most of the sidebar's text, so a sweep of the
 * default state proves very little -- a contrast bug in the Comments panel
 * shipped past exactly that gap once. Scan each panel with it open.
 */
// "Clients" went with the Clients & Achievements accordion, which the sidebar
// sticker stack replaced.
for (const panel of ["Meet", "Comments"]) {
  test(`no accessibility violations with ${panel} open`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate((label) => {
      const t = [...document.querySelectorAll("[data-slot=accordion-trigger]")].find(
        (x) => x.textContent?.trim().startsWith(label),
      ) as HTMLElement | undefined;
      t?.click();
    }, panel);
    await page.waitForTimeout(400);

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);
  });
}

/**
 * Bring the filter chips within reach.
 *
 * Below md the sidebar is a drawer, so the chips are off screen until it is
 * opened. Every assertion below that touches a chip needs this first; without
 * it the mobile project simply timed out reaching for a control that was never
 * rendered, which is not the same thing as the control being inaccessible.
 */
async function withFilters(page: import("@playwright/test").Page) {
  const railVisible = await page.evaluate(
    () => !!(document.querySelector("aside") as HTMLElement | null)?.offsetParent,
  );
  if (!railVisible) {
    await page.getByRole("button", { name: /Open profile and filters/i }).click();
    await expect(page.getByRole("button", { name: /Product Design/ })).toBeVisible();
  }
}

test("the whole page is reachable by keyboard alone", async ({ page }) => {
  await page.goto("/");

  /**
   * Walk the tab order and collect what we land on.
   *
   * Two walks, not one, and the reason is the drawer. Below md the chips live
   * in a MODAL drawer: with it shut they are correctly out of the tab order,
   * and with it open it correctly traps focus, so the cans behind it are out
   * instead. There is no single walk that reaches both, and demanding one
   * would be asking the drawer to stop being a dialog.
   *
   * So the claim being made is the honest one at every width -- neither the
   * cans nor the filters are mouse-only -- rather than a claim about them
   * sharing one focus plane, which is only true on the desktop rail.
   */
  const walk = async () => {
    const reached = new Set<string>();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return "";
        return el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 40) ?? "";
      });
      if (label) reached.add(label);
    }
    return [...reached];
  };

  const first = await walk();

  // The room itself, at every width.
  expect(first.some((l) => l.includes("Katsusando"))).toBe(true);

  /*
   * Where the rail is on screen the chips are in that same walk and there is
   * nothing more to prove. Only when they are not -- the phone's drawer -- is
   * a second walk needed, and only then is it safe to take one: `blur()` does
   * NOT reset Chromium's sequential focus navigation starting point, so a
   * second walk otherwise resumes mid-order rather than from the top. That is
   * what made this pass on the phone and fail on the tablet.
   */
  if (!first.some((l) => l.includes("Product Design"))) {
    await withFilters(page);
    expect((await walk()).some((l) => l.includes("Product Design"))).toBe(true);
  }
});

/**
 * A case study is a different surface: tan rather than paper, brown rather than
 * ink, and a rail whose labels sit at 55% opacity. Contrast there is not
 * implied by anything the home page proves.
 */
test("no accessibility violations on a case study", async ({ page }) => {
  await page.goto("/work/metamask");
  await page.waitForLoadState("load");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    violations,
    violations.map((v) => `${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});

test("no accessibility violations once the article is scrolled", async ({ page }) => {
  await page.goto("/work/metamask");
  await page.waitForLoadState("load");
  // Puts a section in the active state and brings the lazy media into play.
  await page.evaluate(() => {
    const s = document.querySelector("[data-study-scroll]")!;
    s.scrollTop = s.scrollHeight / 2;
  });
  await page.waitForTimeout(400);

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    violations,
    violations.map((v) => `${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});

/**
 * A filtered shelf is a different page: a lime chip appears, six cans go inert,
 * and the same sidebar then has to survive the sand surface on a case study.
 */
test("no accessibility violations with a filter active", async ({ page }) => {
  await page.goto("/");
  await withFilters(page);
  await page.getByRole("button", { name: /Product Design/ }).click();
  await page.waitForTimeout(600);

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    violations,
    violations.map((v) => `${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});

test("no accessibility violations with a filter active on the sand surface", async ({ page }) => {
  await page.goto("/");
  await withFilters(page);
  await page.getByRole("button", { name: /Product Design/ }).click();
  await page.goto("/work/metamask");
  await page.waitForLoadState("load");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    violations,
    violations.map((v) => `${v.id}: ${v.help}`).join("\n"),
  ).toEqual([]);
});
