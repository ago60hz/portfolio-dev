import { useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'
import { D } from './dims'
import type { RadioState, TrackMeta } from '../core/types'

/**
 * The LED screen.
 *
 * A cross-origin iframe cannot be drawn into a WebGL texture — that is a
 * browser security boundary, not something to engineer around. So the video is
 * a DOM layer placed in 3D with a CSS3D transform (drei's <Html transform>),
 * which tracks the mesh in perspective. The camera stays near front-on and
 * parallax is capped, which is what keeps the illusion intact.
 *
 * Layout note: the readout strip sits BELOW the video, never over it. YouTube's
 * policies discourage obscuring the player, and a non-overlapping status strip
 * reads as deliberate industrial design rather than a compromise.
 */

/** 1 world unit = 100 CSS px, matching the reference measurement scale. */
const PX = 100
const W = D.screen.w * PX
const H = D.screen.h * PX
const STRIP_H = Math.round(H * 0.12)
const VIDEO_H = H - STRIP_H
/** 16:9 height for W, so the video covers the box and crops rather than letterboxes. */
const VIDEO_NATIVE_H = Math.round(W / (16 / 9))
const BAR_COUNT = 14

type Props = {
  state: RadioState
  meta: TrackMeta
  levelRef: React.RefObject<number>
  setHost: (el: HTMLDivElement | null) => void
}

export function ScreenPanel({ state, meta, levelRef, setHost }: Props) {
  const barsRef = useRef<HTMLDivElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const on = state.power !== 'off'
  const booting = state.power === 'booting'

  // Bars are driven straight from the level ref — routing this through React
  // state would re-render the whole tree 60 times a second.
  useEffect(() => {
    const el = barsRef.current
    if (!el) return
    const bars = Array.from(el.children) as HTMLElement[]
    const phase = bars.map((_, i) => i * 0.7)
    let raf = 0
    const tick = () => {
      const level = on ? levelRef.current : 0
      const t = performance.now() / 240
      for (let i = 0; i < bars.length; i++) {
        const wobble = 0.55 + 0.45 * Math.sin(t + phase[i])
        const hgt = Math.max(0.06, level * wobble)
        bars[i].style.transform = `scaleY(${hgt.toFixed(3)})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, levelRef])

  const title = state.notice ?? (booting ? 'TUNING…' : meta.title || 'DISCO DISCO')

  return (
    <Html
      transform
      // Measured empirically against this camera (fov 30°, dist ~13.5): drei's
      // Html transform does not map 1 css-px : 1 world-unit at scale=1 the way
      // its docs implied — scale=1 rendered ~192x too big. 0.4 is the derived
      // and measured-consistent factor for this scene's camera and screen size.
      scale={0.4}
      position={[0, D.screen.y, D.plate.d / 2 + D.screen.protrude + 0.006]}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[10, 0]}
    >
      <div
        style={{
          width: W,
          height: H,
          background: '#05060700',
          overflow: 'hidden',
          position: 'relative',
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
            inset: `0 0 ${STRIP_H}px 0`,
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
            inset: `0 0 ${STRIP_H}px 0`,
            background:
              'linear-gradient(160deg,#171b1e 0%,#0a0c0d 42%,#050607 100%)',
            opacity: on && !booting ? 0 : 1,
            transition: 'opacity 420ms ease',
            animation: booting ? 'ijo-flicker 140ms steps(2) infinite' : 'none',
          }}
        />

        {/* Readout strip — below the video, never over it. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: STRIP_H,
            background: '#070809',
            borderTop: '1px solid #1b1f22',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '0 4px',
            color: on ? '#ffb347' : '#2a2d30',
            transition: 'color 420ms ease',
          }}
        >
          <span
            style={{
              fontSize: 7,
              letterSpacing: 0.4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              textShadow: on ? '0 0 4px rgba(255,179,71,.55)' : 'none',
            }}
          >
            {on ? title : ''}
          </span>
          <div
            ref={barsRef}
            style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: STRIP_H - 5 }}
          >
            {Array.from({ length: BAR_COUNT }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 2,
                  height: '100%',
                  transformOrigin: 'bottom',
                  background: on ? '#ffb347' : '#232629',
                  transform: 'scaleY(0.06)',
                }}
              />
            ))}
          </div>
        </div>

        <style>{`@keyframes ijo-flicker{0%{opacity:.82}50%{opacity:1}100%{opacity:.9}}`}</style>
      </div>
    </Html>
  )
}
