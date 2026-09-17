import { describe, expect, it } from "vitest";
import { splitTools } from "./tools";

describe("splitTools", () => {
  it("swaps named tools out of a sentence and keeps the rest verbatim", () => {
    const parts = splitTools("Jitter handled motion, CapCut brought it together.");
    expect(parts.map((p) => (typeof p === "string" ? p : `[${p.name}]`)).join("")).toBe(
      "[Jitter] handled motion, [CapCut] brought it together.",
    );
  });

  it("keeps a possessive attached as plain text", () => {
    const parts = splitTools("using HeyGen's V3 model");
    expect(parts).toHaveLength(3);
    expect(parts[2]).toBe("'s V3 model");
  });

  it("leaves MetaMask plain in its own study, and badges it elsewhere", () => {
    expect(splitTools("MetaMask Card", "metamask")).toEqual(["MetaMask Card"]);
    expect(splitTools("MetaMask, Truffle", "bonadocs")).toHaveLength(3);
  });

  it("matches a two-word name whole", () => {
    const parts = splitTools("Midjourney, Nano Banana.");
    expect(parts.filter((p) => typeof p !== "string").map((p) => (p as { name: string }).name))
      .toEqual(["Midjourney", "Nano Banana"]);
  });

  it("does not badge the ordinary word", () => {
    expect(splitTools("the clock would jitter")).toEqual(["the clock would jitter"]);
  });
});
