import { WORKS } from "@/content/works";
import { Header } from "./header/Header";
import { Shelf } from "./Shelf";
import {
  RevenueSticker,
  TestimonialSticker,
  VibeSticker,
} from "./stickers/Stickers";

/** Cans per shelf, as the design draws it. */
const PER_SHELF = 3;

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
  const shelves = intoShelves(WORKS, PER_SHELF);

  return (
    <div className="kitchen-stage flex h-full w-full flex-col overflow-hidden rounded-(--radius-window) border border-b-2 border-kitchen-ink bg-kitchen-paper">
      <div className="flex min-h-0 flex-1 overflow-auto">
        <div
          className="kitchen-scene flex min-h-full flex-1 flex-col bg-repeat"
          style={{
            backgroundImage: "url(/assets/scene/wall-tile.webp)",
            backgroundSize: "var(--wall-tile-size) auto",
          }}
        >
          <Header />

          {shelves.map((works, i) => (
            <Shelf key={i} works={works} index={i}>
              {/* Stickers belong to a row, so they travel with it. */}
              {i === 1 && (
                <div
                  className="absolute left-1/2 z-40 -translate-x-1/2"
                  style={{ top: "calc(24 * var(--u))" }}
                >
                  <RevenueSticker />
                </div>
              )}
              {i === 2 && (
                <div
                  className="absolute z-40"
                  style={{
                    left: "calc(91 * var(--u))",
                    top: "calc(24 * var(--u))",
                  }}
                >
                  <TestimonialSticker />
                </div>
              )}
            </Shelf>
          ))}

          {/* The band under the last shelf. It grows into whatever height is
              left so the radio and the vibe sticker stay on the Window floor,
              which is where the design puts them in the 884-tall frame. */}
          <div
            className="relative w-full flex-1"
            style={{ minHeight: "calc(157 * var(--u))" }}
          >
            {/* TEMPORARILY UNMOUNTED -- the radio was audible on load, which
                also breaks the "nothing plays before a user gesture" gate.
                Re-enable once it starts silent. */}
            <div
              className="absolute z-20"
              style={{
                left: "calc(868 * var(--u))",
                bottom: "calc(9.7 * var(--u))",
              }}
            >
              <VibeSticker />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
