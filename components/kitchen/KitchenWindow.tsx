"use client";

import { WORKS } from "@/content/works";
import { DESKTOP_COLUMNS, useShelfColumns } from "@/hooks/useShelfColumns";
import { FilterOverlay } from "./FilterOverlay";
import { Hearth } from "./Hearth";
import { SoundToggle } from "./SoundToggle";
import { Header } from "./header/Header";
import { Shelf } from "./Shelf";
import { WallGallery } from "./gallery/WallGallery";
import { Loader } from "@/components/loader/Loader";
import { BackgroundVideo } from "./BackgroundVideo";

function intoShelves<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * The kitchen (Window, 1:191).
 *
 * This element is the container --u measures against, so every child can be
 * authored in Figma pixels and still scale continuously. The paper surface sits
 * under the tile because the tile is the wall, not the window.
 *
 * `.kitchen-scene` gives the scene a legible floor: once --u bottoms out the
 * scene stops shrinking and the Window pans instead, which keeps the
 * composition 1-to-1 rather than inventing a reflow the design never drew.
 */
export function KitchenWindow() {
  /*
   * Three cans a shelf on the design frame, two on the phone -- which turns
   * nine works into three shelves or five. The split has to happen here
   * because a shelf is a section with its own plank and its own garnishes, so
   * no media query can carry a can from the end of one row to the start of the
   * next. See useShelfColumns for why this does not flash.
   */
  const columns = useShelfColumns();
  const shelves = intoShelves(WORKS, columns);

  return (
    <div className="kitchen-stage flex h-full w-full flex-col overflow-hidden rounded-(--radius-window) border border-b-2 border-kitchen-ink bg-kitchen-paper">
      <div className="flex min-h-0 flex-1 overflow-auto">
        <div
          // `isolate` contains the background film's OVERLAY blend to the
          // scene. Without a stacking context here it composites against
          // everything beneath it up the tree, which tints the Window's paper
          // ground and its border along with the wall.
          className="kitchen-scene relative isolate flex min-h-full flex-1 flex-col bg-repeat"
          style={{
            backgroundImage: "url(/assets/scene/wall-tile.webp)",
            backgroundSize: "var(--wall-tile-size) auto",
          }}
        >
          {/* The wall's film (1:192). First child and z-0, so it sits on the
              tile it blends with and under everything else in the room. */}
          <BackgroundVideo />

          <Header />

          {/* Steam off the Window floor -- the brief's "something is being
              cooked below the shelf". Spans the scene rather than the floor
              band so a plume can climb past the bottom shelf; it passes behind
              the shelves and the cans, because it is atmosphere, not
              furniture. */}
          <Hearth />

          {/* Dims the room behind the cans while a filter is active. */}
          <FilterOverlay />

          {shelves.map((works, i) => (
            <Shelf key={i} works={works} index={i} columns={columns} />
          ))}

          {/* The band under the last shelf. It grows into whatever height is
              left so the radio and the vibe sticker stay on the Window floor,
              which is where the design puts them in the 884-tall frame.

              156, not 157: header 38 + three rows at 230 + band 157 came to 885
              against an 884-tall frame, and that spare unit was enough to put a
              scrollbar on the Window at 1440x900.

              156 is a BASIS, not a floor. Every other child is `shrink-0`, so
              the band is the one part that can absorb the sub-pixel remainder
              when 884u does not divide evenly into the Window's real height --
              at 1440x800 that remainder was a whole pixel of vertical scroll.
              A hard `min-height` here blocked exactly the give this element
              exists to provide. */}
          <div
            className="relative w-full"
            /* `basis` below lg, `grow` above it. The band absorbing slack
               is what left the wall grid floating mid-wall on a tablet: with
               the column now taller than the screen there is no slack to
               absorb, and the radio and photos belong at the end of the
               scroll, on the floor. */
            style={{ flex: "var(--floor-flex, 1 1 calc(156 * var(--u)))" }}
          >
            {/* The radio and the vibe sticker both live in here now -- the
                gallery is where the design puts them. The radio starts
                powered off, so nothing plays before a gesture. */}
            {/* The wall grid is a desktop delight. On a re-framed room it
                competes with two cans a shelf for a width that has none to
                spare, and its board is sized in the design frame's units.
                `columns` is the same signal the room re-frames on, so the two
                can never disagree. */}
            {columns === DESKTOP_COLUMNS && <WallGallery />}

            {/* The one control that can silence the room without stopping the
                music. Bottom-left of the floor, clear of the centred board. */}
            <SoundToggle />
          </div>
        </div>
      </div>

      {/* Inside the Window on purpose: the boot scales the Window up to cover
          the viewport and back down again, and the loader rides along with it.
          Being in here is also what keeps it off the case studies. */}
      <Loader />
    </div>
  );
}
