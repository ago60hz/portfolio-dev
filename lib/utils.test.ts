import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  /**
   * The regression this exists for: tailwind-merge groups every `text-*` class
   * together unless told otherwise, so a size and a colour on the same element
   * collapsed to just the colour. The selected filter chip lost `text-body`,
   * rendered at the browser default 16px instead of 14, and grew wide enough to
   * re-wrap the rows beneath it.
   */
  it("keeps a font size and a text colour together", () => {
    const out = cn("text-body", "text-kitchen-ink");
    expect(out).toContain("text-body");
    expect(out).toContain("text-kitchen-ink");
  });

  it("covers the whole scale", () => {
    for (const size of ["logo", "lead", "body", "fine", "micro", "title"]) {
      expect(cn(`text-${size}`, "text-kitchen-lime")).toContain(`text-${size}`);
    }
  });

  it("still lets one size override another", () => {
    expect(cn("text-body", "text-lead")).toBe("text-lead");
  });

  it("still lets one colour override another", () => {
    expect(cn("text-kitchen-ink", "text-kitchen-lime")).toBe("text-kitchen-lime");
  });

  it("merges conflicting utilities as normal otherwise", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
