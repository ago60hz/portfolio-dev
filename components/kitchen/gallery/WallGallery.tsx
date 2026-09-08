"use client";

import { useEffect, useRef } from "react";
import { useEntranceReady } from "@/hooks/useEntranceReady";
import { motion } from "motion/react";
import { useRevealProps } from "@/components/motion/Reveal";
import { bootDelay, beat } from "@/lib/motion";
import { useKitchen } from "@/lib/store";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * The wall gallery (90:296, restated as 121:395 peek / 121:838 reveal) -- the
 * board in the band under the third shelf.
 *
 * 481.321 x 115.471, centred in the 1077 Window (298 of margin each side).
 * Centred with a transform rather than pinned at Figma's x, so it stays centred
 * now that the scene can be wider than 1077u whenever --u binds on height.
 *
 * The band starts at 38 (header) + 3 x 230 (rows) = 728, so the board's natural
 * top is 740.560 - 728 = 12.560 inside it.
 */

/**
 * Peek (121:395) and reveal (121:838), both measured off the frames.
 *
 * The gallery frame is the coordinate space: 481.32 x 115.47 at Window
 * (297.68, 815) in peek, 919.49 x 220.59 at (78.59, 617) in reveal -- a clean
 * 1.910 scale about the frame's TOP centre (the horizontal centre is identical
 * in both, 538.34). The band starts at 728, so those tops are 87 and -111
 * band-local, a 198 lift.
 *
 * The board does NOT scale with the frame, which is the subtlety. In peek it
 * is inset and smaller -- 397.95 x 95.47 at (41.68, 20) -- and in reveal it
 * fills the frame edge to edge, so it grows by a further 1.2095 on top of the
 * frame's 1.910. That is why the artwork appears to spread out as it opens
 * rather than simply getting bigger.
 */
const FRAME = { w: 481.321, h: 115.471 };
const PEEK_TOP = 87;
const REVEAL_LIFT = 198;
const REVEAL_SCALE = 1.91;

/**
 * The board within the frame: inset at peek, edge to edge at reveal.
 *
 * The two states differ by a UNIFORM scale -- 397.95/481.321 and 95.47/115.471
 * are the same number to four places, and the stroke's 0.95/1.14 is within a
 * thousandth of it. So the board is laid out once at the reveal box and mapped
 * to peek with a single transform, rather than transitioning left, top, width,
 * height and border-width together. Five layout properties easing at once, on
 * an element whose background is sized `100% 100%`, re-rasterised the grid on
 * every frame of the reveal; one transform stays on the compositor.
 */
const BOARD = {
  peek: { x: 41.68, y: 20 },
  reveal: { w: FRAME.w, h: FRAME.h, stroke: 1.14 },
};

/** 397.95 / 481.321. See BOARD. */
const PEEK_SCALE = 0.8267;

/** Past this much wheel travel the state flips. Enough to ignore a nudge. */
const WHEEL_THRESHOLD = 24;

/**
 * The radio's box in each state, frame-local, and sized for real rather than
 * scaled: it is the one thing here that is not a bitmap, and R3F measures a
 * WebGL canvas with getBoundingClientRect, so a scaled ancestor makes it size
 * the drawing buffer to the scaled rect and then re-apply that as the canvas's
 * own CSS size -- the scale twice over, and a soft radio.
 */
const RADIO = {
  peek: { x: -6.679, y: 0.44, scale: 1 },
  reveal: { x: -231.85, y: -197.16, scale: 239.41 / 125 },
};

/**
 * The pinned artwork. Boxes are Figma's axis-aligned bounds, which is exactly
 * right here: the exports are FINAL -- the white polaroid edge and each layer's
 * rotation are already in the pixels. Adding a CSS border or a rotation on top
 * is what gave photos two frames and turned one of them upside down twice.
 */
type PinnedItem = { id: string; x: number; y: number; w: number; h: number; src: string };

