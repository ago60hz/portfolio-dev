import { MaskWords } from "@/components/motion/MaskWords";
import { Reveal } from "@/components/motion/Reveal";
import type { Block } from "@/content/case-studies";
import { StudyImage } from "./StudyImage";
import { StudyLoop } from "./StudyLoop";
import { ToolText } from "./ToolText";
import { DriveEmbed } from "./DriveEmbed";
import { VimeoEmbed } from "./VimeoEmbed";

/** Doto sits 4% tight at every size in the design; Satoshi sits at 2%. */
const EYEBROW = "font-doto text-fine tracking-[-0.04em] uppercase text-kitchen-brown-deep";

function One({ block, slug, lead = false }: { block: Block; slug?: string; lead?: boolean }) {
  switch (block.type) {
    case "heading":
      return (
        // scroll-mt keeps a rail jump from tucking the heading under the header.
        <h2 id={block.id} className="scroll-mt-6 pt-6">
          <span className={`${EYEBROW} block`}>{block.railLabel}</span>
          {/* The claim rises out from under the eyebrow, a word at a time. */}
          <MaskWords
            as="div"
            text={block.text}
            className="mt-2 block text-lead font-medium text-balance text-kitchen-ink"
          />
        </h2>
      );

    case "subheading":
      return (
        // Negative bottom margin against the 30 stack gap: a heading belongs to
        // the paragraph beneath it, so it sits closer to what it introduces
        // (12) than to what it follows (38). Even spacing reads as a floating
        // line that could belong to either.
        <h3 className="-mb-[18px] pt-2 text-body font-medium text-balance text-kitchen-ink">
          {block.text}
        </h3>
      );

    case "prose":
      return (
        <p className="text-body leading-prose text-pretty text-kitchen-ink"><ToolText text={block.text} slug={slug} /></p>
      );

    case "list":
      return (
        <ul className="list-disc space-y-1 pl-5 text-body leading-prose text-pretty text-kitchen-ink marker:text-kitchen-brown-deep">
          {block.items.map((item) => <li key={item}><ToolText text={item} slug={slug} /></li>)}
        </ul>
      );

    case "quote":
      return (
        <blockquote className="font-gochi text-lead leading-[1.18] text-pretty text-kitchen-brown-deep">
          {block.text}
          {block.attribution && (
            <footer className={`${EYEBROW} mt-2 normal-case`}>{block.attribution}</footer>
          )}
        </blockquote>
      );

    case "metrics":
      return (
        <dl className="grid grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-2">
          {block.items.map((m) => (
            <div key={m.label} className="flex flex-col gap-2">
              <dt className={EYEBROW}>{m.label}</dt>
              <dd className="text-title font-medium text-kitchen-ink">{m.value}</dd>
            </div>
          ))}
        </dl>
      );

    case "image":
      return <StudyImage media={block.media} priority={lead} />;

    case "gallery":
      return (
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2">
          {block.items.map((m, i) => (
            // Only the first tile of a leading gallery: the rest are beside or
            // below it and lazy-loading them is the point.
            <StudyImage key={m.src} media={m} priority={lead && i === 0} />
          ))}
        </div>
      );

    case "loop":
      return <StudyLoop media={block.media} />;

    case "vimeo":
      return <VimeoEmbed {...block} />;

    case "drive":
      return <DriveEmbed {...block} />;
  }
}

/**
 * The article body.
 *
 * 30 between blocks is the gap the design opens between the masthead rule and
 * the first image (35:300), reused as the whole page's rhythm so nothing needs
 * a bespoke margin.
 *
 * Each block arrives as it is scrolled to. The Reveal wrapper is a plain div
 * in the flex column, so the 30 gap is unaffected -- it is on the parent.
 */
export function StudyBody({ blocks, slug }: { blocks: Block[]; slug?: string }) {
  /*
   * The first block that draws a still, and the only one allowed to preload.
   *
   * Found rather than assumed to be block 0: every study opens on prose, so
   * the lead image sits a few blocks down, and hard-coding an index would
   * preload a paragraph on one study and the right picture on another.
   *
   * `loop` is excluded on purpose. Those are the multi-megabyte UI recordings,
   * and preloading one would pull it into the critical path to save a pop-in
   * on a file that should never be in flight before it is scrolled to.
   */
  const leadIndex = blocks.findIndex(
    (b) => b.type === "image" || b.type === "gallery",
  );

  return (
    <div className="flex flex-col gap-[30px]">
      {blocks.map((block, i) =>
        // A heading animates its own words, so it does not also want the
        // block-level arrival on top -- two entrances on one element read as a
        // stutter rather than as emphasis.
        block.type === "heading" ? (
          <One key={i} block={block} slug={slug} />
        ) : (
          <Reveal key={i} on="view" kind="arrive">
            <One block={block} slug={slug} lead={i === leadIndex} />
          </Reveal>
        ),
      )}
    </div>
  );
}
