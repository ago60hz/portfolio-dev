"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import type { Work } from "@/content/works";
import { WorkTag } from "./WorkTag";
import { isExternal, viewHref } from "./WorkCtas";

/**
 * A can's details on a phone.
 *
 * The popover is a HOVER affordance and hover does not exist on touch, so a tap
 * raises this instead. Routing comes from `viewHref` -- the same function the
 * popover's pills use -- so the two surfaces cannot disagree about where a can
 * goes.
 *
 * The layout follows the sheet conventions a phone already knows: a grab
 * handle, one hero, a tight block of copy, and the action last and full width
 * where the thumb is. Specifically:
 *
 * - CONCENTRIC RADIUS. The hero's corner is the sheet's corner minus the 16px
 *   of padding between them, so the two curves stay parallel instead of the
 *   inner one looking pinched.
 * - FITTS. The action is 48px tall and full width. The popover's pills are 20u
 *   boxes built for a pointer; reusing them here put a ~24px target in the one
 *   place the whole sheet exists to serve.
 * - ONE FOCAL POINT. The primary action is the only filled element below the
 *   hero. "more" is present when a work has it, but as an outline so the eye
 *   still lands in one place.
 * - The hero carries the work's own art, which is the same label just tapped --
 *   that continuity is what makes the sheet feel like it came from the can
 *   rather than appearing over it.
 */
export function WorkSheet({
  work,
  open,
  onOpenChange,
}: {
  work: Work | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open && !!work} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent
        className="overscroll-contain border-t border-kitchen-ink bg-kitchen-surface"
        style={{
          // Layered and warm rather than one flat black blur: a single shadow
          // at this size reads as a grey band under the edge.
          boxShadow:
            "0 -1px 2px rgb(20 8 40 / 0.10), 0 -8px 24px rgb(20 8 40 / 0.18), 0 -24px 56px rgb(20 8 40 / 0.14)",
        }}
      >
        {work && (
          <>
            <DrawerTitle className="sr-only">{work.title}</DrawerTitle>

            <div className="flex flex-col gap-4 px-4 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <span
                className="relative block w-full overflow-clip border border-kitchen-ink"
                // Sheet radius (24) less the 16 of padding beside it.
                style={{ borderRadius: 8, aspectRatio: "712 / 400" }}
              >
                <Image
                  src={work.image}
                  alt={work.title}
                  fill
                  sizes="100vw"
                  className="select-none object-cover"
                />
              </span>

              {/* One block: mark, name, blurb, tags. Grouped tightly so it
                  reads as a single unit against the action below it. */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {/* Padded and squared off, not a tight circle. `object-cover`
                      on a full-bleed round frame pushed each client's mark
                      against its own border and cropped the corners off the
                      square ones. Contained inside a squircle with a little
                      air, every logo sits in the frame the same way. */}
                  <span className="relative flex size-8 shrink-0 items-center justify-center overflow-clip rounded-[10px] border border-kitchen-ink bg-kitchen-paper p-1">
                    <Image
                      src={work.mark}
                      alt=""
                      aria-hidden
                      width={64}
                      height={64}
                      className="size-full object-contain"
                    />
                  </span>
                  <h2 className="text-lead leading-tight font-medium text-kitchen-ink">
                    {work.title}
                  </h2>
                </div>

                <p className="text-body text-pretty text-kitchen-ink/85">{work.blurb}</p>

                <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {work.labelTags.map((t) => (
                    <WorkTag key={t.label} tag={t} />
                  ))}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <SheetAction href={viewHref(work)} primary>
                  {work.cta === "coming-soon" ? "Coming soon" : "View the work"}
                </SheetAction>
                {work.cta === "more-view" && work.moreHref && (
                  <SheetAction href={work.moreHref}>Read more</SheetAction>
                )}
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/** A full-width, thumb-sized action. `Link` locally so the route prefetches. */
function SheetAction({
  href,
  primary = false,
  children,
}: {
  href: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  const className =
    "flex h-12 w-full items-center justify-center gap-1.5 rounded-(--radius-chip) border border-kitchen-ink text-body font-medium transition-colors duration-(--duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink " +
    (primary
      ? "bg-kitchen-ink text-kitchen-paper"
      : "bg-transparent text-kitchen-ink");

  const external = isExternal(href);

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <ArrowUpRight aria-hidden className="size-4" />
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
