import localFont from "next/font/local";
import { Gochi_Hand, Doto, Danfo } from "next/font/google";

/** Body / UI. Self-hosted from Fontshare (free licence). */
export const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** The "Praise Fabilola" logotype. */
export const gochiHand = Gochi_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gochi",
  display: "swap",
  fallback: ["cursive"],
});

/** Pixel chips and the kitchen clock. ROND 0 = square dots, per the design. */
export const doto = Doto({
  subsets: ["latin"],
  // Variable: weight and ROND are set in CSS, not baked in here.
  axes: ["ROND"],
  variable: "--font-doto",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

/**
 * The "CHEF WAS CUTE" sticker only. Variable with an ELSH axis, which the
 * handoff pins to 0 -- set in CSS, since next/font rejects a fixed weight
 * alongside `axes`.
 */
export const danfo = Danfo({
  subsets: ["latin"],
  axes: ["ELSH"],
  variable: "--font-danfo",
  display: "swap",
  fallback: ["ui-serif", "serif"],
});
