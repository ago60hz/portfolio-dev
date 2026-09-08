/**
 * The live origin, for the places that need an absolute URL.
 *
 * `sitemap.xml` and `robots.txt` are served as plain text and never pass
 * through `metadataBase`, so they cannot use a relative path the way the
 * metadata in `app/layout.tsx` does -- they have to spell the origin out.
 *
 * Set NEXT_PUBLIC_SITE_URL in the host's environment (see `.env.example`).
 * The localhost fallback is deliberate and matches `app/layout.tsx`: a wrong
 * absolute origin fails silently, where localhost fails obviously.
 *
 * Trailing slashes are stripped because this is always concatenated with a
 * path that starts with one. `app/layout.tsx` gets this for free -- `new URL`
 * normalises -- but a template literal does not, and a value pasted into a
 * host's dashboard arrives however the person pasting it had it on the
 * clipboard. One stray slash would put `//work/metamask` in the sitemap, which
 * is a different URL to a crawler.
 */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
