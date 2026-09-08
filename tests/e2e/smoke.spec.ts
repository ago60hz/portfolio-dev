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
  /*
   * Nothing AUDIBLE may play, and no AudioContext may be running, until the
   * visitor asks for sound.
   *
   * This used to assert that no media element was unpaused at all. The kitchen
   * wall now carries a silent background film that autoplays by design, so the
   * check is against the rule it was always protecting -- sound off until a
   * gesture -- rather than against playback as such. Anything playing has to be
   * muted, which is a stricter statement about the thing that matters than
   * "nothing is playing" was: a paused element with sound is fine by the old
   * assertion right up until something calls play() on it.
   */
  const audible = await page.evaluate(() =>
    [...document.querySelectorAll("audio, video")]
      .filter((el) => !(el as HTMLMediaElement).paused)
      .map((el) => ({
        src: (el as HTMLMediaElement).currentSrc.split("/").pop(),
        muted: (el as HTMLMediaElement).muted,
        volume: (el as HTMLMediaElement).volume,
      }))
      .filter((m) => !m.muted && m.volume > 0),
  );
  expect(audible).toEqual([]);
});
