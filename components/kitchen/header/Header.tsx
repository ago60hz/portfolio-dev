"use client";

import { motion } from "motion/react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { useRevealProps } from "@/components/motion/Reveal";
import { bootDelay } from "@/lib/motion";
import { useLocalTime } from "@/hooks/useLocalTime";
import { ContactMenu } from "./ContactMenu";

/**
 * The Window's top strip (1:193).
 *
 * 38u tall with `pl-16u pr-7u py-7u`. The strip now carries its own ground --
 * a solid #9770ff fill with a 1px ink stroke -- where it used to sit straight
 * on the tiled wall. That is what lets the greeting and the clock be INK: they
 * were lime only because ink would have disappeared into the grout, and with a
 * flat fill under them that reason is gone. The split button keeps lime on
 * black; it has its own ground.
 *
 * Height has a 32px floor because the type inside it does not scale with --u.
 */
export function Header() {
  const time = useLocalTime();
  const booted = useEntranceReady();

  return (
    // The strip animates itself rather than sitting in a Reveal wrapper: the
    // scene column sizes this as a flex child, and an extra div between them
    // changes what 38u is measured against.
    <motion.div
      {...useRevealProps("slide-top", booted, bootDelay("header"))}
      className="relative z-40 flex w-full shrink-0 items-center justify-between gap-2 bg-kitchen-purple"
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
      <p className="flex min-w-0 items-baseline gap-1 text-kitchen-ink">
        <span className="font-gochi truncate text-lead">
          Welcome to my Kitchen |
        </span>
        {/* tabular so the strip doesn't jitter when the digits change */}
        <span className="font-doto tabular shrink-0 text-lead tracking-[-0.8px]">
          {time ?? "--:--"}
        </span>
        <span className="font-doto tabular hidden shrink-0 text-lead tracking-[-0.8px] sm:inline">
          local time
        </span>
      </p>

      <ContactMenu />
    </motion.div>
  );
}
