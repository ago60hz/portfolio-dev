import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { satoshi, gochiHand, doto, danfo } from "./fonts";
import "./globals.css";

const TITLE = "Praise Fabilola / 'JO'DISCO";
const DESCRIPTION =
  "Founding Designer who takes work from first sketch to the bottom line. Product, brand, and the front-end that ties it together.";

export const metadata: Metadata = {
  /*
   * Every relative URL in this file and in the studies' own `generateMetadata`
   * resolves against this, so a preview card is only ever as correct as this
   * value: with the localhost fallback in play, a share on any real network
   * points at the sharer's own machine and the image silently fails to load.
   *
   * Set NEXT_PUBLIC_SITE_URL to the live origin in the host's environment --
   * see LAUNCH.md. It is deliberately not defaulted to a guessed domain,
   * because a wrong absolute origin fails silently where localhost at least
   * fails obviously.
   */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "'JO'DISCO",
  authors: [{ name: "Praise Fabilola" }],
  creator: "Praise Fabilola",
  keywords: [
    "Founding Designer",
    "Product Design",
    "Brand Design",
    "Design Engineer",
    "Praise Fabilola",
    "JODISCO",
  ],
  // `app/icon.png`, `app/apple-icon.png` and `app/favicon.ico` are picked up by
  // convention, so there is no `icons` block here on purpose -- declaring one
  // would override the generated links and their cache-busting hashes.
  openGraph: {
    type: "website",
    url: "/",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    // `app/opengraph-image.png` doubles as the Twitter image by convention.
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

/**
 * The browser chrome takes the kitchen's own purple. Case studies repaint the
 * room to sand, but `themeColor` is a document-level declaration and the
 * kitchen is where visitors land, so it stays purple throughout rather than
 * flickering on navigation.
 */
export const viewport: Viewport = {
  themeColor: "#9770ff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${gochiHand.variable} ${doto.variable} ${danfo.variable}`}
    >
      <body className="font-satoshi antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