const PINNED: PinnedItem[] = [
  { id: "90:347", x: 103.32, y: 29.72, w: 73.19, h: 73.19, src: "/assets/gallery/rectangle-15.webp" },
  { id: "90:349", x: 184.32, y: 20.44, w: 68.6, h: 68.6, src: "/assets/gallery/rectangle-17.webp" },
  { id: "90:348", x: 262.32, y: 6.44, w: 72.67, h: 72.67, src: "/assets/gallery/rectangle-16.webp" },
  { id: "97:368", x: 420.32, y: 29.44, w: 73.19, h: 73.19, src: "/assets/gallery/rectangle-18.webp" },
  { id: "97:366", x: 205.09, y: 76.44, w: 55, h: 31, src: "/assets/gallery/img-0953.webp" },
  // 90:350. Praise's export replaces the Danfo version this once carried: his
  // has the grain and the letterforms the type could only approximate.
  { id: "90:350", x: 344.32, y: 12.44, w: 68.6, h: 68.6, src: "/assets/gallery/poster.webp" },
  // 86:238, CHEF WAS CUTE -- back, and as artwork rather than the live
  // component it used to be. It is a sticker on the board now, not a control.
  { id: "86:238", x: 253.32, y: 89.44, w: 184, h: 36.88, src: "/assets/gallery/vibe.webp" },
];

/**
 * One pinned photo.
 *
 * Its own component only so the entrance hook is not called inside a map
 * callback -- the array is fixed length so the hook order would in fact be
 * stable, but that is an argument the next reader should not have to
 * reconstruct.
 */
function Pinned({ item, index, booted }: { item: PinnedItem; index: number; booted: boolean }) {
  const anim = useRevealProps("pop", booted, bootDelay("galleryArt") + beat(index));
  return (
    <motion.span
      {...anim}
      aria-hidden
      className="absolute bg-contain bg-center bg-no-repeat"
      style={{
        left: `calc(${item.x} * var(--u))`,
        top: `calc(${item.y} * var(--u))`,
        width: `calc(${item.w} * var(--u))`,
        height: `calc(${item.h} * var(--u))`,
        backgroundImage: `url(${item.src})`,
      }}
    />
  );
}

