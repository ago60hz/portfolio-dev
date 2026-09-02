import type { Track } from './types'

/**
 * "Disco Disco" — 13 tracks. Verified public and loadable via the IFrame API.
 *
 * Note: auto-generated mix playlists (ids starting `RD…`) are NOT loadable by
 * the IFrame API. Only real `PL…` playlists work here.
 */
export const PLAYLIST_ID: string | null = 'PLdOy740eaLek'

/** Number of entries in PLAYLIST_ID. Used for wrap-around before the player reports in. */
export const PLAYLIST_LENGTH = 13

/**
 * Explicit tracks. Used when PLAYLIST_ID is null, and the home for future
 * local audio files — drop one entry in and it plays through the same
 * controls, no other change required:
 *
 *   { kind: 'file', src: '/audio/my-set.m4a', title: 'My Set' }
 */
export const STATION: Track[] = [
  { kind: 'youtube', id: 'P7TMZlGBAPs', title: "Dance (Disco Heat) — Sylvester" },
]

/** How many entries the controls should cycle through. */
export function stationLength(): number {
  return PLAYLIST_ID ? PLAYLIST_LENGTH : STATION.length
}
