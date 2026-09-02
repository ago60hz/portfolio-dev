import type { LucideIcon } from "lucide-react";
import { AtSign, Briefcase, Code, Paperclip, Users } from "lucide-react";

/**
 * Praise's wallet address, shown truncated in the header split button.
 *
 * TODO: only `FbMn...zhea` was legible in the Figma export, so this is the
 * visible fragment standing in for the real address. Drop the full string in
 * and `truncateAddress` handles the rest -- nothing else needs to change.
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
 * TODO: the handoff draws real brand marks (LinkedIn, X, GitHub, Contra).
 * lucide-react v1 dropped its brand set and no licensed package covers all
 * four, so these are the closest generics. Export the four glyphs from 3:108
 * and swapping them is one line each -- the icon is data, not markup.
 */
export const CONTACT_LINKS: ContactLink[] = [
  { label: "Resume", href: "/resume.pdf", icon: Paperclip },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/praisefabilola", icon: Users },
  { label: "Twitter/X", href: "https://x.com/ijodisco", icon: AtSign },
  { label: "Github", href: "https://github.com/praisefabilola", icon: Code },
  { label: "Contra", href: "https://contra.com/praisefabilola", icon: Briefcase },
];