export function WallGallery() {
  const revealed = useKitchen((s) => s.galleryRevealed);
  const booted = useEntranceReady();
  const setRevealed = useKitchen((s) => s.setGalleryRevealed);
  const reduced = usePrefersReducedMotion();
  const leaving = useKitchen((s) => s.leavingKitchen);
  const setLeaving = useKitchen((s) => s.setLeavingKitchen);
  // Cleared on the way back in. The flag is set by the case-study link on the
  // way out, and this page is gone by the time the route changes.
  useEffect(() => setLeaving(false), [setLeaving]);
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Three ways in and out, all bound to the Window rather than the document:
   * the kitchen does not scroll -- the overflow fix clips it instead -- so
   * there is no scroll event to listen for. Wheel is the only signal that a
   * visitor tried to scroll down inside the room.
   */
  useEffect(() => {
    const stage = ref.current?.closest(".kitchen-stage") as HTMLElement | null;
    if (!stage) return;

    let travel = 0;
    const onWheel = (e: WheelEvent) => {
      // Reset the moment direction changes, so down-then-up reads as two
      // gestures rather than cancelling out to nothing.
      if (Math.sign(e.deltaY) !== Math.sign(travel)) travel = 0;
      travel += e.deltaY;
      if (travel > WHEEL_THRESHOLD) setRevealed(true);
      else if (travel < -WHEEL_THRESHOLD) setRevealed(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current) return;
      const target = e.target as Element | null;
      // Inside opens, anywhere else in the room closes. The radio's own
      // controls still get the event either way.
      //
      // The radio counts as inside even though it is not a descendant any
      // more: it is mounted in the layout so the music survives a case study,
      // which puts it outside this subtree and on top of the board. Without
      // this, pressing the radio -- or clicking anywhere the dock covers --
      // read as a click on the room and shut the gallery.
      const inside =
        ref.current.contains(target) || !!target?.closest?.("[data-radio-slot]");
      setRevealed(inside);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRevealed(false);
    };

    stage.addEventListener("wheel", onWheel, { passive: true });
    stage.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [setRevealed]);

  const radio = revealed ? RADIO.reveal : RADIO.peek;
  const ease = "var(--duration-max) var(--ease-smooth)";

  return (
    <div
      ref={ref}
      data-wall-gallery
      data-revealed={revealed || undefined}
      className={`absolute -translate-x-1/2 cursor-pointer ${revealed ? "z-50" : "z-30"}`}
      style={{
        left: "50%",
        top: `calc(${PEEK_TOP} * var(--u))`,
        width: `calc(${FRAME.w} * var(--u))`,
        height: `calc(${FRAME.h} * var(--u))`,
      }}
    >
      {/* The frame and its bitmaps move together: up 198, then 1.910 about the
          top centre, which is exactly how the two frames differ. */}
      <div
        data-gallery-board
        className="absolute inset-0"
        style={{
          transformOrigin: "top center",
          // The board drops out of the room when a study is opened. Overshoot
          // on a travel this large would peak well past the target on anything
          // that had to come back -- here it is leaving, and the extra reach is
          // off the bottom of the Window where it costs nothing and gives the
          // exit some weight.
          transform: leaving
            ? `translateY(calc(340 * var(--u)))`
            : revealed
              ? `translateY(calc(${-REVEAL_LIFT} * var(--u))) scale(${REVEAL_SCALE})`
              : "none",
          transition: reduced
            ? "none"
            : leaving
              ? "transform var(--duration-settle) var(--ease-overshoot)"
              : `transform ${ease}`,
        }}
      >
        {/* The board. Inset and smaller at peek, edge to edge at reveal, so it
            opens up under the artwork rather than just enlarging with it.

            Stroke and radius come from Praise, not the node: the pulled
            `121:553` reports an empty `strokes` array and no cornerRadius.

            Two elements, because they want different transforms and one
            element has only one: this wrapper carries the peek-to-reveal map,
            and the span inside it carries the entrance. Nesting them is free --
            both are translations and scales of a bitmap, and the radio is no
            longer a child of the board, so nothing here reaches a WebGL
            canvas. */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            transformOrigin: "top left",
            transform: revealed
              ? "none"
              : `translate(calc(${BOARD.peek.x} * var(--u)), calc(${BOARD.peek.y} * var(--u))) scale(${PEEK_SCALE})`,
            transition: reduced ? "none" : `transform ${ease}`,
          }}
        >
          {/* The board arrives from below, as if it were being hung. It
              animates itself rather than sitting in another wrapper: it is
              absolutely positioned against the board's coordinate space, and
              a div between them would take that away. */}
          <motion.span
            {...useRevealProps("rise", booted, bootDelay("galleryBoard"))}
            aria-hidden
            className="absolute top-0 left-0 bg-no-repeat"
            style={{
              width: `calc(${BOARD.reveal.w} * var(--u))`,
              height: `calc(${BOARD.reveal.h} * var(--u))`,
              border: `calc(${BOARD.reveal.stroke} * var(--u)) solid rgb(193 178 163 / 0.2)`,
              // 12 design units, so it scales with the board rather than
              // flattening out as the frame grows.
              borderRadius: "calc(12 * var(--u))",
              backgroundImage: "url(/assets/gallery/grid.svg)",
              // Fill the whole box, border included. `background-size` resolves
              // against the POSITIONING area, which defaults to the padding box
              // -- so with a border the grid was sized smaller than the box it
              // paints into and left a bare strip along the bottom edge.
              backgroundOrigin: "border-box",
              backgroundSize: "100% 100%",
              // Lifts the board off the wall. Design units, so the shadow
              // scales with the board instead of hardening into a thin line as
              // the frame grows -- and a `box-shadow` rather than a
              // `drop-shadow()` filter, because the grid is a background image
              // and a filter would have to rasterise the whole box every frame
              // of the peek/reveal transform.
              boxShadow: `0 calc(2 * var(--u)) calc(6 * var(--u)) calc(-1 * var(--u)) rgb(0 0 0 / 0.28),
                          0 calc(0.5 * var(--u)) calc(1.5 * var(--u)) 0 rgb(0 0 0 / 0.18)`,
            }}
          />
        </span>

        {PINNED.map((item, i) => (
          <Pinned key={item.id} item={item} index={i} booted={booted} />
        ))}
      </div>

      {/* 90:346. Only the slot, not the radio.

          The radio itself is mounted in the layout so the music survives the
          trip into a case study; RadioDock measures this box and matches it.
          Carrying no transition is the point -- the anchor jumps to the
          destination, so the dock reads a target instead of a frame of an
          easing, and does the travelling itself. */}
      <span
        data-radio-anchor
        aria-hidden
        className="absolute block"
        style={{
          left: `calc(${radio.x} * var(--u))`,
          top: `calc(${radio.y} * var(--u))`,
          width: `calc(${125 * radio.scale} * var(--u))`,
          height: `calc(${151 * radio.scale} * var(--u))`,
        }}
      />
    </div>
  );
}
