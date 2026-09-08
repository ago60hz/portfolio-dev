import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContactMenu } from "@/components/kitchen/header/ContactMenu";
import type { FilterId } from "@/content/filters";
import { FilterCrumb } from "./FilterCrumb";

/**
 * The study's top strip (25:667).
 *
 * Same 38u box as the kitchen header and the same split Contact button, but ink
 * rather than lime: this strip sits on a surface, not on the tiled wall, so
 * lime would glare where in the kitchen it was the only legible colour.
 *
 * The breadcrumb is two chips at the sidebar's exact optical padding. The first
 * names the work's category and now acts on it: pressing it goes back to the
 * kitchen with that filter applied (see FilterCrumb). Works whose category is
 * not one of the sidebar's chips have no such destination, so those fall back
 * to the plain label this used to always be.
 */
export function StudyHeader({
  filterId,
  filterLabel,
  chipLabel,
}: {
  /** Absent when the work's first tag is not a sidebar filter. */
  filterId?: FilterId;
  filterLabel: string;
  chipLabel: string;
}) {
  return (
    <div
      className="relative z-40 flex w-full shrink-0 items-center justify-between gap-2 border-b border-kitchen-ink"
      style={{
        minHeight: "max(var(--header-h), 32px)",
        paddingInline: "calc(4 * var(--u)) calc(8 * var(--u))",
        // 7, not the 8 Figma's auto-layout reports. The frame is fixed at 38
        // tall and the 24-tall split button sits at y-offset 7 with 7 below
        // it, so 8 would not fit -- and the 2u it added overflowed the
        // Window, because 38 is what the 884-tall column budgets for.
        paddingBlock: "calc(7 * var(--u))",
      }}
    >
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-[calc(4*var(--u))]"
      >
        <Link
          href="/"
          aria-label="Back to the kitchen"
          className="hit-32 relative flex shrink-0 items-center justify-center text-kitchen-ink press hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink motion-reduce:hover:translate-x-0"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </Link>

        {/* --chip-h drops to 15 here; the sidebar draws these at 17. */}
        {filterId ? (
          <FilterCrumb id={filterId} label={filterLabel} />
        ) : (
          <span
            className="chip trim-cap hidden shrink-0 text-body font-medium text-kitchen-ink sm:inline-flex"
            style={{ "--chip-h": "15px" } as React.CSSProperties}
          >
            {filterLabel}
          </span>
        )}
        <span
          aria-hidden
          className="hidden shrink-0 text-body font-light text-kitchen-ink sm:inline"
        >
          /
        </span>
        <span
          className="chip trim-cap min-w-0 border-0 bg-kitchen-brown text-body font-medium text-kitchen-tan"
          style={{ "--chip-h": "15px" } as React.CSSProperties}
        >
          <span className="truncate">{chipLabel}</span>
        </span>
      </nav>

      <ContactMenu />
    </div>
  );
}
