import { describe, expect, it } from "vitest";
import { WORKS } from "@/content/works";
import { FILTERS } from "@/content/filters";
import { exitDirection, matchesFilter, partitionWorks, exitOffset } from "./filters";

const work = (tags: string[]) => ({ tags } as never);

describe("matchesFilter", () => {
  it("shows everything when no chip is active", () => {
    expect(matchesFilter(work(["motion"]), null)).toBe(true);
  });

  it("matches a work carrying the tag", () => {
    expect(matchesFilter(work(["motion", "websites"]), "motion")).toBe(true);
  });

  it("rejects a work without it", () => {
    expect(matchesFilter(work(["websites"]), "motion")).toBe(false);
  });
});

describe("partitionWorks", () => {
  it("splits without losing or duplicating a work", () => {
    const { matched, dismissed } = partitionWorks(WORKS, "brand-design");
    expect(matched.length + dismissed.length).toBe(WORKS.length);
    expect(new Set([...matched, ...dismissed]).size).toBe(WORKS.length);
  });

  it("preserves shelf order within each side", () => {
    const { matched } = partitionWorks(WORKS, "product-design");
    const order = matched.map((w) => WORKS.indexOf(w));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("dismisses nothing when inactive", () => {
    expect(partitionWorks(WORKS, null).dismissed).toHaveLength(0);
  });

  it("survives a filter that matches nothing", () => {
    const { matched, dismissed } = partitionWorks([], "motion");
    expect(matched).toHaveLength(0);
    expect(dismissed).toHaveLength(0);
  });

  /** A chip matching nothing would render as a dead control. */
  it("leaves no chip empty — every filter matches at least one work", () => {
    for (const f of FILTERS) {
      expect(
        partitionWorks(WORKS, f.id).matched.length,
        `filter "${f.label}" matches nothing`,
      ).toBeGreaterThan(0);
    }
  });

  it("matches the four works Praise tagged AI Assisted", () => {
    const slugs = partitionWorks(WORKS, "ai-assisted").matched.map((w) => w.slug);
    expect(slugs.sort()).toEqual(
      ["dean", "fagbemi-studios", "katsusando", "passportmonie"].sort(),
    );
  });
});

describe("exitDirection", () => {
  it("sends the left column left and the right column right", () => {
    expect(exitDirection(0, 3)).toBe("left");
    expect(exitDirection(2, 3)).toBe("right");
  });

  it("alternates the centre column by row", () => {
    expect(exitDirection(1, 3)).toBe("right"); // row 0
    expect(exitDirection(4, 3)).toBe("left"); // row 1
    expect(exitDirection(7, 3)).toBe("right"); // row 2
  });

  it("has no centre case in an even grid", () => {
    expect(exitDirection(1, 4)).toBe("left");
    expect(exitDirection(2, 4)).toBe("right");
  });

  it("degrades to a single direction in one column", () => {
    expect(exitDirection(0, 1)).toBe("right");
    expect(exitDirection(5, 1)).toBe("right");
  });
});

describe("exit distance", () => {
  const COLS = 3;

  it("moves every can far enough to clear the window", () => {
    // Left-bound cans must end past 0; right-bound past 1077.
    const X = [96, 450, 804];
    for (let i = 0; i < 9; i++) {
      const x = X[i % COLS];
      const end = x + exitOffset(i, COLS);
      const clears = end + 178 <= 0 || end >= 1077;
      expect(clears, `can ${i} at x=${x} ends at ${end}`).toBe(true);
    }
  });

  it("sends each can out by the side it already sits nearest", () => {
    expect(exitOffset(0, COLS)).toBeLessThan(0); // left column, exits left
    expect(exitOffset(2, COLS)).toBeGreaterThan(0); // right column, exits right
  });

  it("travels no further than it has to", () => {
    // Index 4 is the middle column of row 1, which also exits left. Its trip is
    // longer than the left column's, because it starts further from the edge.
    expect(Math.abs(exitOffset(0, COLS))).toBeLessThan(Math.abs(exitOffset(4, COLS)));
    // Same column, different row: identical distance.
    expect(exitOffset(0, COLS)).toBe(exitOffset(3, COLS));
  });

  it("alternates the middle column by row, matching exitDirection", () => {
    expect(exitOffset(1, COLS)).toBeGreaterThan(0); // row 0 -> right
    expect(exitOffset(4, COLS)).toBeLessThan(0); // row 1 -> left
  });
});
