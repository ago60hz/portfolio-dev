"use client";

import { Reveal } from "@/components/motion/Reveal";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { bootDelay } from "@/lib/motion";
import { useKitchen } from "@/lib/store";
import { useOnSand } from "@/hooks/useOnSand";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AccordionId } from "@/lib/store";
import { AvatarStack } from "./AvatarStack";
import { CommentsThread } from "./CommentsThread";
import {
  CHEF_BIO,
  CHEF_TOOLS,
  COMMENTERS,
} from "@/content/copy";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Renders **bold** spans without pulling in a markdown dependency. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Row chrome, from Accordions_list (4:1939): pad 4/4/4/8, radius 8, a fine
 * [2,1] dash, gap 4.
 *
 * Two things the node tree settles that are easy to get wrong:
 * the leading folder frame is HIDDEN on every row, so these carry no icon —
 * only the filter chips do; and the Label has `layoutGrow: 1`, which is what
 * pushes the avatar group and the chevron to the right edge.
 */
const ROW =
  "cursor-pointer items-center gap-1 rounded-(--radius-chip) border border-dashed " +
  "border-kitchen-ink py-1 pl-2 pr-1 text-body hover:no-underline " +
  // The house drop-shadow: a 2 bottom against 1 elsewhere, no blur. pb drops by
  // the same 1 so the outer height is unchanged and the rows below hold still.
  "transition-[border-width,padding] duration-(--duration-press) hover:border-b-2 hover:pb-[3px] " +
  "**:data-[slot=accordion-trigger-icon]:size-4 " +
  "**:data-[slot=accordion-trigger-icon]:text-current";

/** The label flexes so everything after it hugs the right edge. */
const LABEL = "flex-1 truncate text-left";

export function Accordions() {
  // Controlled from the store: the Window stickers open these panels from
  // across the page, so the primitive cannot own the open state.
  // Two icon sets: the originals sit on purple, the on-sand set on the case
  // study's ground. Everything else in the room recolours in CSS; artwork
  // cannot, so it is swapped here.
  const onSand = useOnSand();
  const tools = onSand
    ? CHEF_TOOLS.map((t) => ({ ...t, src: t.src.replace("/tools/", "/tools-sand/") }))
    : CHEF_TOOLS;

  const booted = useEntranceReady();
  const openAccordion = useKitchen((s) => s.openAccordion);
  const setOpenAccordion = useKitchen((s) => s.setOpenAccordion);
  const chefOpen = openAccordion === "chef";

  return (
    <Reveal kind="pop" booted={booted} delay={bootDelay("accordions")} className="w-full shrink-0 px-3 pt-2">
      <Accordion
        multiple={false}
        value={openAccordion ? [openAccordion] : []}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v.at(-1) : v;
          setOpenAccordion((next as AccordionId | undefined) ?? null);
        }}
        className="flex w-full flex-col gap-1"
      >
        {/* Opens onto its own pale ground (21:423): the card carries the border
            and the trigger dissolves into it, rather than the row inverting. */}
        <AccordionItem
          value="chef"
          className={cn(
            "rounded-(--radius-chip) transition-colors duration-(--duration-state)",
            chefOpen && "border border-kitchen-ink bg-kitchen-sky",
          )}
        >
          <AccordionTrigger
            className={cn(ROW, chefOpen && "border-transparent")}
          >
            <span className={LABEL}>Meet the head Cheff</span>
            <AvatarStack items={tools} alt="Tools I work with" collapseAfter={3} />
          </AccordionTrigger>
          <AccordionContent
            /*
             * 1:3814: Satoshi 500 at 12/18 (150%), tracking -0.02em, and
             * paragraph spacing 0. The design sets the bio as ONE text block
             * whose paragraphs are separated by a plain line break, so there is
             * no gap between them -- gap-3 was adding 12 that the design does
             * not have, and text-fine's 1.2 leading set it far too tight.
             */
            className="flex flex-col px-2 pb-3 text-fine leading-[1.5] font-medium text-pretty"
          >

            {CHEF_BIO.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}

            {/* Signs off the bio (1:3815), 28x27 at the content's left edge. */}
            <Image
              src="/assets/chef/praise-signature.svg"
              alt="Praise Fabilola's signature"
              width={28}
              height={27}
              className="mt-3 select-none"
            />
          </AccordionContent>
        </AccordionItem>

  
        {/* Black in BOTH states -- the node carries fill #000 with a #9770ff
            label while collapsed, so this never inverts on open. */}
        <AccordionItem
          value="comments"
          className="overflow-hidden rounded-(--radius-chip) bg-kitchen-ink text-kitchen-surface"
        >
          <AccordionTrigger className={cn(ROW, "border-solid border-kitchen-ink")}>
            <span className={LABEL}>Comments</span>
            <AvatarStack
              items={COMMENTERS.map((c) => ({ src: c.avatar, label: c.name }))}
              shape="circle"
              alt="People who have commented"
            />
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-3">
            <CommentsThread />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Reveal>
  );
}
