import { Suspense, lazy, useMemo, useRef } from 'react'
import { useRadio, type UseRadio } from './hooks/useRadio'
import type { ButtonId } from './core/types'

const RadioScene = lazy(() => import('./scene/RadioScene'))

/** Sync capability probe — decided once, before first paint. */
function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function mediaMatch(q: string): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(q).matches
}

const CONTROLS: { id: ButtonId; label: string }[] = [
  { id: 'up', label: 'Previous track' },
  { id: 'down', label: 'Next track' },
  { id: 'playPause', label: 'Play or pause' },
  { id: 'power', label: 'Power' },
]

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export type Radio3DProps = {
  className?: string
  /** Start muted. The user can still unmute via the returned control. */
  muted?: boolean
  /**
   * Drive an externally-owned radio instance instead of creating one. Lets a
   * page read state, or put controls elsewhere, without a second player.
   */
  radio?: UseRadio
}

export function Radio3D({ className, muted, radio: external }: Radio3DProps) {
  const own = useRadio({ muted })
  const radio = external ?? own
  const containerRef = useRef<HTMLDivElement>(null)

  const webgl = useMemo(detectWebGL, [])
  // Coarse pointer or a narrow viewport gets the cheaper render path.
  const lowPower = useMemo(
    () => mediaMatch('(pointer: coarse)') || mediaMatch('(max-width: 768px)'),
    [],
  )
  // Loads immediately, no poster/lazy gate — the 3D scene is the first paint.
  const visible = webgl

  const live = radio.state.power !== 'off'
  const status = radio.state.notice ?? (live ? radio.meta.title || 'Playing' : 'Off')

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', touchAction: 'manipulation' }}
    >
      {visible && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Suspense fallback={null}>
            <RadioScene radio={radio} lowPower={lowPower} />
          </Suspense>
        </div>
      )}

      {/* Without WebGL the radio still has to work, and the player still has to
          be visible — so the host renders here instead of inside the screen. */}
      {!webgl && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '34%',
            width: 222,
            height: 125,
            transform: 'translateX(-50%)',
            background: '#000',
            overflow: 'hidden',
          }}
        >
          <div ref={radio.setHost} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* Real controls. The meshes are a skin over these — keyboard and screen
          readers drive the same machine the 3D buttons do. */}
      <div style={SR_ONLY} role="group" aria-label="Radio controls">
        {CONTROLS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-disabled={id !== 'power' && !live}
            onClick={() => {
              if (id !== 'power' && !live) return
              radio.press(id)
            }}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={() => radio.setMuted(!radio.muted)}>
          {radio.muted ? 'Unmute interface sounds' : 'Mute interface sounds'}
        </button>
      </div>

      <p aria-live="polite" style={SR_ONLY}>
        {status}
      </p>
    </div>
  )
}

export default Radio3D
