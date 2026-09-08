/**
 * Public surface. Importing this module has no side effects — it never
 * touches the DOM, so it is safe to import at the top level of any bundle.
 */
export { Radio3D, default } from './Radio3D'
export type { Radio3DProps } from './Radio3D'

/** Only needed to own the radio's state outside the component. */
export { useRadio } from './hooks/useRadio'
export type { UseRadio } from './hooks/useRadio'

/** The pure state machine, if you want to drive or test it directly. */
export { reduce, initialState, isLive, BOOT_MS } from './core/radioMachine'
export { PLAYLIST_ID, STATION, stationLength } from './core/station'
export type {
  RadioState,
  RadioEvent,
  RadioEffect,
  Track,
  TrackMeta,
  ButtonId,
  PlaybackState,
} from './core/types'
