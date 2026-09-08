"use client";

import { useCallback, useEffect, useState } from "react";
import { activeSection, isRead, playheadFor, tickCount, tickFor, tickWidth } from "@/lib/rail";

export type RailHeading = { id: string; label: string };

/**
 * The page-progress rail (35:338).
 *
 * A scale model of the article. Evenly spaced ticks span the whole rail and
 * each section's label sits at the tick matching its offset down the page, so
 * the gaps between labels show how long each section is before you read a word.
 *
 * Three things move (see lib/rail.ts for the geometry): ticks fill behind the
 * reader, a bump travels under the reading position, and the active label comes
 * up to full strength. Hovering a label previews its section by moving the bump
 * there, which is what makes the rail feel like a control rather than a readout.
 */
export function ProgressRail({ headings }: { headings: RailHeading[] }) {
  const [count, setCount] = useState(0);
  const [offsets, setOffsets] = useState<number[]>([]);
  const [active, setActive] = useState(0);
  const [playhead, setPlayhead] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  const measure = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const fit = () => setCount(tickCount(el.clientHeight));
    fit();
    new ResizeObserver(fit).observe(el);
  }, []);

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("[data-study-scroll]");
    if (!scroller || count < 2) return;

    const topOf = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return 0;
      return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    };
    const place = () =>
      setOffsets(headings.map((h) => tickFor(topOf(h.id), scroller.scrollHeight, count)));
    const track = () => {
      setActive(
        activeSection(headings.map((h) => topOf(h.id)), scroller.scrollTop + scroller.clientHeight / 3),
      );
      setPlayhead(playheadFor(scroller.scrollTop, scroller.scrollHeight, scroller.clientHeight, count));
    };

    place();
    track();
    scroller.addEventListener("scroll", track, { passive: true });
    const ro = new ResizeObserver(() => { place(); track(); });
    ro.observe(scroller);
    return () => { scroller.removeEventListener("scroll", track); ro.disconnect(); };
  }, [headings, count]);

  // Hovering a label pulls the bump to that section without moving the page.
  const focus = hovered !== null ? (offsets[hovered] ?? playhead) : playhead;

  return (
    <nav
      ref={measure}
      aria-label="Sections"
      className="pointer-events-none absolute hidden xl:block"
      /*
       * No entrance on the rail, deliberately.
       *
       * Fading the whole nav in over its first measure looked better and cost
       * an axe violation: mid-fade, the section links blend with the sand and
       * measure 1.7:1 against a required 4.5. The brief asks for a smooth
       * transition on the rail, which the ticks already carry -- it does not
       * ask for the rail to arrive, and no flourish is worth text nobody can
       * read, however briefly.
       */
      style={{
        left: "calc(23 * var(--u))",
        top: "calc(106 * var(--u))",
        bottom: "calc(40 * var(--u))",
        width: "112px",
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const section = offsets.indexOf(i);
        const read = isRead(i, playhead);
        return (
          <div
            key={i}
            className="absolute left-0 flex items-center gap-1"
            style={{ top: `${(i / (count - 1)) * 100}%`, transform: "translateY(-50%)" }}
          >
            <span
              aria-hidden
              className={
                "block h-px shrink-0 transition-[width,opacity,background-color] duration-(--duration-state) ease-(--ease-smooth) " +
                // Lime marks how far you have read. Ticks are aria-hidden
                // decoration, so the colour carries no information a reader
                // needs and no contrast requirement follows it.
                (read ? "bg-kitchen-lime" : "bg-kitchen-brown-deep")
              }
              style={{
                width: `${tickWidth(i, offsets, focus)}px`,
                // Read ticks sit at full strength, the rest recede. This is the
                // progress signal; the bump only says where you are.
                opacity: read || section !== -1 ? 1 : 0.35,
              }}
            />
            {section !== -1 && (
              <a
                href={`#${headings[section].id}`}
                onMouseEnter={() => setHovered(section)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(section)}
                onBlur={() => setHovered(null)}
                className={
                  "font-doto pointer-events-auto ml-1 whitespace-nowrap text-fine tracking-[-0.04em] uppercase transition-colors duration-(--duration-state) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink " +
                  (section === active || hovered === section
                    ? "text-kitchen-ink"
                    : "text-kitchen-brown-deep")
                }
                aria-current={section === active ? "true" : undefined}
              >
                {headings[section].label}
              </a>
            )}
          </div>
        );
      })}
    </nav>
  );
}
