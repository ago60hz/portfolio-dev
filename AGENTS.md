<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 'JO'DISCO portfolio

A portfolio whose interface is a **kitchen**: works are spice-oil cans on
shelves, against a tiled wall. Mood is "fun, whacky, delightful — like a game."
Full plan: `~/.claude/plans/i-m-working-on-my-declarative-corbato.md`.

## Where things live

| Path | What |
|---|---|
| `design/spec.md` | **Design system source of truth.** Extracted from Figma once. Do not re-query Figma for anything it already answers. |
| `content/` | Works, filters, copy — typed data. Adding a work is a row here, not new code. |
| `lib/` | Pure logic. `filters.ts` today; `canvas/` (slash, particles, physics) later. |
| `lib/canvas/` | **Pure functions only.** `render.ts` is the sole file allowed to touch a 2D context — that's what keeps hit detection and gravity unit-testable with no canvas mock. |
| `components/ui/` | shadcn. Not hand-authored — regenerate with the CLI. |
| `radio_component/` | **Praise's package**, wired as an npm workspace. Do not edit. |
| `scripts/` | One-shot asset tooling (`normalize-assets`, `seam-check`, `find-period`). |

## Conventions

- **Tokens before values.** Colours, type, easings and durations live in the
  `@theme` block in `app/globals.css`, sourced from `design/spec.md`. Never
  hardcode a hex or a duration in a component.
- **Scene dimensions are `--u`, never pixels.** The design frame is 1077px wide
  and the Window is a `container-type: inline-size` element, so one Figma pixel
  is `var(--u)`. Write `calc(178 * var(--u))` and it reads 1-to-1 with Figma
  while scaling continuously. `--u` is clamped, so below ~668px of Window the
  scene pans instead of shrinking. **Type and hit targets are exempt** — 11px
  copy scaled with the scene is illegible, and 32px is an ergonomic floor.
- **Three structural colours**: `kitchen-purple` `#9770ff`, `kitchen-ink`
  `#000`, `kitchen-red` `#e50305`, plus the accents the handoff paints on chips
  and posters: `kitchen-lime` `#ddf45b` (all header text), `kitchen-paper`
  `#fafafa`, `kitchen-brown` `#755a3d`, `kitchen-blue` `#14a0e1`.
- **Can labels come from `works/cover_images/`.** The category chips are baked
  into that artwork and are correct there. Never overlay them as elements — the
  retired `main_image/` set had the wrong fills, which is what made this
  confusing.
- **Fonts**: Satoshi (body, self-hosted), Gochi Hand (logotype *and* the header
  greeting — it is live text now, not a bitmap), Doto (pixel chips + clock,
  needs `ROND 0` — use the `.font-doto` class), Danfo (the CHEF WAS CUTE sticker
  only, `ELSH 0`).
- **Chips are 17px tall by design and fail Fitts's Law.** Use the `hit-32`
  utility to expand the click target without changing the painted box.
- **The clock needs `.tabular`** or the top strip jitters every minute.
- Components stay under ~120 lines so edits are surgical.

## Radio — currently unmounted

**Not in the tree right now.** It was audible on load, which also breaks the
"nothing plays before a user gesture" gate, so `RadioSlot.tsx` was removed.
Two things to know before re-adding it:

1. It belongs bottom-left of the band under the third shelf (~`left 16u`), where
   Praise placed it in the handoff.
2. Importing `@ijodisco/radio-3d` pulls the package's raw TS into our `tsc`
   program **regardless of the tsconfig `exclude`**, because its `main` points
   at source. It currently fails our typecheck on a pre-existing error in its
   own `RadioBody.tsx` (`cloth` is undefined). That has to be fixed in the
   package — it is Praise's to fix — or the import has to stop being typed.

`@ijodisco/radio-3d` is a React Three Fiber component Praise owns and is still
reworking (fidelity, tilt, lighting all subject to change). The site talks only
to `RadioSlot.tsx`, never to `Radio3D` internals.

It brings `three`/R3F into the bundle, so it must be loaded via `next/dynamic`
with `ssr: false`. It also owns music playback via its own media providers —
Howler is for kitchen SFX only.

**Known pre-existing failure**: 2 of its 20 tests (`mediaProvider.test.ts`,
YouTube `mount()`) time out. Verified identical against its original
`node_modules`, so this is not a workspace artifact. Its suite is excluded from
our gate; the package owns its own correctness.

## Verify

```bash
npm run build && npx tsc --noEmit && npm run test && npx playwright test
```

**Build before typecheck, not after.** `app/layout.tsx` uses `LayoutProps<"/">`,
a type Next generates into `.next/types`. On a clean tree (or straight after
`rm -rf .next`) a leading `tsc --noEmit` fails with `Cannot find name
'LayoutProps'` — which looks like a code error and is not one.

Playwright runs against the production build, at 1440/1024/768/390.

**Always rebuild and restart the server before `playwright test`.** The config
sets `reuseExistingServer` outside CI, so a hand-started server left over from
an earlier build will serve stale chunk hashes and produce a phantom 500 on a
CSS chunk. If you see that, it is a stale `.next`, not a real regression:

```bash
pkill -f next-server; rm -rf .next && npm run build && npm run start &
```
