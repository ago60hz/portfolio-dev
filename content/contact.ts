import type { LucideIcon } from "lucide-react";
import { AtSign, Code, Paperclip, Users } from "lucide-react";

/**
 * Praise's wallet address, shown truncated in the header split button.
 *
 * TODO: only `FbMn...zhea` was legible in the Figma export, so this is the
 * visible fragment standing in for the real address. Drop the full string in
 * and `truncateAddress` handles the rest -- nothing else needs to change.
 */
/**
 * NOT RENDERED. The wallet used to sit beside "Contact me" in the header and
 * Praise removed it. Kept because the address is real content and the helper is
 * tested, so putting it back is a one-line change rather than a re-derivation.
 */
export const WALLET_ADDRESS = "FbMn...zhea";

/** Head and tail joined by an ellipsis -- the pattern every wallet UI uses. */
export function truncateAddress(address: string, head = 4, tail = 4): string {
  if (address.includes("...")) return address;
  if (address.length <= head + tail + 3) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

export type ContactLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * The dropdown behind the header split button (3:108).
 *
 * TODO: the handoff draws real brand marks (LinkedIn, X, GitHub). lucide-react
 * v1 dropped its brand set and no licensed package covers them, so these are
 * the closest generics. Export the glyphs from 3:108 and swapping them is one
 * line each -- the icon is data, not markup.
 *
 * The X link is stored without the `?s=11&t=...` the mobile app appends when
 * you share a profile from it. Those are that share's own tracking parameters,
 * not part of the address: they carry no meaning for anyone else, and pasting
 * them into a public link hands the referrer to every visitor who clicks it.
 */
export const CONTACT_LINKS: ContactLink[] = [
  { label: "Resume", href: "/praise-fabilola-cv-2026.pdf", icon: Paperclip },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/praisefabilola/", icon: Users },
  { label: "Twitter/X", href: "https://x.com/praise_ai", icon: AtSign },
  { label: "Github", href: "https://github.com/ago60hz", icon: Code },
];
