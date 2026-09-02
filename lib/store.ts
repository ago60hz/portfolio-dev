"use client";

import { create } from "zustand";
import type { FilterId } from "@/content/filters";

/** Which sidebar accordion is open. Only one at a time, as the design draws it. */
export type AccordionId = "chef" | "achievements" | "comments";

type KitchenState = {
  /** Null means "no chip active" -- the whole shelf shows. */
  activeFilter: FilterId | null;
  /** Which can is hovered/focused. Drives the popover and the lift. */
  hoveredWork: string | null;
  /**
   * The open sidebar accordion. Controlled rather than left to the primitive
   * because the Window stickers open these panels from across the page.
   */
  openAccordion: AccordionId | null;
  /** Under `md` the sidebar is a drawer; a sticker has to open that too. */
  drawerOpen: boolean;
  /**
   * Bumped every time a sticker asks for a panel. The drawer watches this
   * rather than `openAccordion` so that clicking the same sticker twice still
   * re-opens it, and so the store never has to know the viewport width.
   */
  revealNonce: number;
  /** Sound is off until the visitor opts in. Never flip this by default. */
  soundEnabled: boolean;
  /** Slash-game score. */
  score: number;

  toggleFilter: (id: FilterId) => void;
  clearFilter: () => void;
  setHoveredWork: (slug: string | null) => void;
  setOpenAccordion: (id: AccordionId | null) => void;
  /** What a sticker calls: reveal a panel wherever the sidebar currently lives. */
  revealAccordion: (id: AccordionId) => void;
  setDrawerOpen: (open: boolean) => void;
  setSoundEnabled: (on: boolean) => void;
  addScore: (n?: number) => void;
};

export const useKitchen = create<KitchenState>((set) => ({
  activeFilter: null,
  hoveredWork: null,
  openAccordion: null,
  drawerOpen: false,
  revealNonce: 0,
  soundEnabled: false,
  score: 0,

  // Clicking the active chip clears it -- chips behave as a toggle, not a radio.
  toggleFilter: (id) =>
    set((s) => ({ activeFilter: s.activeFilter === id ? null : id })),
  clearFilter: () => set({ activeFilter: null }),
  setHoveredWork: (slug) => set({ hoveredWork: slug }),
  setOpenAccordion: (id) => set({ openAccordion: id }),
  // Only opens the panel. Whether that ALSO opens the drawer is a viewport
  // question, so SidebarDrawer answers it -- Base UI portals drawer content to
  // <body>, which means a `md:hidden` wrapper cannot contain it.
  revealAccordion: (id) =>
    set((s) => ({ openAccordion: id, revealNonce: s.revealNonce + 1 })),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setSoundEnabled: (on) => set({ soundEnabled: on }),
  addScore: (n = 1) => set((s) => ({ score: s.score + n })),
}));
