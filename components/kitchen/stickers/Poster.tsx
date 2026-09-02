import Image from "next/image";

/**
 * The torn-paper chrome shared by all three stickers (1:25 / 1:34).
 *
 * Every layer here is decoration: the red arrow and its stroke, the multiplied
 * paper grain, the photo taped to the right edge, and the inset highlight that
 * reads as a curled sheet. Callers supply only the copy and the palette.
 */
export function Poster({
  children,
  photo,
  photoBorder,
  tone,
  className,
  style,
}: {
  children: React.ReactNode;
  photo: string;
  /** Matches the sticker's own surface, so the photo reads as taped on. */
  photoBorder: string;
  tone: "note" | "vibe";
  className?: string;
  style?: React.CSSProperties;
}) {
  const isVibe = tone === "vibe";

  return (
    <div
      className={`relative overflow-clip rounded-(--radius-window) ${className ?? ""}`}
      style={style}
    >
      {/* The heart-and-arrow flourish. Two layers, as Figma stacks them: the
          filled shape and its offset outline. Praise's artwork -- never
          redrawn here, and never a single flattened copy, because the offset
          between the two is what gives it the hand-cut look. */}
      {[
        { file: "2", dx: isVibe ? 44.09 : 43.93 },
        { file: "", dx: isVibe ? 51.6 : 51.43 },
      ].map(({ file, dx }) => (
        <span
          key={dx}
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat"
          style={{
            left: `calc(50% + ${dx} * var(--u))`,
            top: `calc(50% + ${isVibe ? 17.49 : 17.99} * var(--u))`,
            // 78x65 per the node tree. The exported SVG's own viewBox is
            // cropped tighter, so contain-fit it rather than stretch.
            width: "calc(78 * var(--u))",
            height: "calc(65 * var(--u))",
            backgroundImage: `url(/assets/poster/${isVibe ? "vibe" : "note"}-heart${file ? "-2" : ""}.svg)`,
          }}
        />
      ))}

      {/* Photo, taped to the right edge and bleeding past the bottom. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -translate-x-1/2 overflow-clip border"
        style={{
          left: `calc(50% + ${isVibe ? 61.15 : 66.14} * var(--u))`,
          bottom: isVibe ? "calc(-22.29 * var(--u))" : "calc(-25.8 * var(--u))",
          width: `calc(${isVibe ? 60.278 : 36.676} * var(--u))`,
          height: `calc(${isVibe ? 88.427 : 53.803} * var(--u))`,
          borderColor: photoBorder,
        }}
      >
        <Image src={photo} alt="" fill sizes="80px" className="object-cover" />
      </span>

      {/* Paper grain. Flipped, because the source has a directional weave. */}
      <span
        aria-hidden
        className="poster-texture pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -scale-y-100"
        style={{
          width: "calc(217.5 * var(--u))",
          height: "calc(54 * var(--u))",
        }}
      />

      <div className="relative">{children}</div>

      {/* The curl. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow: `inset -2px 2px 1px 0 rgba(255,255,255,${isVibe ? 0.5 : 0.3})`,
        }}
      />
    </div>
  );
}
