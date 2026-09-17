import Image from "next/image";
import { MaskWords } from "@/components/motion/MaskWords";
import { Reveal } from "@/components/motion/Reveal";
import { beat } from "@/lib/motion";
import type { CaseStudy } from "@/content/case-studies";
import { ToolText } from "./ToolText";

/** Doto sits 4% tight at every size in the design; Satoshi sits at 2%. */
const DOTO = "font-doto tracking-[-0.04em]";

function Meta({ label, value, slug }: { label: string; value?: string; slug?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-2">
      <dt className={`${DOTO} text-fine text-kitchen-brown-deep`}>{label}</dt>
      <dd className="text-body leading-prose font-medium text-kitchen-ink">
        {slug ? <ToolText text={value} slug={slug} /> : value}
      </dd>
    </div>
  );
}

/**
 * The masthead and its meta grid (35:267).
 *
 * One unit in the design -- Frame 91 wraps both and carries the dashed rule
 * that closes them off, which is why the border lives here and not on the page.
 * The rule is bottom-only: Figma's uniform strokeWeight would have drawn a full
 * box, and `individualStrokeWeights` is what says otherwise.
 *
 * The rule is painted as a repeating gradient rather than `border-b border-dashed`
 * because the design specifies the rhythm -- 2 on, 1 off -- and CSS `dashed`
 * leaves that to the browser. The 20% is on the stroke in Figma, not baked into
 * the colour, so it stays a colour-mix against the brown token.
 */
export function StudyMasthead({ study }: { study: CaseStudy }) {
  return (
    <header
      className="pb-10"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, color-mix(in srgb, var(--color-kitchen-brown) 20%, transparent) 0 2px, transparent 2px 3px)",
        backgroundSize: "100% 1px",
        backgroundPosition: "bottom left",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-col gap-[21px] pb-10">
        {/* The masthead arrives in groups.
            It fills the whole first screen, so before this the heading was the
            only thing on the page that moved on load -- everything else was
            already settled and the article read as half-animated. Each group
            gets the same arrival the body blocks get, one beat apart, so the
            page assembles top to bottom instead of the title performing alone. */}
        <Reveal on="view" kind="arrive" className="flex items-center gap-2">
          {/* No frame of our own. These marks ship with their own ground and
              rounded corners, so a paper fill behind them showed through the
              transparent corners as two pale dots, and a border double-drew the
              edge they already have. Rendered at 32 rather than the frame's 24,
              and asked for a 2x source, because 24 from a 192 original was
              being served at 32 and reading soft. */}
          <Image
            src={study.icon}
            alt=""
            aria-hidden
            width={64}
            height={64}
            sizes="32px"
            quality={90}
            className="size-8 shrink-0 select-none"
          />
          <p className={`${DOTO} text-body text-kitchen-ink`}>
            {study.client} <span aria-hidden>|</span> {study.sector}
          </p>
        </Reveal>

        <h1 className="text-title font-medium text-balance text-kitchen-ink">
          <MaskWords text={study.title} />
        </h1>

        {study.hook && (
          <Reveal on="view" kind="arrive" delay={beat(2)}>
            <p className="font-gochi text-lead leading-[1.18] text-pretty text-kitchen-brown-deep">
              {study.hook}
            </p>
          </Reveal>
        )}
      </div>

      <Reveal on="view" kind="arrive" delay={beat(4)}>
      <dl className="grid grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-2">
        <Meta label="Role" value={study.role} />
        <Meta label="Client" value={study.client} />
        <Meta label="Scope" value={study.scope} slug={study.slug} />
        <Meta label="Timeline" value={study.timeline} />
      </dl>
      </Reveal>
    </header>
  );
}
