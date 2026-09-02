import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { COMMENTS } from "@/content/comments";
import { CommentsThread } from "./CommentsThread";

describe("CommentsThread", () => {
  it("renders every comment", () => {
    render(<CommentsThread />);
    for (const c of COMMENTS) {
      expect(screen.getByText(c.author.name)).toBeInTheDocument();
    }
  });

  /**
   * These are real words from real people. A silent truncation would
   * misrepresent them, so assert every paragraph lands verbatim.
   */
  it("renders each testimonial in full, never truncated", () => {
    render(<CommentsThread />);
    for (const c of COMMENTS) {
      for (const para of c.body.split("\n\n")) {
        expect(screen.getByText(para)).toBeInTheDocument();
      }
    }
  });

  it("shows the reaction pills with their counts", () => {
    render(<CommentsThread />);
    const marco = COMMENTS.find((c) => c.id === "marco")!;
    for (const r of marco.reactions) {
      expect(screen.getAllByText(r.emoji).length).toBeGreaterThan(0);
      expect(screen.getAllByText(String(r.count)).length).toBeGreaterThan(0);
    }
  });

  it("carries Praise's reply for each comment, addressed to its author", () => {
    render(<CommentsThread />);
    for (const c of COMMENTS) {
      expect(screen.getByText(c.reply.body, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(`@${c.author.name}`)).toBeInTheDocument();
    }
  });
});
