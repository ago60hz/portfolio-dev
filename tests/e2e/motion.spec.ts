import { expect, test } from "@playwright/test";

/**
 * The motion pass, at full strength.
 *
 * Every other spec in this suite runs with `reducedMotion: "reduce"` so it can
 * assert against a settled page. This one is the opposite: it opts back into
 * real motion and is the only place the loader, the entrance and the hover
 * physics actually run. See the `motion` project in playwright.config.ts.
 */

const settled = (page: import("@playwright/test").Page) =>
  page.waitForFunction(() => !document.querySelector("[data-loader]"), null, {
    timeout: 15_000,
  });

test.describe("the loader", () => {
  test("shows, counts, and hands the room over", async ({ page }) => {
    await page.goto("/");

    const loader = page.locator("[data-loader]");
    await expect(loader).toBeVisible();

    // The 0-100 counter is the loading screen's only copy now.
    await expect(page.locator(".count")).toBeVisible();

    // It counts all the way up and then leaves of its own accord.
    await expect(page.locator("[data-loader][data-done]")).toBeVisible({ timeout: 14_000 });
    await expect(page.locator(".count")).toHaveText(/100/);
    await settled(page);

    // And the room underneath is real, not a screenshot of one.
    await expect(page.locator(".can-grid button").first()).toBeVisible();
  });

  test("holds for its minimum, so a warm cache does not flash it", async ({ page }) => {
    await page.goto("/");
    await settled(page);
    const first = await page.evaluate(() => performance.now());

    // Second visit: everything is cached, so only the floor is holding it.
    await page.goto("/");
    const shownAt = await page.evaluate(() => performance.now());
    await settled(page);
    const clearedAt = await page.evaluate(() => performance.now());

    expect(first).toBeGreaterThan(0);
    /*
     * The floor is MIN_MS (2s) plus SHRINK_MS (0.9s) before the loader clears
     * -- a ~2.9s boot, down from ~5.9s. Asserted comfortably inside it rather
     * than on the nose, and imported would be better than duplicated, but the
     * point of the assertion is that a warm cache still cannot flash it.
     */
    expect(clearedAt - shownAt).toBeGreaterThan(1800);
  });

  test("the trail drops a picture as the pointer travels", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-loader]")).toBeVisible();

    // The reference spawns every 100px of travel. Cross several thresholds.
    for (let x = 200; x <= 1200; x += 60) {
      await page.mouse.move(x, 400 + Math.sin(x / 180) * 120);
    }

    const trailed = await page.locator("[data-loader] img").count();
    expect(trailed).toBeGreaterThan(2);
  });

  test("the Window covers the viewport, then shrinks back into its frame", async ({ page }) => {
    await page.goto("/");
    // Wait for the cover to be applied rather than racing it. It runs in a
    // layout effect so it lands before the first paint, but "before paint" and
    // "before Playwright reads" are different clocks.
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-booting"),
    );

    const covering = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".kitchen-stage")!;
      const r = stage.getBoundingClientRect();
      return {
        coversWidth: r.width >= window.innerWidth - 1,
        coversHeight: r.height >= window.innerHeight - 1,
        // The loader's ground is the Window's own tile at the Window's own
        // size -- no arithmetic, because they are the same element tree.
        loaderTile: parseFloat(
          getComputedStyle(document.querySelector<HTMLElement>("[data-loader]")!).backgroundSize,
        ),
        sceneTile: parseFloat(
          getComputedStyle(document.querySelector<HTMLElement>(".kitchen-scene")!).backgroundSize,
        ),
      };
    });

    expect(covering.coversWidth).toBe(true);
    expect(covering.coversHeight).toBe(true);
    expect(covering.loaderTile).toBeCloseTo(covering.sceneTile, 1);

    // And it comes back to exactly the box the layout gives it.
    await settled(page);
    await page.waitForTimeout(1400);

    const rested = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".kitchen-stage")!;
      const r = stage.getBoundingClientRect();
      return {
        transform: getComputedStyle(stage).transform,
        width: r.width,
        layoutWidth: stage.offsetWidth,
        booting: document.documentElement.hasAttribute("data-booting"),
      };
    });

    expect(rested.booting).toBe(false);
    expect(rested.transform === "none" || rested.transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    expect(rested.width).toBeCloseTo(rested.layoutWidth, 0);
    expect(rested.width).toBeLessThan(1440);
  });
});

