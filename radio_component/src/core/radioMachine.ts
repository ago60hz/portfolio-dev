import type { RadioEffect, RadioEvent, RadioState } from './types'

/** ms the boot sequence runs before audio starts. Matches the screen warm-up. */
export const BOOT_MS = 900

export function initialState(trackIndex = 0): RadioState {
  return { power: 'off', playback: 'idle', trackIndex, notice: null }
}

const wrap = (i: number, len: number) => (len <= 0 ? 0 : ((i % len) + len) % len)

export type Reduced = { state: RadioState; effects: RadioEffect[] }

/**
 * Pure reducer. Never touches React, Three, the DOM or the network — which is
 * what makes the interesting behaviour cheap to test.
 *
 * `length` is the number of entries the controls cycle through.
 */
export function reduce(
  state: RadioState,
  event: RadioEvent,
  length: number,
): Reduced {
  const off = state.power === 'off'

  switch (event.type) {
    case 'POWER': {
      if (off) {
        return {
          state: { ...state, power: 'booting', playback: 'buffering', notice: null },
          effects: [
            { type: 'SOUND', voice: 'powerOn' },
            { type: 'PROVIDER_LOAD', index: state.trackIndex },
          ],
        }
      }
      // Powering down keeps trackIndex — a real radio remembers its station.
      return {
        state: { ...state, power: 'off', playback: 'idle', notice: null },
        effects: [{ type: 'PROVIDER_PAUSE' }, { type: 'SOUND', voice: 'powerOff' }],
      }
    }

    case 'BOOT_DONE': {
      if (state.power !== 'booting') return { state, effects: [] }
      return {
        state: { ...state, power: 'on', playback: 'buffering' },
        effects: [{ type: 'PROVIDER_PLAY' }],
      }
    }

    // Every control below is inert while the radio is off. Only POWER wakes it.
    case 'PLAY_PAUSE': {
      if (off) return { state, effects: [] }
      const isPlaying = state.playback === 'playing' || state.playback === 'buffering'
      return {
        state: { ...state, playback: isPlaying ? 'paused' : 'buffering' },
        effects: [
          { type: 'SOUND', voice: 'tick' },
          isPlaying ? { type: 'PROVIDER_PAUSE' } : { type: 'PROVIDER_PLAY' },
        ],
      }
    }

    case 'NEXT':
    case 'PREV': {
      if (off) return { state, effects: [] }
      const delta = event.type === 'NEXT' ? 1 : -1
      const index = wrap(state.trackIndex + delta, length)
      return {
        state: { ...state, trackIndex: index, playback: 'buffering', notice: null },
        effects: [
          { type: 'SOUND', voice: 'tick' },
          { type: 'PROVIDER_LOAD', index },
          { type: 'PROVIDER_PLAY' },
        ],
      }
    }

    case 'TRACK_ENDED': {
      if (off) return { state, effects: [] }
      const index = wrap(state.trackIndex + 1, length)
      return {
        state: { ...state, trackIndex: index, playback: 'buffering' },
        effects: [
          { type: 'PROVIDER_LOAD', index },
          { type: 'PROVIDER_PLAY' },
        ],
      }
    }

    case 'PROVIDER_STATE': {
      if (off) return { state, effects: [] }
      // The provider is the source of truth once we're on.
      return { state: { ...state, playback: event.state }, effects: [] }
    }

    case 'PROVIDER_ERROR': {
      if (off) return { state, effects: [] }
      // A video whose uploader disabled embedding degrades to a skip, not a
      // dead radio. Wrapping guarantees this terminates on a fully blocked list.
      const index = wrap(state.trackIndex + 1, length)
      return {
        state: {
          ...state,
          trackIndex: index,
          playback: 'buffering',
          notice: event.message ?? 'TRACK UNAVAILABLE — SKIPPING',
        },
        effects: [
          { type: 'PROVIDER_LOAD', index },
          { type: 'PROVIDER_PLAY' },
        ],
      }
    }

    default:
      return { state, effects: [] }
  }
}

/** True when the transport controls should read as live. */
export function isLive(state: RadioState): boolean {
  return state.power !== 'off'
}
