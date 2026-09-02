import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CONTACT_LINKS, truncateAddress } from "@/content/contact";
import { ContactMenu } from "./ContactMenu";

describe("truncateAddress", () => {
  it("keeps the head and tail of a full address", () => {
    expect(truncateAddress("FbMnAbCdEfGhIjKlMnOpQrStUvWxYzhea")).toBe("FbMn...zhea");
  });

  it("leaves an already-truncated placeholder alone", () => {
    expect(truncateAddress("FbMn...zhea")).toBe("FbMn...zhea");
  });

  it("does not truncate a string too short to gain anything", () => {
    expect(truncateAddress("FbMnzhea")).toBe("FbMnzhea");
  });
});

describe("ContactMenu", () => {
  it("is a single control -- the split is visual, so it is one tab stop", () => {
    render(<ContactMenu />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("opens the menu on click", async () => {
    render(<ContactMenu />);
    expect(screen.queryByRole("link", { name: /Resume/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByRole("link", { name: /Resume/ })).toBeInTheDocument();
  });

  it("opens from the keyboard", async () => {
    render(<ContactMenu />);
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("link", { name: /Resume/ })).toBeInTheDocument();
  });

  it("carries every link with the right href", async () => {
    render(<ContactMenu />);
    await userEvent.click(screen.getByRole("button"));
    for (const { label, href } of CONTACT_LINKS) {
      expect(await screen.findByRole("link", { name: new RegExp(label) })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("names the wallet in the accessible label, since the text is truncated", () => {
    render(<ContactMenu />);
    expect(screen.getByRole("button")).toHaveAccessibleName(/FbMn\.\.\.zhea/);
  });
});
