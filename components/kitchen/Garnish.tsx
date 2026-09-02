import Image from "next/image";

type Item = {
  src: "chili" | "tomato" | "onion";
  /** All four are Figma pixels off the row's top-left, fed straight to --u. */
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  flipY?: boolean;
};

/**
 * Chillies, tomatoes and onions resting in the shelf.
 *
 * Positions are lifted verbatim from the handoff rows (1:224 / 1:289 / 1:329)
 * rather than invented, so the composition matches the design at every width --
 * expressing them in --u is what makes fixed coordinates responsive.
 *
 * Several sit at negative x or past 1077: they are meant to be clipped by the
 * Window edge, which is why the stage keeps `overflow: hidden`.
 *
 * They render at z-10, behind both the plank and the glass lip, so their feet
 * are hidden and they read as resting *in* the shelf. `data-garnish` is the
 * hook the Phase 4 slash game hit-tests against.
 */
const ROWS: Item[][] = [
  [
    { src: "tomato", x: -25, y: 179, w: 73, h: 48 },
    { src: "chili", x: 303, y: 184, w: 112, h: 53, rotate: -172.89, flipY: true },
    { src: "onion", x: 700.98, y: 177.33, w: 52.976, h: 49.153 },
    { src: "chili", x: 925.01, y: 174.32, w: 135.978, h: 68.363, rotate: -171.18, flipY: true },
  ],
  [
    { src: "tomato", x: 325, y: 177, w: 73, h: 48 },
    { src: "chili", x: 660, y: 184, w: 112, h: 53 },
    { src: "tomato", x: 1029.19, y: 177.59, w: 73, h: 48 },
  ],
  [
    { src: "chili", x: -43, y: 184.03, w: 112, h: 53 },
    { src: "onion", x: 337, y: 167, w: 64, h: 60, rotate: 180, flipY: true },
    { src: "tomato", x: 683.88, y: 179.29, w: 73, h: 48 },
    { src: "chili", x: 949, y: 184.03, w: 112, h: 53 },
    { src: "onion", x: 1029, y: 171, w: 64, h: 60 },
  ],
];

const u = (n: number) => `calc(${n} * var(--u))`;

export function Garnish({ shelfIndex }: { shelfIndex: number }) {
  const items = ROWS[shelfIndex % ROWS.length];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {items.map((it, i) => (
        <Image
          key={`${it.src}-${i}`}
          src={`/assets/garnishes/${it.src}.webp`}
          alt=""
          width={203}
          height={98}
          data-garnish={it.src}
          style={{
            position: "absolute",
            left: u(it.x),
            top: u(it.y),
            width: u(it.w),
            height: u(it.h),
            transform: `rotate(${it.rotate ?? 0}deg) scaleY(${it.flipY ? -1 : 1})`,
            filter: "drop-shadow(-2px 3px 4px rgba(0,0,0,0.25))",
          }}
          className="max-w-none select-none object-contain"
        />
      ))}
    </div>
  );
}
