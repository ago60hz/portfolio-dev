import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BOOT_MS, initialState, reduce } from '../core/radioMachine'
import { stationLength } from '../core/station'
import type { ButtonId, RadioEffect, RadioEvent, RadioState, TrackMeta } from '../core/types'
import { SoundEngine } from '../audio/SoundEngine'
import { createDefaultProvider } from '../media/createProvider'
import type { MediaProvider } from '../media/MediaProvider'

export type UseRadio = {
  state: RadioState
  meta: TrackMeta
  /**
   * Callback ref for the media player's host node. A callback rather than a
   * plain ref because the host arrives late (the scene is lazy) and a ref
   * mutation cannot wake an effect.
   */
  setHost: (el: HTMLDivElement | null) => void
  /** 0..1 amplitude, read per-frame. Not React state — it must not re-render. */
  levelRef: React.RefObject<number>
  press: (button: ButtonId) => void
  pressDown: () => void
  pressUp: () => void
  muted: boolean
  setMuted: (m: boolean) => void
  ready: boolean
}

// ▼ = next track, ▲ = previous — matches the user's expected direction,
// opposite of the naive up-goes-forward guess.
const BUTTON_EVENT: Record<ButtonId, RadioEvent['type']> = {
  power: 'POWER',
  playPause: 'PLAY_PAUSE',
  up: 'PREV',
  down: 'NEXT',
}

export function useRadio(opts: { muted?: boolean } = {}): UseRadio {
  const [state, setState] = useState<RadioState>(() => initialState())
  const [meta, setMeta] = useState<TrackMeta>({ title: '', index: 0, total: stationLength() })
  const [muted, setMutedState] = useState(opts.muted ?? false)
  const [ready, setReady] = useState(false)

  const [host, setHostEl] = useState<HTMLDivElement | null>(null)
  const setHost = useCallback((el: HTMLDivElement | null) => setHostEl(el), [])
  const levelRef = useRef(0)
  const providerRef = useRef<MediaProvider | null>(null)
  const bootTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const sound = useMemo(() => new SoundEngine({ muted: opts.muted ?? false }), [])

  // Queued so effects raised during a dispatch are applied against the
  // provider that exists at the time, not the one captured at render.
  const runEffects = useCallback(
    (effects: RadioEffect[]) => {
      const provider = providerRef.current
      for (const fx of effects) {
        switch (fx.type) {
          case 'SOUND':
            sound.play(fx.voice)
            break
          case 'PROVIDER_LOAD':
            provider?.loadTrack(fx.index)
            break
          case 'PROVIDER_PLAY':
            // Synchronous on purpose: iOS only honours playback started
            // inside the gesture that triggered it.
            provider?.play()
            break
          case 'PROVIDER_PAUSE':
            provider?.pause()
            break
        }
      }
    },
    [sound],
  )

  const dispatch = useCallback(
    (event: RadioEvent) => {
      const { state: next, effects } = reduce(stateRef.current, event, meta.total || stationLength())
      stateRef.current = next
      setState(next)
      runEffects(effects)

      if (event.type === 'POWER' && next.power === 'booting') {
        if (bootTimer.current) clearTimeout(bootTimer.current)
        bootTimer.current = setTimeout(() => dispatch({ type: 'BOOT_DONE' }), BOOT_MS)
      }
      if (next.power === 'off' && bootTimer.current) {
        clearTimeout(bootTimer.current)
        bootTimer.current = null
      }
    },
    [runEffects, meta.total],
  )

  // Mount the provider as soon as its host node exists — NOT on the power
  // press. Having the player already live means play() runs inside the user
  // gesture, which is the only thing iOS accepts.
  useEffect(() => {
    if (!host) return
    let cancelled = false
    const provider = createDefaultProvider({
      onEnded: () => dispatch({ type: 'TRACK_ENDED' }),
      onError: (code) =>
        dispatch({
          type: 'PROVIDER_ERROR',
          message:
            code === 101 || code === 150
              ? 'EMBEDDING DISABLED — SKIPPING'
              : 'TRACK UNAVAILABLE — SKIPPING',
        }),
    })
    providerRef.current = provider

    const unsub = provider.subscribe((playbackState, m) => {
      if (cancelled) return
      setMeta(m)
      if (stateRef.current.power === 'on') {
        dispatch({ type: 'PROVIDER_STATE', state: playbackState })
      }
    })

    provider
      .mount(host)
      .then(() => !cancelled && setReady(true))
      .catch(() => !cancelled && setReady(false))

    return () => {
      cancelled = true
      unsub()
      provider.destroy()
      providerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host])

  // Sample the level outside React so the EQ bars never trigger a re-render.
  useEffect(() => {
    let raf = 0
    const tick = () => {
      levelRef.current = providerRef.current?.getLevel() ?? 0
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => () => {
    if (bootTimer.current) clearTimeout(bootTimer.current)
    sound.destroy()
  }, [sound])

  const press = useCallback(
    (button: ButtonId) => {
      sound.unlock() // we are inside a gesture here — the only place this works
      dispatch({ type: BUTTON_EVENT[button] } as RadioEvent)
    },
    [dispatch, sound],
  )

  const pressDown = useCallback(() => {
    sound.unlock()
    sound.play('clickDown')
  }, [sound])

  const pressUp = useCallback(() => sound.play('clickUp'), [sound])

  const setMuted = useCallback(
    (m: boolean) => {
      setMutedState(m)
      sound.setMuted(m)
    },
    [sound],
  )

  return { state, meta, setHost, levelRef, press, pressDown, pressUp, muted, setMuted, ready }
}
