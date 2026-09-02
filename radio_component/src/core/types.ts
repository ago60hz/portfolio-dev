/** Playback states, normalised across every provider. */
export type PlaybackState =
  | 'idle'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'

/**
 * A station entry. `youtube` entries stream through the IFrame API; `file`
 * entries play a local asset. Adding a local track is a one-line change to
 * STATION in station.ts — no code change anywhere else.
 */
export type Track =
  | { kind: 'youtube'; id: string; title?: string }
  | { kind: 'file'; src: string; title?: string }

export type TrackMeta = {
  title: string
  index: number
  total: number
}

/** Everything the scene needs to render, and nothing it doesn't. */
export type RadioState = {
  power: 'off' | 'booting' | 'on'
  playback: PlaybackState
  trackIndex: number
  /** Non-fatal message surfaced on the readout strip. */
  notice: string | null
}

export type RadioEvent =
  | { type: 'POWER' }
  | { type: 'PLAY_PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'BOOT_DONE' }
  | { type: 'PROVIDER_STATE'; state: PlaybackState }
  | { type: 'PROVIDER_ERROR'; message?: string }
  | { type: 'TRACK_ENDED' }

/** Side effects the machine asks for. The host performs them. */
export type RadioEffect =
  | { type: 'PROVIDER_PLAY' }
  | { type: 'PROVIDER_PAUSE' }
  | { type: 'PROVIDER_LOAD'; index: number }
  | { type: 'SOUND'; voice: SoundVoice }

export type SoundVoice =
  | 'clickDown'
  | 'clickUp'
  | 'powerOn'
  | 'powerOff'
  | 'tick'

export type ButtonId = 'up' | 'down' | 'playPause' | 'power'
