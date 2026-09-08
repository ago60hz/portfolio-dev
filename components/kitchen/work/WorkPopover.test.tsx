import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Work } from "@/content/works";
import { tag } from "@/content/tags";
import { useKitchen } from "@/lib/store";
import { WorkCan } from "../WorkCan";

const work = (over: Partial<Work> = {}): Work => ({
  slug: "sentio",
  title: "Sentio",
  blurb: "Website design and art direction for a news analysis app.",
  tags: ["websites"],
  labelTags: [tag("Website")],
  cta: "view",
  image: "/assets/works/sentio.webp",
  mark: "/assets/brands/sentio.webp",
  ...over,
});

describe("WorkCan + WorkPopover", () => {
  beforeEach(() => useKitchen.setState({ hoveredWork: null }));

  it("stays closed until asked", () => {
    render(<WorkCan work={work()} index={0} columns={3} />);
    expect(screen.queryByText(work().blurb)).not.toBeInTheDocument();
  });

  it("opens on keyboard focus, not just hover -- the can is reachable by tab", async () => {
    render(<WorkCan work={work()} index={0} columns={3} />);
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    expect(screen.getByText(work().blurb)).toBeInTheDocument();
  });

  it("stays open while focus moves into its own View link", async () => {
    render(<WorkCan work={work()} index={0} columns={3} />);
    await userEvent.tab(); // the can
    await userEvent.tab(); // the View link inside the popover
    expect(screen.getByRole("link", { name: "view" })).toHaveFocus();
    expect(screen.getByText(work().blurb)).toBeInTheDocument();
  });

  it("closes once focus leaves the card entirely", async () => {
    render(
      <>
        <WorkCan work={work()} index={0} columns={3} />
        <button type="button">after</button>
      </>,
    );
    await userEvent.tab(); // the can
    await userEvent.tab(); // the View link
    await userEvent.tab(); // out of the card
    await waitForElementToBeRemoved(() => screen.queryByText(work().blurb));
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("points View at the work's own route", async () => {
    render(<WorkCan work={work()} index={0} columns={3} />);
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "view" })).toHaveAttribute(
      "href",
      "/work/sentio",
    );
  });

  it("sends an off-site work out in a new tab, safely", async () => {
    render(<WorkCan work={work({ href: "https://unrefynedstudio.com/" })} index={0} columns={3} />);
    await userEvent.tab();
    const link = screen.getByRole("link", { name: "view" });
    expect(link).toHaveAttribute("href", "https://unrefynedstudio.com/");
    expect(link).toHaveAttribute("target", "_blank");
    // noreferrer as well as noopener: the referrer leaks which can was hovered.
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("lets more and view point at different places", async () => {
    render(
      <WorkCan
        work={work({
          cta: "more-view",
          href: "https://preview.eitherway.ai/demo/",
          moreHref: "https://www.linkedin.com/posts/praisefabilola_x",
        })}
        index={0}
        columns={3}
      />,
    );
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "view" })).toHaveAttribute(
      "href",
      "https://preview.eitherway.ai/demo/",
    );
    expect(screen.getByRole("link", { name: "more" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/posts/praisefabilola_x",
    );
  });

  it("keeps more on the local study when only view is overridden", async () => {
    render(<WorkCan work={work({ cta: "more-view", href: "https://example.com/" })} index={0} columns={3} />);
    await userEvent.tab();
    // Both fall to the same target rather than more silently 404ing.
    expect(screen.getByRole("link", { name: "more" })).toHaveAttribute(
      "href",
      "https://example.com/",
    );
  });

  it("renders both pills for the more-view variant", async () => {
    render(<WorkCan work={work({ cta: "more-view" })} index={0} columns={3} />);
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "more" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "view" })).toBeInTheDocument();
  });

  it("renders coming soon as plain text, never a link to a page that isn't there", async () => {
    render(<WorkCan work={work({ cta: "coming-soon" })} index={0} columns={3} />);
    await userEvent.tab();
    expect(screen.getByText("coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("carries the HOT ribbon -- every card has one, it is not a badge", async () => {
    render(<WorkCan work={work()} index={0} columns={3} />);
    await userEvent.tab();
    const ribbon = document.querySelector('img[src*="hot-ribbon"]');
    expect(ribbon).toBeInTheDocument();
  });

  it("renders the category tags as real text, tinted by category", () => {
    render(<WorkCan work={work({ labelTags: [tag("brand"), tag("growth")] })} index={0} columns={3} />);
    expect(screen.getByText("brand")).toHaveClass("bg-kitchen-red");
    expect(screen.getByText("growth")).toHaveClass("bg-kitchen-blue");
  });
});
