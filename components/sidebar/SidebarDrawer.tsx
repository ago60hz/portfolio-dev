"use client";

import { useEffect } from "react";
import { Menu } from "lucide-react";
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
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger
        aria-label="Open profile and filters"
        className="hit-32 flex cursor-pointer items-center gap-2 rounded-lg border border-kitchen-ink bg-kitchen-purple px-3 py-1.5 text-body shadow-sm"
      >
        <Menu aria-hidden className="size-4" />
        Menu
      </DrawerTrigger>
      <DrawerContent className="max-h-[85dvh] bg-kitchen-purple">
        <DrawerTitle className="sr-only">Profile and filters</DrawerTitle>
        <div className="h-full overflow-y-auto p-2">
          <Sidebar />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
