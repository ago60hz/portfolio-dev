import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { D } from './dims'
import type { RadioState } from '../core/types'

/**
 * The LED screen.
 *
 * A cross-origin iframe cannot be drawn into a WebGL texture — that is a
 * browser security boundary, not something to engineer around. So the video is
 * a DOM layer placed in 3D with a CSS3D transform (drei's <Html transform>),
 * which tracks the mesh in perspective. The camera stays near front-on and
 * parallax is capped, which is what keeps the illusion intact.
 *
 * The panel shows the video and nothing else — no readout strip, no caption
 * layer, nothing drawn over the player. That keeps it clear of YouTube's
 * "don't obscure the player" guidance and makes the screen read as a physical
 * display rather than a UI surface.
 */

/**
 * D.screen is the single source of truth for the display's geometry. There is
 * no companion WebGL slab any more: this element carries the screen's own
 * black face, so there is nothing for it to drift against.
 *
 * PX is just the working resolution of the DOM layer: the markup is laid out
 * at 100 CSS px per world unit so text and the video stay crisp, then scaled
 * back down to world size.
 */
const PX = 100
const W = D.screen.w * PX
const H = D.screen.h * PX

/**
 * drei's <Html transform> applies a fixed normalisation rather than mapping
 * 1 CSS px to 1 world unit at scale=1. Measured against a known-size mesh and
 * stable across both cameras this scene has used (fov 30 @ 13.5, fov 15 @
 * 37.2), so it holds as a constant.
 *
 * Exactness matters much less now than it did: with the screen's black face
 * living on this element, there is no second object for it to disagree with —
 * this only sets how large the panel reads on the chassis.
 */
const HTML_UNITS_PER_PX = 41.7
const HTML_SCALE = HTML_UNITS_PER_PX / PX
const VIDEO_H = H
/** 16:9 height for W, so the video covers the box and crops rather than letterboxes. */
const VIDEO_NATIVE_H = Math.round(W / (16 / 9))

type Props = {
  state: RadioState
  setHost: (el: HTMLDivElement | null) => void
}

export function ScreenPanel({ state, setHost }: Props) {
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const on = state.power !== 'off'
  const booting = state.power === 'booting'


  return (
    <Html
      transform
      scale={HTML_SCALE}
      position={[0, D.screen.y, D.plate.d / 2 + D.screen.protrude + 0.006]}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[10, 0]}
    >
      <div
        style={{
          width: W,
          height: H,
          // This element IS the screen — its own black face, not a layer over
          // a WebGL slab. Nothing behind it to drift against.
          background: '#111210',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          // Stands the panel a little proud of the chassis, the job the 3D
          // slab used to do, without a second object to keep aligned.
          boxShadow: '0 1.5px 3px rgba(0,0,0,.45), 0 0 0 0.5px rgba(0,0,0,.35)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          userSelect: 'none',
        }}
      >
        {/* Video. Kept mounted for the life of the component — unmounting it or
            setting display:none breaks playback, so power-off fades opacity. */}
        <div
          ref={videoWrapRef}
          style={{
            position: 'absolute',
            inset: 0,
            height: VIDEO_H,
            overflow: 'hidden',
            background: '#000',
            opacity: on && !booting ? 1 : 0,
            transition: 'opacity 420ms ease',
          }}
        >
          <div
            ref={setHost}
            style={{
              position: 'absolute',
              left: 0,
              top: (VIDEO_H - VIDEO_NATIVE_H) / 2,
              width: W,
              height: VIDEO_NATIVE_H,
            }}
          />
        </div>

        {/* Dead glass / boot flicker, above the video but faded out once live. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            // Nearly flat on purpose. A wider gradient reads as a seam
            // across the panel at render size rather than as glass.
            background:
              'linear-gradient(160deg,#141613 0%,#111210 55%,#0e0f0d 100%)',
            opacity: on && !booting ? 0 : 1,
            transition: 'opacity 420ms ease',
            animation: booting ? 'ijo-flicker 140ms steps(2) infinite' : 'none',
          }}
        />

        {/* No readout strip and no caption layer: the panel shows the video
            and nothing else, so the screen reads as a physical display rather
            than a UI surface. Track title is still exposed to assistive tech
            via the live region in Radio3D. */}

        <style>{`@keyframes ijo-flicker{0%{opacity:.82}50%{opacity:1}100%{opacity:.9}}`}</style>
      </div>
    </Html>
  )
}
