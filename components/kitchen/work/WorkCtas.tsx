"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Work } from "@/content/works";
import { useKitchen } from "@/lib/store";

/** The pill row at (8u, 41u), right-aligned. Colours per the hover board. */
const CTA_PILL =
  "flex items-center justify-center rounded-full whitespace-nowrap text-fine leading-none " +
  "press " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink";

const PILL_BOX = {
  height: "calc(18 * var(--u))",
  paddingInline: "calc(8 * var(--u))",
} as const;

export const isExternal = (href: string) => /^https?:\/\//.test(href);

/**
 * Where a can's primary action points -- an off-site link when the work has
 * one, its own study otherwise.
 *
 * Exported because the mobile sheet needs the same answer and must not
 * re-derive it: two copies of this rule drift the first time a work gains an
 * `href`, and the drift is silent.
 */
export const viewHref = (work: Work) => work.href ?? `/work/${work.slug}`;

/**
 * One pill, routed by where it points.
 *
 * A local study gets `next/link` so the route prefetches. Anything off-site
 * gets a plain anchor: prefetching someone else's domain buys nothing and
 * leaks a visit they never made.
 */
function CtaPill({
  href,
  tone,
  children,
}: {
  href: string;
  tone: string;
  children: ReactNode;
}) {
  const className = `${CTA_PILL} ${tone}`;

  if (isExternal(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={PILL_BOX}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      style={PILL_BOX}
      // Told on the way out, not on the way in: this page unmounts the moment
      // the route changes, so the gallery's exit has to be started from the
      // click that causes it.
      onClick={() => useKitchen.getState().setLeavingKitchen(true)}
    >
      {children}
    </Link>
  );
}

/**
 * The popover's call to action.
 *
 * Five works have a case study here; the rest live somewhere else entirely --
 * a live store, a prototype, a Framer page -- so `href`/`moreHref` override the
 * local route. Absent, the pill falls back to this work's own study.
 */
export function Ctas({ work }: { work: Work }) {
  if (work.cta === "coming-soon") {
    return (
      <span
        className={`${CTA_PILL} bg-kitchen-brown text-kitchen-paper`}
        style={PILL_BOX}
      >
        coming soon
      </span>
    );
  }

  const view = viewHref(work);

  return (
    <>
      {work.cta === "more-view" && (
        <CtaPill href={work.moreHref ?? view} tone="bg-kitchen-lime text-kitchen-ink">
          more
        </CtaPill>
      )}
      <CtaPill href={view} tone="bg-kitchen-ink text-kitchen-paper">
        view
      </CtaPill>
    </>
  );
}
