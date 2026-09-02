import { expect, test } from "@playwright/test";

// Motion frozen, so a baseline captures layout rather than whatever frame the
// springs happened to be on.
test.use({ reducedMotion: "reduce" });

async function settle(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForLoadState("load");
  // next/image decodes after load; without this the cans photograph empty.
  await page.evaluate(() =>
    Promise.all(
      [...document.images].filter((i) => !i.complete).map((i) => i.decode().catch(() => {})),
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

test("a sticker has opened its sidebar panel", async ({ page }) => {
  await settle(page);
  await page.getByRole("button", { name: /66% revenue growth/ }).click();
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
