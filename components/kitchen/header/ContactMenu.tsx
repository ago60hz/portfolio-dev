"use client";

import Image from "next/image";
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONTACT_LINKS, WALLET_ADDRESS, truncateAddress } from "@/content/contact";

/**
 * The header's split button (1:209) and the menu behind it (3:108).
 *
 * The split is purely visual -- Praise confirmed the whole control opens the
 * dropdown, so it is one <button>, not two. Two buttons would also mean two
 * tab stops for one action.
 */
export function ContactMenu() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Contact Praise Fabilola. Wallet ${truncateAddress(WALLET_ADDRESS)}`}
        className="group hit-32 flex shrink-0 cursor-pointer items-center gap-[calc(1.667*var(--u))] transition-transform duration-(--duration-press) ease-(--ease-out-soft) hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-lime motion-reduce:hover:translate-y-0"
      >
        {/* Leading half */}
        <span
          className="flex items-center gap-[calc(4*var(--u))] overflow-clip bg-kitchen-ink text-kitchen-lime transition-transform duration-(--duration-press) ease-(--ease-out-soft) group-hover:-translate-x-[2px] motion-reduce:group-hover:translate-x-0"
          style={{
            height: "max(calc(24 * var(--u)), 22px)",
            paddingInline: "calc(4 * var(--u)) calc(8 * var(--u))",
            borderRadius:
              "var(--radius-pill) var(--radius-pill-inner) var(--radius-pill-inner) var(--radius-pill)",
          }}
        >
          <span
            className="relative block shrink-0 overflow-clip rounded-full border border-kitchen-lime transition-transform duration-(--duration-state) ease-(--ease-out-soft) group-hover:rotate-[14deg] group-hover:scale-110 motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100"
            style={{ width: "calc(16 * var(--u))", height: "calc(16 * var(--u))" }}
          >
            <Image
              src="/assets/brand/praise-avatar.webp"
              alt=""
              aria-hidden
              fill
              sizes="24px"
              className="object-cover"
            />
          </span>
          <span className="text-body font-medium whitespace-nowrap">Contact me</span>
          <span aria-hidden className="text-body font-light">|</span>
          <span className="text-body whitespace-nowrap">
            {truncateAddress(WALLET_ADDRESS)}
          </span>
        </span>

        {/* Trailing half */}
        <span
          className="flex items-center justify-center bg-kitchen-ink transition-transform duration-(--duration-press) ease-(--ease-out-soft) group-hover:translate-x-[2px] motion-reduce:group-hover:translate-x-0"
          style={{
            height: "max(calc(24 * var(--u)), 22px)",
            paddingInline: "calc(6 * var(--u))",
            borderRadius:
              "var(--radius-pill-inner) var(--radius-pill) var(--radius-pill) var(--radius-pill-inner)",
          }}
        >
          <span
            className="flex items-center justify-center rounded-full bg-kitchen-lime text-kitchen-ink transition-transform duration-(--duration-state) ease-(--ease-out-soft) group-hover:scale-125 group-data-[popup-open]:rotate-180 motion-reduce:group-hover:scale-100"
            style={{ width: "calc(12 * var(--u))", height: "calc(12 * var(--u))" }}
          >
            <ChevronsUpDown aria-hidden className="size-[0.6em] min-h-2 min-w-2" />
          </span>
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-auto min-w-[200px] gap-0 rounded-(--radius-window) border border-kitchen-ink bg-kitchen-purple p-1 text-kitchen-ink ring-0"
      >
        <ul className="flex flex-col">
          {CONTACT_LINKS.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-(--radius-chip) px-2 py-1.5 text-body transition-colors duration-(--duration-press) hover:bg-kitchen-ink hover:text-kitchen-lime focus-visible:bg-kitchen-ink focus-visible:text-kitchen-lime focus-visible:outline-none"
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                <span className="flex-1 whitespace-nowrap">{label}</span>
                <ChevronRight aria-hidden className="size-3.5 shrink-0 opacity-60" />
              </a>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
