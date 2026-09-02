import type { MediaProvider } from './MediaProvider'
import { YouTubeProvider } from './YouTubeProvider'
import { AudioFileProvider } from './AudioFileProvider'
import { PLAYLIST_ID, STATION } from '../core/station'
import type { Track } from '../core/types'

export type ProviderHooks = {
  onEnded?: () => void
  onError?: (code: number) => void
}

/**
 * Resolves the provider for a given track. This one function is the whole
 * cost of adding local-file playback later: STATION grows an entry, and the
 * factory routes it to AudioFileProvider instead.
 */
export function createProviderFor(track: Track, hooks: ProviderHooks = {}): MediaProvider {
  if (track.kind === 'file') {
    return new AudioFileProvider({ tracks: STATION, onEnded: hooks.onEnded })
  }
  return new YouTubeProvider(hooks)
}

/** The provider the radio boots with. */
export function createDefaultProvider(hooks: ProviderHooks = {}): MediaProvider {
  if (PLAYLIST_ID) return new YouTubeProvider(hooks)
  const first = STATION[0]
  if (!first) return new YouTubeProvider(hooks)
  return createProviderFor(first, hooks)
}
