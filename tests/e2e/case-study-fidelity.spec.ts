import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Design fidelity, asserted against Figma's own properties.
 *
 * A pixel baseline tells you something changed; it never tells you what. These
 * assertions name the property instead. The expected values are generated --
 * `node scripts/case-study-tokens.mjs` re-reads the Figma snapshot -- so the
 * loop when Praise moves something is: re-pull, regenerate, and this spec fails
 * on exactly the property that moved.
 *
 * Never take these numbers off a screenshot. A render of 25:664 taken an hour
 * before the pull already disagreed with the file about a chip colour.
 */
const tokens = JSON.parse(
  readFileSync(join(process.cwd(), "design/case-study.tokens.json"), "utf8"),
);

/**
 * The one deliberate departure from the file.
 *
 * The design sets small text in kitchen-brown (#755a3d) on kitchen-tan, which
 * is 3.09:1 -- under the 4.5:1 WCAG AA requires, and a11y.spec.ts fails on it.
 * Text uses the same hue darkened to 4.67:1 instead. Borders, wells and rules
 * still use the design's exact brown, where contrast does not apply.
 *
 * This is asserted rather than ignored: if the token file ever stops calling
 * for brown text, or the substitute drifts, the spec should say so.
 */
const DESIGN_BROWN = "#755a3d";
const READABLE_BROWN = "#55412c";
const onTan = (hex: string) => (hex.toLowerCase() === DESIGN_BROWN ? READABLE_BROWN : hex);

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

/** Computed styles for one selector, as a plain object. */
const styles = (page: Page, selector: string, props: string[]) =>
  page.evaluate(
    ([sel, keys]) => {
      const el = document.querySelector(sel as string);
      if (!el) throw new Error(`no element for ${sel}`);
      const cs = getComputedStyle(el);
      return Object.fromEntries((keys as string[]).map((k) => [k, cs.getPropertyValue(k)]));
    },
    [selector, props] as const,
  );

const TYPE = ["font-size", "line-height", "letter-spacing", "font-weight", "color"];

/** Figma's AUTO leading, resolved to px, against what the browser computes. */
const expectType = (got: Record<string, string>, t: Record<string, number | string>) => {
  expect(got["font-size"]).toBe(`${t.size}px`);
  expect(parseFloat(got["line-height"])).toBeCloseTo(t.lineHeight as number, 1);
  expect(parseFloat(got["letter-spacing"])).toBeCloseTo(t.letterSpacing as number, 2);
  expect(got["font-weight"]).toBe(String(t.weight));
  expect(got["color"]).toBe(rgb(onTan(t.color as string)));
};

// The design frame is 1440 wide. Everything below is measured there, because
// scene chrome is expressed in --u and only equals its Figma value at that
// width; type and column measure are viewport-independent by design.
test.use({ viewport: { width: 1440, height: 900 } });

