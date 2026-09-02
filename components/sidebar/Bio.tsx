import { Globe } from "lucide-react";

const ZONES = ["WAT", "CET", "ET"];

export function Bio() {
  return (
    <div className="flex w-full shrink-0 flex-col gap-4 border-b border-kitchen-ink p-3">
      <p className="text-body text-pretty">
        <span className="underline decoration-kitchen-red decoration-[0.1em] underline-offset-2">
          Founding Designer
        </span>{" "}
        who takes work from first sketch to the bottom line.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-body">
          <Globe aria-hidden className="size-4 shrink-0" />
          Lagos, Nigeria (Remote)
        </span>

        <ul className="flex items-center gap-1">
          {ZONES.map((z) => (
            <li
              key={z}
              // Dotted, not dashed -- the design draws a fine dot rule here
              // and a dashed one on the accordion rows; they are different.
              className="chip trim-cap font-doto border-dotted text-fine [--chip-h:15px]"
            >
              {z}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
