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
for (const panel of ["Meet", "Clients", "Comments"]) {
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

test("the whole page is reachable by keyboard alone", async ({ page }) => {
  await page.goto("/");

  // Walk the tab order and collect what we land on. The cans and the filter
  // chips both have to appear, or the kitchen is mouse-only.
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

  expect([...reached].some((l) => l.includes("Product Design"))).toBe(true);
  expect([...reached].some((l) => l.includes("Katsusando"))).toBe(true);
});
