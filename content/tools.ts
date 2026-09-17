/**
 * Third-party tools that render as a linked logo badge wherever case study copy
 * names them: body prose, bullet lists and the masthead's Scope line.
 *
 * Matching is exact and case-sensitive on `name`, so "Jitter" the product gets
 * a badge and "jitter" the word does not. Adding a tool is a row here plus a
 * 64px tile in compressed_assets/tool_logos/ (normalize-assets copies it).
 *
 * `skipIn` lists studies where the name is not a tool mention. MetaMask is the
 * client in its own study, so "MetaMask Card" stays plain text there, while
 * the same word in the Bonadocs developer stack gets its badge.
 */
export type Tool = { name: string; logo: string; url: string; skipIn?: string[] };

const logo = (n: string) => `/assets/tool-logos/${n}.webp`;

export const TOOLS: Tool[] = [
  // AI and production
  { name: "Midjourney", logo: logo("midjourney"), url: "https://www.midjourney.com" },
  { name: "Nano Banana", logo: logo("nano-banana"), url: "https://gemini.google/overview/image-generation/" },
  { name: "HeyGen", logo: logo("heygen"), url: "https://www.heygen.com" },
  { name: "ElevenLabs", logo: logo("elevenlabs"), url: "https://elevenlabs.io" },
  { name: "Jitter", logo: logo("jitter"), url: "https://jitter.video" },
  { name: "CapCut", logo: logo("capcut"), url: "https://www.capcut.com" },
  // The Bonadocs interviewees' developer stack
  { name: "Solidity", logo: logo("solidity"), url: "https://soliditylang.org" },
  { name: "JavaScript", logo: logo("javascript"), url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { name: "React", logo: logo("react"), url: "https://react.dev" },
  { name: "Node", logo: logo("node"), url: "https://nodejs.org" },
  { name: "MetaMask", logo: logo("metamask"), url: "https://metamask.io", skipIn: ["metamask"] },
  // Truffle and Ganache were sunset by Consensys; the archive is their home now.
  { name: "Truffle", logo: logo("truffle"), url: "https://archive.trufflesuite.com" },
  { name: "Remix", logo: logo("remix"), url: "https://remix.ethereum.org" },
  { name: "Ganache", logo: logo("ganache"), url: "https://archive.trufflesuite.com/ganache/" },
  { name: "Slack", logo: logo("slack"), url: "https://slack.com" },
];

const byName = new Map(TOOLS.map((t) => [t.name, t]));

// Longest first, so a future "Nano Banana Pro" wins over "Nano Banana".
const pattern = new RegExp(
  `\\b(${[...byName.keys()]
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "g",
);

/** Text split into plain runs and tool mentions, in reading order. `slug` is
 *  the study being rendered, so a tool can opt out of one study. */
export function splitTools(text: string, slug?: string): (string | Tool)[] {
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => {
      const tool = byName.get(part);
      return tool && !(slug && tool.skipIn?.includes(slug)) ? tool : part;
    })
    // A skipped tool falls back to text; join it to its neighbours again.
    .reduce<(string | Tool)[]>((out, part) => {
      const last = out.length - 1;
      if (typeof part === "string" && typeof out[last] === "string") out[last] += part;
      else out.push(part);
      return out;
    }, []);
}
