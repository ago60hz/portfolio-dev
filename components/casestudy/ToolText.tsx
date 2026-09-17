import Image from "next/image";
import { splitTools } from "@/content/tools";

/**
 * Copy with every named tool swapped for an outlined logo badge that links to
 * the tool's site.
 *
 * The badge keeps the tool's name as real text, so the sentence still reads
 * (and copies, and is announced) exactly as written; the logo is decorative.
 * `whitespace-nowrap` stops a badge breaking between its logo and its name.
 * Off-site links get noreferrer as well as noopener, like the shelf's pills.
 */
export function ToolText({ text, slug }: { text: string; slug?: string }) {
  return splitTools(text, slug).map((part, i) =>
    typeof part === "string" ? (
      part
    ) : (
      <a
        key={i}
        href={part.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full border border-kitchen-brown py-px pr-2 pl-[3px] align-[-0.2em] leading-none whitespace-nowrap text-inherit no-underline transition-colors hover:bg-kitchen-brown/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink"
      >
        <Image src={part.logo} alt="" width={16} height={16} className="size-4 rounded-[4px]" />
        {part.name}
      </a>
    ),
  );
}
