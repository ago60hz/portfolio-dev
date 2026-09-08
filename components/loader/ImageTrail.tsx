"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TRAIL } from "@/content/trail.generated";

/**
 * The image-trail cursor.
 *
 * A faithful rebuild of the Framer component at image-trail-cursor.framer.ai
 * in its default mode. The numbers below are not estimates -- they were read
 * out of that component's shipped source, so this behaves like the reference
 * rather than merely resembling it.
 *
 * Two deliberate differences, both because our host is a loading screen:
 * the original gates its frame loop on an IntersectionObserver, where ours is
 * full-bleed and always in view; and its scroll-driven spawning is dropped,
 * because the loader does not scroll.
 */

/** Every one of these is the reference component's own default. */
const MAX_ITEMS = 35;
const LIFESPAN = 750;
const REMOVAL_DELAY = 50;
/** Pointer travel, in px, before another picture is dropped. */
const MOUSE_THRESHOLD = 100;
/** Still inside the frame but not moving: keep dropping, this often. */
const IDLE_INTERVAL = 300;
const MAX_ROTATION = 25;
const SIZE = { w: 220, h: 270 };

/** Scale up, scale down. No opacity: the reference has none, and a fade
 *  softens exactly the snap that makes the effect read. */
const IN = { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] } as const;
const OUT = { duration: 1, ease: [0.87, 0, 0.13, 1] } as const;

type Item = { id: number; src: string; x: number; y: number; rot: number; dies: number };

export function ImageTrail({ active }: { active: boolean }) {
  const [items, setItems] = useState<Item[]>([]);

  const box = useRef<HTMLDivElement>(null);
  const live = useRef<Item[]>([]);
  const nextId = useRef(0);
  const lastPick = useRef(-1);
  const pointer = useRef({ x: 0, y: 0 });
  const lastSpawn = useRef({ x: 0, y: 0 });
  const inside = useRef(false);
  const moving = useRef(false);
  const idleAt = useRef(0);
  const removedAt = useRef(0);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: Item[]) => {
    live.current = next;
    setItems(next);
  }, []);

  /** Never the same picture twice running, which the reference also guards. */
  const pick = useCallback(() => {
    if (TRAIL.length === 0) return null;
    if (TRAIL.length === 1) return 0;
    let i = Math.floor(Math.random() * TRAIL.length);
    for (let tries = 0; i === lastPick.current && tries < 5; tries += 1) {
      i = Math.floor(Math.random() * TRAIL.length);
    }
    lastPick.current = i;
    return i;
  }, []);

  const spawn = useCallback(() => {
    const el = box.current;
    const i = pick();
    if (!el || i === null) return;
    const rect = el.getBoundingClientRect();
    // The loader sits inside the Window, which the boot scales up to cover the
    // viewport. getBoundingClientRect is in viewport space and `left`/`top`
    // below are in this element's own space, so the offset has to come back
    // through the scale or every picture lands short of the pointer by a third.
    // Derived from the element rather than read from the boot variable, so it
    // stays correct while the Window is mid-shrink.
    const sx = rect.width / el.offsetWidth || 1;
    const sy = rect.height / el.offsetHeight || 1;
    const item: Item = {
      id: nextId.current++,
      src: TRAIL[i].src,
      x: (pointer.current.x - rect.left) / sx,
      y: (pointer.current.y - rect.top) / sy,
      rot: (Math.random() - 0.5) * MAX_ROTATION * 2,
      dies: Date.now() + LIFESPAN,
    };
    const held = live.current;
    commit([...(held.length >= MAX_ITEMS ? held.slice(held.length - MAX_ITEMS + 1) : held), item]);
  }, [commit, pick]);

  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const now = Date.now();

      // Going inactive stops the spawning but not the drain, so the trail
      // empties itself the way it always does instead of blinking out.
      if (active && inside.current) {
        const dx = pointer.current.x - lastSpawn.current.x;
        const dy = pointer.current.y - lastSpawn.current.y;
        if (moving.current && Math.hypot(dx, dy) > MOUSE_THRESHOLD) {
          lastSpawn.current = { ...pointer.current };
          spawn();
        } else if (!moving.current && now - idleAt.current > IDLE_INTERVAL) {
          idleAt.current = now;
          spawn();
        }
      }

      // Drain from the front, one at a time. Clearing the whole expired batch
      // in a frame makes the tail vanish instead of unravelling.
      if (
        now - removedAt.current >= REMOVAL_DELAY &&
        live.current.length > 0 &&
        now >= live.current[0].dies
      ) {
        removedAt.current = now;
        commit(live.current.slice(1));
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, commit, spawn]);

  const track = (x: number, y: number) => {
    pointer.current = { x, y };
    inside.current = true;
    moving.current = true;
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => {
      moving.current = false;
    }, 100);
  };

  return (
    <div
      ref={box}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      onPointerMove={(e) => track(e.clientX, e.clientY)}
      onPointerEnter={(e) => {
        pointer.current = { x: e.clientX, y: e.clientY };
        lastSpawn.current = { ...pointer.current };
        inside.current = true;
      }}
      onPointerLeave={() => {
        inside.current = false;
        moving.current = false;
      }}
      style={{ pointerEvents: "auto" }}
    >
      <AnimatePresence initial={false}>
        {items.map((it) => (
          // Position and rotation on the wrapper, scale on the image. Keeping
          // them apart is what lets the scale animate without fighting the
          // centring translate.
          <div
            key={it.id}
            className="pointer-events-none absolute select-none"
            style={{
              left: it.x,
              top: it.y,
              width: SIZE.w,
              height: SIZE.h,
              transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
              willChange: "transform",
            }}
          >
            <motion.img
              src={it.src}
              alt=""
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, transition: OUT }}
              transition={IN}
              className="block h-full w-full rounded-[4px] object-cover"
              style={{ willChange: "transform" }}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
