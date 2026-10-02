import { describe, expect, it } from "vitest";
import { CASE_STUDIES, studyBySlug } from "./case-studies";
import { GALLERY_TILES } from "./gallery";
import { mediaAnchor } from "@/lib/anchors";
import { TILE_W, layoutSpread } from "@/lib/globe";

/** Every anchor a study actually renders, from the blocks the page draws. */
const anchorsOf = (slug: string) =>
  new Set(
    (studyBySlug(slug)?.blocks ?? []).flatMap((b) =>
      b.type === "image"
        ? [mediaAnchor(b.media.src)]
        : b.type === "loop"
          ? [mediaAnchor(b.media.src)]
          : b.type === "gallery"
            ? b.items.map((m) => mediaAnchor(m.src))
            : [],
    ),
  );

describe("GALLERY_TILES", () => {
  it("is not empty and has no duplicates", () => {
    expect(GALLERY_TILES.length).toBeGreaterThan(20);
    expect(new Set(GALLERY_TILES.map((t) => t.key)).size).toBe(GALLERY_TILES.length);
  });

  it("only shows work that has a case study to land on", () => {
    const slugs = new Set(CASE_STUDIES.map((s) => s.slug));
    for (const tile of GALLERY_TILES) expect(slugs).toContain(tile.slug);
  });

  it("draws from every case study, so the gallery is not one project", () => {
    const shown = new Set(GALLERY_TILES.map((t) => t.slug));
    expect(shown.size).toBe(CASE_STUDIES.length);
  });

  it("links every tile at a picture the study really renders", () => {
    // The guard on the whole feature. A tile whose anchor is not in the
    // article scrolls nowhere and drops the reader at the top of a long page
    // with no idea why -- and nothing else in the build would notice.
    for (const tile of GALLERY_TILES) {
      const [, anchor] = tile.href.split("#");
      expect(anchorsOf(tile.slug), `${tile.key} -> #${anchor}`).toContain(anchor);
    }
  });

  it("serves resized thumbnails, never the article's artwork", () => {
    for (const tile of GALLERY_TILES) {
      expect(tile.src).toMatch(/^\/assets\/gallery-tiles\//);
      // The pool is generated at 640px, 2x the widest print on the collage.
      // Anything wider means a stale run of scripts/gallery-tiles.mjs and
      // full-size artwork on the globe.
      expect(tile.width).toBeLessThanOrEqual(640);
    }
  });

  it("lays out a wall whose wrap happens clear of the frame", () => {
    /*
     * The guard on the pool's SIZE, which nothing else would catch.
     *
     * The wall repeats on its own extent, so a tile crossing half a period
     * from the middle is moved a whole period back -- and if the pool thins
     * out, that period shrinks until the jump happens inside the Window and a
     * picture visibly teleports across the wall. The frame is the design's
     * 1077 x 884 less the 38u header.
     */
    const spread = layoutSpread(GALLERY_TILES.map((t) => t.width / t.height));
    const tallest = Math.max(...spread.slots.map((s) => s.h));
    expect(spread.periodX).toBeGreaterThan(1077 + TILE_W);
    expect(spread.periodY).toBeGreaterThan(884 - 38 + tallest);
  });

  it("interleaves the studies rather than listing them", () => {
    // The first pass has to deal one tile from each study before any study
    // takes a second, or half a rotation of the globe is one client.
    const first = GALLERY_TILES.slice(0, CASE_STUDIES.length).map((t) => t.slug);
    expect(new Set(first).size).toBe(CASE_STUDIES.length);
  });
});