test.describe("case study matches 25:664", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/work/metamask");
    await page.waitForLoadState("load");
  });

  test("the reading surface and its chrome", async ({ page }) => {
    const s = await styles(page, ".kitchen-stage", [
      "background-color",
      "border-top-width",
      "border-bottom-width",
      "border-top-color",
    ]);
    expect(s["background-color"]).toBe(rgb(tokens.window.surface));
    expect(s["border-top-color"]).toBe(rgb(tokens.window.border.color));
    expect(s["border-top-width"]).toBe(`${tokens.window.border.sides.top}px`);
    // The 2px bottom is the house edge, and it is load-bearing: it is what
    // makes the Window read as a physical panel rather than a div.
    expect(s["border-bottom-width"]).toBe(`${tokens.window.border.sides.bottom}px`);
  });

  test("the column holds its measure", async ({ page }) => {
    const width = await page.evaluate(
      () => document.querySelector("article")!.clientWidth,
    );
    expect(width).toBe(tokens.column.w);
  });

  test("masthead typography", async ({ page }) => {
    expectType(await styles(page, "article h1", TYPE), tokens.masthead.title);
    expectType(await styles(page, "article header p.font-doto", TYPE), tokens.masthead.brandLine);
    const hook = await styles(page, "article header p.font-gochi", TYPE);
    expect(hook["font-size"]).toBe(`${tokens.masthead.hook.size}px`);
    expect(hook["color"]).toBe(rgb(onTan(tokens.masthead.hook.color)));
    expect(parseFloat(hook["letter-spacing"])).toBeCloseTo(tokens.masthead.hook.letterSpacing, 2);
  });

  test("masthead rhythm", async ({ page }) => {
    const stack = await styles(page, "article header > div", ["row-gap", "padding-bottom"]);
    expect(stack["row-gap"]).toBe(`${tokens.masthead.gap}px`);
    expect(stack["padding-bottom"]).toBe(`${tokens.masthead.paddingBottom}px`);
  });

  test("meta grid", async ({ page }) => {
    const grid = await styles(page, "article dl", ["column-gap", "row-gap", "grid-template-columns"]);
    expect(grid["column-gap"]).toBe(`${tokens.metaGrid.columnGap}px`);
    expect(grid["row-gap"]).toBe(`${tokens.metaGrid.rowGap}px`);
    // Two equal cells, at the width Figma draws them.
    const cell = (tokens.column.w - tokens.metaGrid.columnGap) / 2;
    expect(grid["grid-template-columns"]).toBe(`${cell}px ${cell}px`);

    expectType(await styles(page, "article dl dt", TYPE), tokens.metaGrid.label);
    expectType(await styles(page, "article dl dd", TYPE), tokens.metaGrid.value);
    expect((await styles(page, "article dl > div", ["row-gap"]))["row-gap"]).toBe(
      `${tokens.metaGrid.cellGap}px`,
    );
  });

  test("the breadcrumb chips", async ({ page, viewport }) => {
    /*
     * The category chip is `hidden sm:inline-flex` -- Praise's call, since a
     * phone header has no room for it beside the study name and the Contact
     * button. It is still in the DOM at `display: none`, so the selectors below
     * match it and measure a zero-height box. Nothing to check where nothing is
     * drawn.
     */
    test.skip((viewport?.width ?? 0) < 640, "the breadcrumb is abbreviated below sm");
    const study = await styles(page, "nav[aria-label='Breadcrumb'] span.chip:last-of-type", [
      "background-color",
      "color",
      "height",
      "padding-left",
    ]);
    expect(study["background-color"]).toBe(rgb(tokens.breadcrumb.studyChip.fill));
    expect(study["color"]).toBe(rgb(tokens.breadcrumb.studyChip.text.color));
    expect(study["height"]).toBe(`${tokens.breadcrumb.filterChip.h}px`);
    expect(study["padding-left"]).toBe(`${tokens.breadcrumb.filterChip.padding.left}px`);

    /*
     * `.chip:first-child`, not `span.chip:first-of-type`.
     *
     * The category chip is a <button> now -- pressing it returns to the kitchen
     * with that filter applied -- so it is no longer a <span> and the old
     * selector matched nothing at all. Matching on the chip class and its
     * position in the nav describes what is being measured (the first chip in
     * the breadcrumb) rather than which tag it happens to be built from.
     */
    const filter = await styles(page, "nav[aria-label='Breadcrumb'] .chip:first-of-type", [
      "border-top-width",
      "border-top-color",
      "color",
      "height",
    ]);
    expect(filter["height"]).toBe(`${tokens.breadcrumb.filterChip.h}px`);
    expect(filter["border-top-width"]).toBe(`${tokens.breadcrumb.filterChip.border.weight}px`);
    expect(filter["border-top-color"]).toBe(rgb(tokens.breadcrumb.filterChip.border.color));
  });

  test("the header sits on --u, like the kitchen's", async ({ page }) => {
    // Two traps here.
    //
    // First, getComputedStyle hands back --u as its unresolved clamp(), so it
    // has to be measured off something it sizes rather than read directly.
    //
    // Second -- and this cost a failing test -- --u is `0.09285cqw`, and an
    // element with `container-type` is NOT its own query container. On
    // .kitchen-stage itself cqw finds no container and falls back to the
    // viewport, so its border-radius resolves against 1440 (u clamps to 1.15)
    // while everything INSIDE it resolves against the Window's own ~1058
    // (u = 0.98). Probing the stage would measure the wrong unit. Measure from
    // a descendant, which is where the design's numbers actually apply.
    const u = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText = "width:calc(100*var(--u));position:absolute;visibility:hidden";
      document.querySelector(".kitchen-stage")!.appendChild(probe);
      const u = probe.getBoundingClientRect().width / 100;
      probe.remove();
      return u;
    });
    const header = await styles(page, ".kitchen-stage > div:first-child", [
      "padding-left",
      "padding-right",
      "border-bottom-width",
    ]);
    expect(parseFloat(header["padding-left"])).toBeCloseTo(tokens.header.padding.left * u, 1);
    expect(parseFloat(header["padding-right"])).toBeCloseTo(tokens.header.padding.right * u, 1);
    expect(header["border-bottom-width"]).toBe(`${tokens.header.border.weight}px`);
  });
});
