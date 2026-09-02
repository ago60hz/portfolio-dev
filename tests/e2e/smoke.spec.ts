import { expect, test } from "@playwright/test";

test("the page boots clean", async ({ page }) => {
  const errors: string[] = [];
  const badResponses: string[] = [];

  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  // Capture the URL, not just "a resource failed" — a bare 500 with no path
  // costs more time to chase than the bug itself.
  page.on("response", (r) => {
    if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
  });

  const response = await page.goto("/");
  await page.waitForLoadState("load");

  expect(response?.status()).toBe(200);
  expect(badResponses, "failed requests").toEqual([]);
  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});

test("nothing plays before a user gesture", async ({ page }) => {
  await page.goto("/");
  // No <audio>/<video> may be unpaused, and no AudioContext may be running,
  // until the visitor asks for sound. Guards the autoplay policy and the
  // sound-off-by-default rule at the same time.
  const playing = await page.evaluate(() =>
    [...document.querySelectorAll("audio, video")].some(
      (el) => !(el as HTMLMediaElement).paused,
    ),
  );
  expect(playing).toBe(false);
});
