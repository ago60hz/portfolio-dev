import type { PlaybackState, TrackMeta } from '../core/types'

export type ProviderListener = (state: PlaybackState, meta: TrackMeta) => void

/**
 * The seam between the radio and whatever is making noise.
 *
 * `play()` is deliberately SYNCHRONOUS: iOS Safari only honours playback
 * started inside a user gesture, and an `await` before the call loses the
 * gesture. Every implementation must start playback in the same tick.
 */
export interface MediaProvider {
  readonly kind: 'youtube' | 'file'
  /** Attach to a host element. Resolves once the underlying player is usable. */
  mount(host: HTMLElement): Promise<void>
  loadTrack(index: number): void
  play(): void
  pause(): void
  setVolume(v: number): void
  getState(): PlaybackState
  /** 0..1 amplitude for the EQ bars and speaker lamp. */
  getLevel(): number
  getMeta(): TrackMeta
  subscribe(listener: ProviderListener): () => void
  destroy(): void
}

/** Shared listener plumbing so the two providers stay small. */
export abstract class BaseProvider implements MediaProvider {
  abstract readonly kind: 'youtube' | 'file'
  protected listeners = new Set<ProviderListener>()
  protected state: PlaybackState = 'idle'
  protected index = 0
  protected total = 1
  protected title = ''

  abstract mount(host: HTMLElement): Promise<void>
  abstract loadTrack(index: number): void
  abstract play(): void
  abstract pause(): void
  abstract setVolume(v: number): void
  abstract getLevel(): number
  abstract destroy(): void

  getState(): PlaybackState {
    return this.state
  }

  getMeta(): TrackMeta {
    return { title: this.title, index: this.index, total: this.total }
  }

  subscribe(listener: ProviderListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  protected emit(state: PlaybackState): void {
    this.state = state
    const meta = this.getMeta()
    for (const l of this.listeners) l(state, meta)
  }
}
