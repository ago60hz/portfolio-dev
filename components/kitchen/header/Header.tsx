"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { useRevealProps } from "@/components/motion/Reveal";
import { bootDelay } from "@/lib/motion";
import { ContactMenu } from "./ContactMenu";
import { GalleryToggle } from "./GalleryToggle";

/**
 * The Window's top strip (1:193).
 *
 * 38u tall with `pl-16u pr-7u py-7u`. The strip carries its own ground -- a
 * solid fill with a 1px ink stroke -- where it used to sit straight on the
 * tiled wall. That is what lets the greeting be INK: it was lime only because
 * ink would have disappeared into the grout, and with a flat fill under it that
 * reason is gone. The split button keeps lime on black; it has its own ground.
 *
 * The fill is `kitchen-surface`, not `kitchen-purple`. 458:1830 against
 * 457:1411 turns the whole frame to paper when the gallery is on, and the strip
 * is part of that frame -- painting it in the role rather than the hue is what
 * lets it repaint with the sidebar and the page ground on one clock instead of
 * needing a second rule of its own.
 *
 * The local clock that used to sit here is gone, replaced by the Gallery
 * switch: the design gives the strip one thing to say and one control, and two
 * readouts either side of a bullet read as a status bar.
 *
 * Height has a 32px floor because the type inside it does not scale with --u.
 */
export function Header() {
  const booted = useEntranceReady();
  const ref = useRef<HTMLDivElement>(null);

  /*
   * Publish the strip's REAL height for the gallery to sit under.
   *
   * The token says 38u with a 32px floor, but the contents push past it on a
   * phone -- the split button has its own 22px floor inside 7u of padding --
   * so a layer positioned from the token started under this strip's bottom
   * rule and pictures slid over the line. Measured with a ResizeObserver's
   * `borderBoxSize`, which is fractional and untransformed: `offsetHeight`
   * rounds (and rounding down is exactly the overlap again), and
   * `getBoundingClientRect` carries the boot's cover scale.
   */
  useEffect(() => {
    const el = ref.current;
    const stage = el?.closest<HTMLElement>(".kitchen-stage");
    if (!el || !stage) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      stage.style.setProperty("--header-real", `${h}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // The strip animates itself rather than sitting in a Reveal wrapper: the
    // scene column sizes this as a flex child, and an extra div between them
    // changes what 38u is measured against.
    <motion.div
      ref={ref}
      {...useRevealProps("slide-top", booted, bootDelay("header"))}
      // Sticky, so the switch is always within reach. Below lg the room is
      // taller than its Window and scrolls, and a strip that scrolled away
      // with it took the only way out of the gallery along too. Above lg the
      // scene fits its Window and this does nothing at all.
      className="sticky top-0 z-40 flex w-full shrink-0 items-center justify-between gap-2 bg-kitchen-surface"
      style={{
        minHeight: "max(var(--header-h), 32px)",
        paddingInline: "calc(16 * var(--u)) calc(8 * var(--u))",
        // 7, not the 8 Figma's auto-layout reports. The frame is fixed at 38
        // tall and the 24-tall split button sits at y-offset 7 with 7 below
        // it, so 8 would not fit -- and the 2u it added overflowed the
        // Window, because 38 is what the 884-tall column budgets for.
        paddingBlock: "calc(7 * var(--u))",
        // The frame's 1px stroke is strokeAlign INSIDE and its box is still
        // 38 tall, so the rule cannot be a border: border-box or not, a
        // border grows a box already sized by its content, and the extra
        // pixel came straight back out of the 884 column. An inset shadow
        // paints inside the box and costs no layout. Only the bottom edge is
        // drawn -- the other three sit exactly under the Window's own border.
        boxShadow: "inset 0 -1px 0 var(--color-kitchen-ink)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2 text-kitchen-ink">
        <p className="font-gochi truncate text-lead">
          Welcome to my Kitchen <span aria-hidden>&bull;</span>
        </p>
        <GalleryToggle />
      </div>

      <ContactMenu />
    </motion.div>
  );
}
