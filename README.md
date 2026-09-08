# 'JO'DISCO

Praise Fabilola's portfolio. The interface is a kitchen: works are spice-oil
cans on shelves, against a tiled wall.

Next.js 16 · React 19 · TypeScript (strict) · Tailwind v4 · React Three Fiber

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Copy `.env.example` to `.env.local`. Nothing is required to run locally — the
one runtime variable, `NEXT_PUBLIC_SITE_URL`, falls back to localhost and only
matters in production, where it resolves every social preview image.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |
| `npm run test:e2e` | Playwright (builds and starts the app itself) |

## The gate

Run these **in this order** before shipping:

```bash
npm run build && npx tsc --noEmit && npm run test && npx playwright test
```

Build has to come first. `app/layout.tsx` uses `LayoutProps<"/">`, which Next
generates into `.next/types` during the build, so a leading `tsc --noEmit` on a
clean tree fails with `Cannot find name 'LayoutProps'` — and that is not a real
error.

Playwright runs five viewport projects plus a `motion` project at full
animation strength. The visual regression baselines are desktop-only and
tolerate a 1% pixel diff.

## Layout

```
app/
  (kitchen)/            route group — adds no URL segment
    page.tsx            the kitchen
    work/[slug]/        five case studies, statically generated
components/
  kitchen/              the room: shelves, cans, hearth, radio, gallery
  casestudy/            the article view
  sidebar/              chef bio, comments, filters, stickers
  ui/                   shadcn on @base-ui/react — regenerate, never hand-edit
  loader/ motion/       boot sequence and shared motion primitives
content/                all copy and case-study data, as typed TypeScript
lib/                    store, filters, motion tokens, audio, pure helpers
hooks/                  viewport, reduced-motion, scene-unit hooks
scripts/                asset normalisation and Figma sync, run by hand
design/                 spec.md and the design tokens the e2e suite asserts on
radio_component/        the 3D radio, an npm workspace
```

Content is typed TypeScript, not MDX or a CMS — one less dependency, one less
build path, and image dimensions stay type-checked.

`radio_component/` is a workspace published as `@ijodisco/radio-3d`. It ships
raw TypeScript, which is why the root `next.config.ts` lists it under
`transpilePackages`. It has its own tests and lint config, and they do not run
under the root scripts.

## Assets

`public/assets/` is committed and is what ships. It is generated from source
art by `scripts/normalize-assets.mjs`; the originals are large and live outside
git.

## Deploying

Vercel, from `main`. The framework preset detects everything — no build command
override needed.

Set `NEXT_PUBLIC_SITE_URL` to the live origin in the host's environment before
the first production deploy.
