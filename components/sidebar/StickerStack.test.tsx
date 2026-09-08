import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StickerStack } from "./StickerStack";
import { STACK } from "@/content/stickers";
import { COMMENTS } from "@/content/comments";

describe("StickerStack", () => {
  it("shows Tyreek first, as the brief asks", () => {
    render(<StickerStack />);
    expect(screen.getByRole("button")).toHaveAccessibleName(
      new RegExp(STACK[0].label.slice(0, 24)),
    );
    expect(STACK[0].id).toBe("tyreek");
  });

  it("has exactly one reachable card -- the pile behind it is scenery", () => {
    render(<StickerStack />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("sends the top card to the back and promotes the next", async () => {
    const user = userEvent.setup();
    render(<StickerStack />);

    for (const expected of STACK.slice(1)) {
      await user.click(screen.getByRole("button"));
      expect(screen.getByRole("button")).toHaveAccessibleName(
        new RegExp(expected.label.slice(0, 24)),
      );
    }
  });

  it("wraps back to the first card once the pile is exhausted", async () => {
    const user = userEvent.setup();
    render(<StickerStack />);

    for (let i = 0; i < STACK.length; i++) {
      await user.click(screen.getByRole("button"));
    }
    expect(screen.getByRole("button")).toHaveAccessibleName(
      new RegExp(STACK[0].label.slice(0, 24)),
    );
  });

  it("quotes the comments verbatim, never paraphrased", () => {
    // The pull-quotes are ellipsised fragments of the real testimonials, and
    // must stay word-for-word -- same rule content/comments.ts sets for the
    // bodies themselves.
    for (const id of ["tyreek", "marco", "joshua"]) {
      const card = STACK.find((s) => s.id === id)!;
      const body = COMMENTS.find((c) => c.id === id)!.body.toLowerCase();
      const fragments = card.text
        .replace(/\*\*/g, "")
        .replace(/[“”"]/g, "")
        .split("...")
        .map((f) => f.trim().toLowerCase())
        .filter(Boolean);

      for (const fragment of fragments) {
        expect(body, `${id}: "${fragment}" is not in the testimonial`).toContain(fragment);
      }
    }
  });
});