test.describe("the entrance", () => {
  test("everything arrives and settles at full strength", async ({ page }) => {
    await page.goto("/");
    await settled(page);

    // Give the staggered run its longest beat plus the transition.
    await page.waitForTimeout(2000);

    const opacities = await page.evaluate(() =>
      [
        ".can-grid [data-reveal]",
        "aside [data-reveal]",
        "[data-gallery-board] > span",
      ].map((sel) => {
        const els = [...document.querySelectorAll<HTMLElement>(sel)];
        return {
          sel,
          count: els.length,
          min: Math.min(...els.map((e) => parseFloat(getComputedStyle(e).opacity))),
        };
      }),
    );

    for (const o of opacities) {
      expect(o.count, o.sel).toBeGreaterThan(0);
      expect(o.min, o.sel).toBeGreaterThan(0.99);
    }
  });

  test("the room waits for the Window to land before it fills in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-loader][data-done]")).toBeVisible({ timeout: 14_000 });

    // Sampled across the shrink: no can may start appearing while the frame is
    // still travelling, or they read as bleeding through a moving wall rather
    // than being set down on a shelf.
    const bled = await page.evaluate(
      () =>
        new Promise<boolean>((res) => {
          const t0 = performance.now();
          const tick = () => {
            const booting = document.documentElement.hasAttribute("data-booting");
            const anyVisible = [...document.querySelectorAll<HTMLElement>(".can-grid [data-reveal]")].some(
              (el) => parseFloat(getComputedStyle(el).opacity) > 0.05,
            );
            if (booting && anyVisible) return res(true);
            if (!booting && anyVisible) return res(false);
            if (performance.now() - t0 > 6000) return res(false);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      undefined,
      { timeout: 20_000 },
    );

    expect(bled).toBe(false);
  });

  test("the cans arrive staggered rather than all at once", async ({ page }) => {
    await page.goto("/");
    // Start sampling while the loader is still up, so the handover happens
    // inside the window being watched. Sampling after it has finished only
    // ever shows ten settled cans.
    await expect(page.locator("[data-loader]")).toBeVisible();

    const crossed = await page.evaluate(
      () =>
        new Promise<number[]>((res) => {
          const first = new Map<number, number>();
          const t0 = performance.now();
          const tick = () => {
            const cans = [...document.querySelectorAll<HTMLElement>(".can-grid [data-reveal]")];
            cans.forEach((c, i) => {
              if (first.has(i)) return;
              if (parseFloat(getComputedStyle(c).opacity) > 0.5) {
                first.set(i, performance.now() - t0);
              }
            });
            if (first.size >= cans.length && cans.length > 0) {
              res([...first.entries()].sort((a, b) => a[0] - b[0]).map(([, ms]) => ms));
            } else if (performance.now() - t0 < 14000) {
              requestAnimationFrame(tick);
            } else {
              res([...first.values()]);
            }
          };
          requestAnimationFrame(tick);
        }),
      undefined,
      { timeout: 20_000 },
    );

    expect(crossed.length).toBeGreaterThan(3);
    // One beat is 55ms and the cans run in grid order, so the last can should
    // clear half opacity several beats after the first. Identical times mean
    // the stagger was dropped somewhere.
    expect(Math.max(...crossed) - Math.min(...crossed)).toBeGreaterThan(120);
  });
});

