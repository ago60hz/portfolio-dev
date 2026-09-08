import type { ReactNode } from "react";
import { Surface } from "@/components/Surface";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarDrawer } from "@/components/sidebar/SidebarDrawer";
import { RadioDock } from "@/components/kitchen/radio/RadioDock";

/**
 * The frame the kitchen and the case studies both sit inside.
 *
 * This is a layout rather than something each page repeats, so the sidebar
 * survives navigation: React keeps the subtree mounted, which means the open
 * accordion, its scroll position and the mobile drawer all persist when you
 * open a study and come back. Rebuilt per page, all three would reset.
 *
 * The radio is here for the same reason, and a stronger one: its YouTube host
 * is rendered inside the 3D scene, so a page that owned it would take the music
 * down with it on every navigation.
 *
 * The route group adds no URL segment -- "/" and "/work/[slug]" are unchanged.
 */
export default function KitchenLayout({ children }: { children: ReactNode }) {
  return (
    <Surface>
      {/*
        Desktop: fixed-width rail. Below md it collapses into a drawer.

        248 between md and lg. The rail turns on at exactly 768, and at its full
        clamp() that left a portrait tablet paying 272px for the sidebar while
        the scene next to it was still too narrow to draw at 1-to-1 -- both
        halves compromised at once.

        248 and not less: StickerStack's card has a 236px floor, and the note
        there records why -- below it the longest testimonial loses a line and a
        half of someone's words off the bottom of a fixed-height card. 248 minus
        the panel's own px-3 leaves exactly enough, so the tablet gets a
        narrower rail and nobody's quote gets clipped to pay for it.
      */}
      <aside className="hidden w-[248px] shrink-0 md:block lg:w-[clamp(272px,24.7vw,380px)]">
        <Sidebar />
      </aside>

      <div className="relative min-w-0 flex-1">
        {children}
        <RadioDock />
        {/* Above the loader (z-70), not behind it. The boot covers the whole
            viewport with the Window, so at z-30 the only control a phone has
            was hidden until the room had finished arriving. */}
        <div data-menu-fab className="absolute bottom-4 left-4 z-80 md:hidden">
          <SidebarDrawer />
        </div>
      </div>
    </Surface>
  );
}
