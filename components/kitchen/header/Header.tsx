"use client";

import { useLocalTime } from "@/hooks/useLocalTime";
import { ContactMenu } from "./ContactMenu";

/**
 * The Window's top strip (1:193).
 *
 * 38u tall with `pl-16u pr-8u py-8u`, and every glyph lime -- the strip sits on
 * the tiled wall, not on a surface, so ink would disappear into the grout.
 * Height has a 32px floor because the type inside it does not scale with --u.
 */
export function Header() {
  const time = useLocalTime();

  return (
    <div
      className="relative z-40 flex w-full shrink-0 items-center justify-between gap-2"
      style={{
        minHeight: "max(var(--header-h), 32px)",
        paddingInline: "calc(16 * var(--u)) calc(8 * var(--u))",
        paddingBlock: "calc(8 * var(--u))",
      }}
    >
      <p className="flex min-w-0 items-baseline gap-1 text-kitchen-lime">
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
    </div>
  );
}