test.describe("hover physics", () => {
  test("a can lifts about 24 scene units and comes back down", async ({ page }) => {
    await page.goto("/");
    await settled(page);
    await page.waitForTimeout(2200);

    const can = page.locator(".can-grid button").first();
    const box = (await can.boundingBox())!;

    const u = await page.evaluate(() => {
      const wrap = document.querySelector<HTMLElement>(".can-grid > li > div");
      return wrap ? wrap.getBoundingClientRect().width / 178 : 0;
    });
    expect(u).toBeGreaterThan(0);

    await can.hover();
    // The lift is a spring; let it settle before measuring.
    await page.waitForTimeout(700);
    const lifted = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".can-grid button");
      return new DOMMatrixReadOnly(getComputedStyle(el!).transform).m42;
    });

    // Negative is up. Within a unit of the brief's 24, expressed in --u.
    expect(lifted).toBeLessThan(-(24 * u) + 2);
    expect(lifted).toBeGreaterThan(-(24 * u) - 4);

    // And it returns.
    await page.mouse.move(box.x + box.width / 2, box.y - 200);
    await page.waitForTimeout(1400);
    const rested = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".can-grid button");
      return new DOMMatrixReadOnly(getComputedStyle(el!).transform).m42;
    });
    expect(Math.abs(rested)).toBeLessThan(1.5);
  });

  test("the drop never carries a can back up out of its slot", async ({ page }) => {
    await page.goto("/");
    await settled(page);
    await page.waitForTimeout(2200);

    const can = page.locator(".can-grid button").nth(4);
    const box = (await can.boundingBox())!;
    await can.hover();
    await page.waitForTimeout(700);
    await page.mouse.move(box.x + box.width / 2, box.y - 300);

    // Sample the whole descent. The cans sit BEHIND the shelf's glass lip, so
    // any travel above the resting position puts the can in front of the
    // shelf for a moment and reads as the z-order breaking and correcting
    // itself. Negative is up, so nothing here may go meaningfully positive.
    const ys: number[] = [];
    for (let i = 0; i < 22; i += 1) {
      ys.push(
        await page.evaluate(
          () =>
            new DOMMatrixReadOnly(
              getComputedStyle(document.querySelectorAll(".can-grid button")[4]).transform,
            ).m42,
        ),
      );
      await page.waitForTimeout(55);
    }

    expect(Math.min(...ys)).toBeLessThan(-5);
    expect(Math.max(...ys)).toBeLessThan(0.5);
    expect(Math.abs(ys[ys.length - 1])).toBeLessThan(1);
  });

  test("the spices pop under the pointer, and the cans still take one", async ({ page }) => {
    await page.goto("/");
    await settled(page);
    await page.waitForTimeout(2200);

    // The can grid is a full-width box above the garnishes; if it ever stops
    // being pointer-events-none it swallows every hover meant for a chilli.
    const chilli = page.locator("[data-garnish]").nth(1);
    await chilli.hover();
    await page.waitForTimeout(400);
    expect(await chilli.evaluate((el) => getComputedStyle(el).scale)).toBe("1.14");

    // ...and letting the garnishes through must not cost the cans their hover.
    await page.locator(".can-grid button").nth(4).hover();
    await expect(page.locator("[data-work-popover]")).toBeVisible();
  });

  test("the popover hangs from the HOT ribbon's pin", async ({ page }) => {
    await page.goto("/");
    await settled(page);
    await page.waitForTimeout(2200);

    await page.locator(".can-grid button").first().hover();
    const card = page.locator("[data-work-popover]").first();
    await expect(card).toBeVisible();

    // 1:526 puts the ribbon dead centre of the 231-wide card, so the card
    // swings about its top centre. Anything else and it pivots off a corner.
    //
    // offsetWidth, not boundingBox: the card is still swinging when this runs,
    // and a rotated element's bounding box is wider than the element.
    const pin = await card.evaluate((el) => {
      const [x, y] = getComputedStyle(el).transformOrigin.split(" ").map(parseFloat);
      return { x, y, width: (el as HTMLElement).offsetWidth };
    });
    expect(pin.x).toBeCloseTo(pin.width / 2, 0);
    expect(pin.y).toBeCloseTo(0, 1);
  });
});

