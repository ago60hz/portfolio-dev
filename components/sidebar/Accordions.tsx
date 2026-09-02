"use client";

import { useKitchen } from "@/lib/store";
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
  ACHIEVEMENTS_TEASER,
  CHEF_BIO,
  CHEF_TOOLS,
  COMMENTERS,
} from "@/content/copy";
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
  "**:data-[slot=accordion-trigger-icon]:size-4 " +
  "**:data-[slot=accordion-trigger-icon]:text-current";

/** The label flexes so everything after it hugs the right edge. */
const LABEL = "flex-1 truncate text-left";

export function Accordions() {
  // Controlled from the store: the Window stickers open these panels from
  // across the page, so the primitive cannot own the open state.
  const openAccordion = useKitchen((s) => s.openAccordion);
  const setOpenAccordion = useKitchen((s) => s.setOpenAccordion);
  const chefOpen = openAccordion === "chef";

  return (
    <div className="w-full shrink-0 px-3 pt-2">
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
            <AvatarStack items={CHEF_TOOLS} alt="Tools I work with" />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 px-2 pb-3 text-fine text-pretty">
            {CHEF_BIO.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Paused: no expanded design exists, so this stays a row. The teaser
            is a second line beneath the title, as 21:423 draws it. */}
        <AccordionItem value="achievements">
          <AccordionTrigger
            className={cn(
              ROW,
              "aria-expanded:bg-kitchen-ink aria-expanded:text-kitchen-purple",
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col text-left">
              <span className="truncate">Clients &amp; Achievements</span>
              <span className="truncate text-fine">
                {ACHIEVEMENTS_TEASER}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-2 py-3 text-fine">
            More coming soon.
          </AccordionContent>
        </AccordionItem>

        {/* Black in BOTH states -- the node carries fill #000 with a #9770ff
            label while collapsed, so this never inverts on open. */}
        <AccordionItem
          value="comments"
          className="overflow-hidden rounded-(--radius-chip) bg-kitchen-ink text-kitchen-purple"
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
    </div>
  );
}
