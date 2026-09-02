import { describe, expect, it } from "vitest";
import { WORKS } from "@/content/works";
import { FILTERS } from "@/content/filters";
import { exitDirection, matchesFilter, partitionWorks } from "./filters";

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