test.describe("the case study", () => {
  test("sections arrive as they are scrolled to, not all at once", async ({ page }) => {
    await page.goto("/work/metamask");
    await settled(page);
    await page.waitForTimeout(900);

    const scroller = page.locator("[data-study-scroll]");
    await expect(scroller).toBeVisible();

    // Blocks below the fold are still held back.
    const hiddenAtTop = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-study-scroll] [data-reveal]")].filter(
        (el) => parseFloat(getComputedStyle(el).opacity) < 0.5,
      ).length,
    );
    expect(hiddenAtTop).toBeGreaterThan(0);

    // Scroll to the bottom and they arrive.
    await scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "instant" }));
    await page.waitForTimeout(1600);

    const stillHidden = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>("[data-study-scroll]")!;
      const box = scroller.getBoundingClientRect();
      // Reveal's observer carries a -12% bottom rootMargin, so a block sitting
      // in that bottom band has legitimately not been reached yet. Measuring
      // against the scroller rather than the window for the same reason: the
      // article scrolls inside the Window, not inside the page.
      const trigger = box.bottom - box.height * 0.12;
      return [...scroller.querySelectorAll<HTMLElement>("[data-reveal]")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.bottom > box.top && r.top < trigger;
        })
        .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.9).length;
    });
    expect(stillHidden).toBe(0);
  });

  test("the masthead arrives in groups, and its heading a word at a time", async ({ page }) => {
    await page.goto("/work/metamask");

    // Sampled from load. The masthead fills the whole first screen, so if it
    // does not animate, the heading is the only thing on the page that moves
    // and the article reads as half-finished.
    const seen = await page.evaluate(
      () =>
        new Promise<{ groupsHidden: boolean; wordsStaggered: boolean }>((res) => {
          let groupsHidden = false;
          let wordsStaggered = false;
          const t0 = performance.now();
          const tick = () => {
            const groups = [...document.querySelectorAll<HTMLElement>("header [data-reveal]")];
            if (groups.length >= 3 && groups.some((g) => parseFloat(getComputedStyle(g).opacity) < 0.5)) {
              groupsHidden = true;
            }
            const words = [...document.querySelectorAll<HTMLElement>("h1 .mask-word > *")];
            const ys = words.map((w) => new DOMMatrixReadOnly(getComputedStyle(w).transform).m42);
            // A word already home while another has not started is the stagger.
            if (ys.length > 3 && Math.min(...ys) < 1 && Math.max(...ys) > 10) wordsStaggered = true;
            if ((groupsHidden && wordsStaggered) || performance.now() - t0 > 6000) {
              res({ groupsHidden, wordsStaggered });
            } else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      undefined,
      { timeout: 20_000 },
    );

    expect(seen.groupsHidden).toBe(true);
    expect(seen.wordsStaggered).toBe(true);

    // ...and every one of them settles.
    await page.waitForTimeout(2600);
    const settledOpacity = await page.evaluate(() =>
      Math.min(
        ...[...document.querySelectorAll<HTMLElement>("header [data-reveal]")].map((g) =>
          parseFloat(getComputedStyle(g).opacity),
        ),
      ),
    );
    expect(settledOpacity).toBeGreaterThan(0.99);

    /*
     * ...and the words keep normal spacing.
     *
     * MaskWords emits a real space text node between words. Drawing a second
     * one as a pseudo-element doubles every gap, and it is a hard regression to
     * catch by measuring: the pseudo-element sits INSIDE the word's own box, so
     * the distance between boxes still reads as one normal space while what is
     * rendered is two. Assert on the pseudo-element itself instead.
     */
    const drawnSpaces = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".mask-word")].filter(
        (w) => getComputedStyle(w, "::after").content !== "none",
      ).length,
    );
    expect(drawnSpaces).toBe(0);
  });

  test("the room repaints from purple to sand without the page jumping", async ({ page }) => {
    await page.goto("/");
    await settled(page);
    await page.waitForTimeout(1800);

    const purple = await page.evaluate(
      () => getComputedStyle(document.querySelector("main")!).backgroundColor,
    );
    await page.goto("/work/metamask");
    await page.waitForTimeout(1200);
    const sand = await page.evaluate(
      () => getComputedStyle(document.querySelector("main")!).backgroundColor,
    );

    expect(purple).not.toBe(sand);

    // The room moving, so it runs on `smooth` -- and slowly. A whole wall
    // changing colour at entrance speed reads as a flash rather than as the
    // same room turning, which is the entire point of doing it in one variable.
    const t = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector("main")!);
      return { ease: cs.transitionTimingFunction, duration: cs.transitionDuration };
    });
    expect(t.ease).toContain("cubic-bezier(0.74");
    expect(parseFloat(t.duration)).toBeGreaterThanOrEqual(0.8);

    /*
     * ...and so does everything else painted in the ground colour.
     *
     * The sidebar panel is the one that catches this. The rule used to select
     * it structurally, as `aside > div`, which stopped being the panel the
     * moment a wrapper was added between them for the entrance -- so the page
     * faded while the sidebar snapped. Assert on the elements, not the rule.
     */
    const carriers = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[class*="bg-kitchen-surface"]')].map((el) => {
        const cs = getComputedStyle(el);
        return {
          bg: cs.backgroundColor,
          animates: cs.transitionProperty.includes("background-color"),
          duration: parseFloat(cs.transitionDuration),
        };
      }),
    );

    expect(carriers.length).toBeGreaterThan(0);
    for (const c of carriers) {
      expect(c.animates, "an element painted in the ground colour must fade with it").toBe(true);
      expect(c.duration).toBeGreaterThanOrEqual(0.8);
      // And it really did repaint, rather than being some other colour entirely.
      expect(c.bg).toBe(sand);
    }
  });
});
