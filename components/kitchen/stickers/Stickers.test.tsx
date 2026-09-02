import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useKitchen } from "@/lib/store";
import { RevenueSticker, TestimonialSticker, VibeSticker } from "./Stickers";

const reset = () =>
  useKitchen.setState({ openAccordion: null, revealNonce: 0, drawerOpen: false });

describe("stickers", () => {
  beforeEach(reset);

  it("the revenue sticker opens Clients & Achievements", async () => {
    render(<RevenueSticker />);
    await userEvent.click(screen.getByRole("button"));
    expect(useKitchen.getState().openAccordion).toBe("achievements");
  });

  it("the testimonial sticker opens Comments", async () => {
    render(<TestimonialSticker />);
    await userEvent.click(screen.getByRole("button"));
    expect(useKitchen.getState().openAccordion).toBe("comments");
  });

  it("bumps the nonce so clicking the same sticker twice re-opens the drawer", async () => {
    render(<RevenueSticker />);
    const button = screen.getByRole("button");
    await userEvent.click(button);
    const first = useKitchen.getState().revealNonce;
    await userEvent.click(button);
    expect(useKitchen.getState().revealNonce).toBe(first + 1);
  });

  it("does not open the drawer itself -- that is the drawer's call", async () => {
    render(<TestimonialSticker />);
    await userEvent.click(screen.getByRole("button"));
    expect(useKitchen.getState().drawerOpen).toBe(false);
  });

  it("cycles all three chef photos and wraps back to the first", async () => {
    render(<VibeSticker />);
    const button = screen.getByRole("button");
    const shown = () => button.querySelector("img")?.getAttribute("src") ?? "";

    const first = shown();
    const seen = new Set([first]);
    for (let i = 0; i < 2; i++) {
      await userEvent.click(button);
      seen.add(shown());
    }
    expect(seen.size).toBe(3);

    await userEvent.click(button);
    expect(shown()).toBe(first);
  });
});
