"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useKitchen } from "@/lib/store";
import { Sidebar } from "./Sidebar";

/**
 * Under `md` the sidebar becomes a bottom sheet -- the kitchen keeps the
 * screen, and the bio/filters are a tap away.
 *
 * Open state lives in the store so a Window sticker can raise the sheet on the
 * panel it wants, but the decision to raise it at all is made here: the drawer
 * portals to <body>, so a `md:hidden` ancestor cannot keep it off the desktop.
 */
export function SidebarDrawer() {
  const isMobile = useIsMobile();
  const drawerOpen = useKitchen((s) => s.drawerOpen);
  const setDrawerOpen = useKitchen((s) => s.setDrawerOpen);
  const revealNonce = useKitchen((s) => s.revealNonce);

  useEffect(() => {
    if (revealNonce > 0 && isMobile) setDrawerOpen(true);
  }, [revealNonce, isMobile, setDrawerOpen]);

  // Growing past `md` mid-session leaves a sheet with nowhere to belong.
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile, setDrawerOpen]);

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} showSwipeHandle>
      {/*
        The logotype rather than the word "Menu".
        It is the one control always on screen on a phone, so it does the work
        a masthead does on desktop -- says whose site this is -- while still
        being the way in. The name is carried by `aria-label`, since the mark
        is an image: an icon-only control has to expose an accessible name.
      */}
      <DrawerTrigger
        aria-label="Open profile and filters"
        className="hit-32 flex cursor-pointer items-center gap-2 rounded-full border border-b-2 border-kitchen-ink bg-kitchen-surface px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink"
        style={{
          boxShadow:
            "0 1px 2px rgb(20 8 40 / 0.12), 0 6px 16px rgb(20 8 40 / 0.18)",
        }}
      >
        <Image
          src="/assets/brand/praise-fabilola.webp"
          alt=""
          aria-hidden
          width={425}
          height={53}
          className="h-[15px] w-auto select-none"
        />
      </DrawerTrigger>
      {/*
        A fixed height and ONE scroller.

        It was `max-h-[85dvh]` wrapping a `h-full overflow-y-auto` div around a
        Sidebar that was itself `h-full overflow-y-auto`. Two nested full-height
        scrollers inside a max-height parent cannot resolve a height, so the
        panel was cut off at the fold and nothing scrolled -- expanding "Meet
        the head Cheff" simply pushed the rest out of view. The sheet owns the
        scrolling now and the Sidebar is a plain column inside it.
      */}
      <DrawerContent className="flex h-[92dvh] flex-col overscroll-contain border-t border-kitchen-ink bg-kitchen-surface">
        <DrawerTitle className="sr-only">Profile and filters</DrawerTitle>

        {/* An explicit way out. The drag handle is discoverable on iOS and
            much less so on Android, and this sheet is tall enough that the
            room behind it is not an obvious tap target. */}
        <div className="flex shrink-0 justify-end px-2 pt-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
            className="hit-32 cursor-pointer rounded-full p-1 text-kitchen-ink"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
          <Sidebar variant="drawer" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
