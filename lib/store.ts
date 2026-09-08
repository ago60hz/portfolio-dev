"use client";

import { create } from "zustand";
import type { FilterId } from "@/content/filters";

/** Which sidebar accordion is open. Only one at a time, as the design draws it. */
export type AccordionId = "chef" | "comments";

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
  /**
   * True once the visitor has muted from the toggle.
   *
   * The radio ARMS sound -- powering it on turns the kitchen's effects on --
   * and this is what stops that from overriding a deliberate mute the next time
   * the radio is cycled.
   */
  soundMutedByUser: boolean;
  /**
   * The wall gallery's reveal state. Peek is the resting state; revealed
   * scales the board up over a dimmed kitchen. In the store rather than local
   * to the gallery because the dim is a sibling of the shelves, not a child of
   * the board.
   */
  galleryRevealed: boolean;
  /**
   * False until the loading animation has handed the room over.
   *
   * The conductor for the entrance: every Reveal watches this rather than its
   * own mount, so the whole sequence starts on one signal instead of nine
   * components each guessing when their turn is.
   */
  booted: boolean;
  /**
   * Set the moment a case-study link is clicked, before the route changes.
   *
   * The kitchen page unmounts on navigation, so an exit animation cannot be
   * driven by the arrival of the new route -- the wall gallery has to be told
   * on the way out. WallGallery clears it when it mounts again.
   */
  leavingKitchen: boolean;
  /** Slash-game score. */
  score: number;

  toggleFilter: (id: FilterId) => void;
  /**
   * Set a chip on outright, with no toggle-off.
   *
   * What the case-study routes need: arriving at the kitchen with a filter
   * already chosen is not a toggle, and `toggleFilter` would clear the chip
   * whenever the visitor picked the one that was already active.
   */
  setFilter: (id: FilterId) => void;
  clearFilter: () => void;
  setHoveredWork: (slug: string | null) => void;
  setOpenAccordion: (id: AccordionId | null) => void;
  /** What a sticker calls: reveal a panel wherever the sidebar currently lives. */
  revealAccordion: (id: AccordionId) => void;
  setDrawerOpen: (open: boolean) => void;
  /** `byUser` marks a deliberate choice, which the radio must not overrule. */
  setSoundEnabled: (on: boolean, byUser?: boolean) => void;
  setLeavingKitchen: (on: boolean) => void;
  setGalleryRevealed: (open: boolean) => void;
  setBooted: (on: boolean) => void;
  addScore: (n?: number) => void;
};

export const useKitchen = create<KitchenState>((set) => ({
  activeFilter: null,
  hoveredWork: null,
  openAccordion: null,
  drawerOpen: false,
  revealNonce: 0,
  soundEnabled: false,
  soundMutedByUser: false,
  galleryRevealed: false,
  booted: false,
  leavingKitchen: false,
  score: 0,

  // Clicking the active chip clears it -- chips behave as a toggle, not a radio.
  toggleFilter: (id) =>
    set((s) => ({ activeFilter: s.activeFilter === id ? null : id })),
  setFilter: (id) => set({ activeFilter: id }),
  clearFilter: () => set({ activeFilter: null }),
  setHoveredWork: (slug) => set({ hoveredWork: slug }),
  setOpenAccordion: (id) => set({ openAccordion: id }),
  // Only opens the panel. Whether that ALSO opens the drawer is a viewport
  // question, so SidebarDrawer answers it -- Base UI portals drawer content to
  // <body>, which means a `md:hidden` wrapper cannot contain it.
  revealAccordion: (id) =>
    set((s) => ({ openAccordion: id, revealNonce: s.revealNonce + 1 })),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setSoundEnabled: (on, byUser = false) =>
    set((s) => ({
      soundEnabled: on,
      soundMutedByUser: byUser ? !on : s.soundMutedByUser,
    })),
  setLeavingKitchen: (on) => set({ leavingKitchen: on }),
  setGalleryRevealed: (open) => set({ galleryRevealed: open }),
  setBooted: (on) => set({ booted: on }),
  addScore: (n = 1) => set((s) => ({ score: s.score + n })),
}));
