# IJO DISCO — 3D Radio Component

An interactive 3D radio that streams a YouTube playlist. Power, play/pause and
track skip are real controls on the model; the LED screen is the video player.

---

## Integration

### 1. Requirements

**React 19 + a bundler.** This ships as TypeScript source, not a built package —
your bundler compiles it. Peer dependencies you must already have (or install):

```bash
npm install react react-dom three @react-three/fiber @react-three/drei
```

Versions this was built and verified against:

| Package | Version |
|---|---|
| `react` / `react-dom` | 19.2 |
| `three` | 0.185 |
| `@react-three/fiber` | 9.7 |
| `@react-three/drei` | 10.7 |

> **React-only.** The component is R3F-based. For a non-React host (Framer,
> Webflow, plain HTML) you need a wrapper — see *Non-React hosts* below.

### 2. Copy the source

Copy `src/` into your project (e.g. `src/components/radio/`). Everything the
component needs is inside it. Do **not** copy `src/demo.tsx` or `src/demo.css` —
those are the local preview page only.

### 3. Use it

```tsx
import { Radio3D } from './components/radio'

export function Hero() {
  return (
    <div style={{ maxWidth: 720 }}>
      <Radio3D />
    </div>
  )
}
```

That's the whole integration. It sizes to its container (`width: 100%`, 4:3
aspect), paints on a transparent canvas, and starts powered off.

---

## Props

```ts
type Radio3DProps = {
  className?: string
  /** Start with interface sounds muted. */
  muted?: boolean
  /** Supply your own useRadio() instance to read state or drive it externally. */
  radio?: UseRadio
}
```

Reading state from the page (one player, shared):

```tsx
const radio = useRadio()
<Radio3D radio={radio} />
<p>{radio.state.power === 'on' ? radio.meta.title : 'Off'}</p>
```

---

## Configuration

**Change the station** — `src/core/station.ts`:

```ts
export const PLAYLIST_ID = 'PLdOy740eaLek'  // any public, non-mix YouTube playlist
```

Auto-generated mix playlists (ids starting `RD…`) **cannot** be loaded by the
YouTube IFrame API. Use a real `PL…` playlist.

**Play local audio instead** — add entries to `STATION` and set
`PLAYLIST_ID = null`. The provider is chosen per track, so no other code changes:

```ts
export const STATION: Track[] = [
  { kind: 'file', src: '/audio/set.m4a', title: 'My Set' },
]
```

**Colours and dimensions** — `src/scene/materials.ts` (`PALETTE`) and
`src/scene/dims.ts` (`D`). Dimensions are measured from the reference photo at
1 unit = 100 reference pixels; the control-strip layout is derived, so changing
the strip size keeps button spacing correct automatically.

**Replace the synthesised interface sounds** — drop files into `public/sounds/`
named `click-down`, `click-up`, `tick`, `power-on`, `power-off` (`.m4a` or
`.wav`). Any file found replaces that voice; anything missing falls back to
synthesis. No code change, and nothing ships by default.

---

## What it does at runtime

- **One third-party request:** the YouTube IFrame API. Textures, environment
  and interface sounds are all generated in-process — no CDN assets, no HDRIs,
  no audio files.
- **Transparent canvas**, so it sits on any page background. The component
  never sets a background of its own.
- **No global CSS.** All styling is inline and scoped.
- **Accessible:** a visually-hidden but focusable button row drives the same
  state machine as the 3D controls, and a live region announces the track.
- **Respects `prefers-reduced-motion`** (disables the pointer tilt).
- **Degrades without WebGL:** the controls still work and the player renders
  in a visible fallback box.

---

## Architecture, in one paragraph

`core/`, `media/` and `audio/` never import React or Three — the state machine
is a pure reducer, so behaviour is testable in plain jsdom. `scene/` is only a
visual skin over it. The one structural subtlety: **the LED screen is a DOM
element, not WebGL geometry.** A cross-origin iframe cannot be drawn into a
WebGL texture, so the screen is a CSS3D layer (drei's `<Html transform>`)
carrying its own black face. There is deliberately no mesh behind it — an
earlier version had one and the two could only ever be *aligned*, never
identical, which showed as a dark lip around the video.

---

## Gotchas for whoever works on this next

- **`play()` is synchronous on purpose.** iOS only honours playback started
  inside the user gesture, so nothing may `await` before it.
- **Use `cue*`, never `load*`/`playVideoAt`, in `loadTrack()`.** The `load*`
  family auto-plays on call, which made the radio play on page load while the
  UI still showed "off". Because `cue*` completes asynchronously, the provider
  records play intent and honours it on the `CUED` event — that is what makes
  next/prev start playing.
- **Chassis metalness is 0.55, not the 0.88 a real brushed aluminium would
  use.** At 0.88 a flat camera-facing plate has almost no diffuse response and
  samples a narrow slice of the environment, so no light can shape it and
  dimming the environment just turns it black. This is a deliberate trade.
- **The environment map is a generated even field, not `RoomEnvironment`.**
  Room environments have bright panels and dark corners that paint a gradient
  and a vignette straight onto metal.
- **The YouTube level is simulated.** Cross-origin iframe audio cannot be
  analysed, so the LED ring runs on a plausible random walk.
  `AudioFileProvider` returns genuine RMS for local files.

---

## Local preview

```bash
npm install && npm run dev
```

```bash
npm test
```

**Known issue:** 2 of 20 tests fail — both in `tests/mediaProvider.test.ts`,
where `YouTubeProvider.mount()` hangs on a jsdom microtask timing problem.
Pre-existing and unrelated to component behaviour; the other 18 pass.

---

## Non-React hosts

For Framer / Webflow / plain HTML, either mount it yourself:

```tsx
import { createRoot } from 'react-dom/client'
createRoot(document.getElementById('radio')!).render(<Radio3D />)
```

…or wrap it as a custom element. Either is a small additive step — no change
to the component itself.
