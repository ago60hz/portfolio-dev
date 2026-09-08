import { BaseProvider } from './MediaProvider'
import { PLAYLIST_ID, PLAYLIST_LENGTH, STATION } from '../core/station'

/* Minimal shape of the bits of the IFrame API we actually use. */
type YTPlayer = {
  playVideo(): void
  pauseVideo(): void
  setVolume(v: number): void
  cuePlaylist(o: { list: string; listType: string; index?: number }): void
  cueVideoById(id: string): void
  getVideoData(): { title?: string; video_id?: string }
  getPlaylist(): string[] | null
  destroy(): void
}

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api'
let apiPromise: Promise<void> | null = null

/** Loads the IFrame API exactly once per document, however many radios mount. */
function loadApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise

  apiPromise = new Promise<void>((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = API_SRC
    tag.async = true
    tag.onerror = () => reject(new Error('YouTube IFrame API failed to load'))
    document.head.appendChild(tag)
  })
  return apiPromise
}

/* YT.PlayerState numeric codes. */
const YT_UNSTARTED = -1
const YT_ENDED = 0
const YT_PLAYING = 1
const YT_PAUSED = 2
const YT_BUFFERING = 3
const YT_CUED = 5

export class YouTubeProvider extends BaseProvider {
  readonly kind = 'youtube' as const
  private player: YTPlayer | null = null
  private onEnded: (() => void) | null = null
  private onError: ((code: number) => void) | null = null
  /** Simulated level — cross-origin iframe audio cannot be analysed. */
  private level = 0
  private levelTimer: ReturnType<typeof setInterval> | null = null
  private destroyed = false
  /** play() asked for playback while a cue was still in flight. */
  private wantsPlay = false

  constructor(opts: { onEnded?: () => void; onError?: (code: number) => void } = {}) {
    super()
    this.onEnded = opts.onEnded ?? null
    this.onError = opts.onError ?? null
    this.total = PLAYLIST_ID ? PLAYLIST_LENGTH : STATION.length
  }

  async mount(host: HTMLElement): Promise<void> {
    await loadApi()
    if (this.destroyed) return

    const mountPoint = document.createElement('div')
    host.appendChild(mountPoint)

    await new Promise<void>((resolve) => {
      this.player = new window.YT.Player(mountPoint, {
        width: '100%',
        height: '100%',
        playerVars: {
          playsinline: 1, // iOS: keep playback inline, don't go fullscreen
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0, // captions off by default
          iv_load_policy: 3, // no annotation overlays

          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.loadTrack(this.index)
            resolve()
          },
          onStateChange: (e: { data: number }) => this.handleState(e.data),
          onError: (e: { data: number }) => {
            // 101/150 = embedding disabled by the uploader; 100 = removed.
            this.emit('error')
            this.onError?.(e.data)
          },
        },
      }) as YTPlayer
    })

    this.levelTimer = setInterval(() => this.stepLevel(), 80)
  }

  private handleState(code: number): void {
    switch (code) {
      case YT_CUED:
        // cuePlaylist/cueVideoById finish asynchronously. A play() issued
        // before this point was dropped by the player, so honour it now —
        // this is what makes next/prev start playing instead of sitting
        // cued, while still never auto-playing on load (where nothing
        // called play() in the first place).
        if (this.wantsPlay) this.player?.playVideo()
        break
      case YT_PLAYING:
        this.wantsPlay = false
        this.title = this.player?.getVideoData()?.title ?? this.title
        this.syncTotal()
        this.emit('playing')
        break
      case YT_PAUSED:
        this.emit('paused')
        break
      case YT_BUFFERING:
        this.emit('buffering')
        break
      case YT_ENDED:
        this.emit('ended')
        this.onEnded?.()
        break
      case YT_UNSTARTED:
        this.emit('idle')
        break
    }
  }

  /** The real playlist length only becomes known once the player has loaded it. */
  private syncTotal(): void {
    const list = this.player?.getPlaylist?.()
    if (Array.isArray(list) && list.length > 0) this.total = list.length
  }

  /**
   * Random-walk amplitude. Honest fallback: a cross-origin iframe's audio is
   * unreachable, so the EQ bars are plausible motion, not real analysis.
   * AudioFileProvider returns genuine RMS for local files.
   */
  private stepLevel(): void {
    const target = this.state === 'playing' ? 0.35 + Math.random() * 0.65 : 0
    this.level += (target - this.level) * 0.4
  }

  loadTrack(index: number): void {
    this.index = index
    if (!this.player) return
    // cue*, never load*/playVideoAt: those auto-play the moment they're
    // called. loadTrack must only prepare a track — playback starts solely
    // from play(), which the state machine calls explicitly at power-on and
    // after next/prev. Using the play* variants here was why the radio
    // played audio on page load while the UI still showed "off": mount()
    // calls loadTrack(0) as soon as the screen exists, well before power.
    if (PLAYLIST_ID) {
      this.player.cuePlaylist({ list: PLAYLIST_ID, listType: 'playlist', index })
    } else {
      const track = STATION[index]
      if (track?.kind === 'youtube') this.player.cueVideoById(track.id)
    }
  }

  play(): void {
    this.wantsPlay = true
    this.player?.playVideo()
  }

  pause(): void {
    this.wantsPlay = false
    this.player?.pauseVideo()
  }

  setVolume(v: number): void {
    this.player?.setVolume(Math.round(Math.max(0, Math.min(1, v)) * 100))
  }

  getLevel(): number {
    return this.level
  }

  destroy(): void {
    this.destroyed = true
    if (this.levelTimer) clearInterval(this.levelTimer)
    this.levelTimer = null
    try {
      this.player?.destroy()
    } catch {
      /* player may already be gone with the host node */
    }
    this.player = null
    this.listeners.clear()
  }
}
