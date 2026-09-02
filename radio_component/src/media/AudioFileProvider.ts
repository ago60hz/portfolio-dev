import { BaseProvider } from './MediaProvider'
import { STATION } from '../core/station'
import type { Track } from '../core/types'

/**
 * The future audio-folder path. Same interface as YouTubeProvider, so the
 * radio itself never learns which one it is talking to.
 *
 * Unlike the YouTube provider this one CAN analyse its own audio, so
 * getLevel() is genuine RMS rather than a simulation.
 */
export class AudioFileProvider extends BaseProvider {
  readonly kind = 'file' as const
  private el: HTMLAudioElement | null = null
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private buf: Uint8Array | null = null
  private tracks: Track[]
  private onEnded: (() => void) | null

  constructor(opts: { tracks?: Track[]; onEnded?: () => void } = {}) {
    super()
    this.tracks = opts.tracks ?? STATION
    this.onEnded = opts.onEnded ?? null
    this.total = this.tracks.length
  }

  async mount(host: HTMLElement): Promise<void> {
    const el = document.createElement('audio')
    el.preload = 'metadata'
    el.crossOrigin = 'anonymous'
    el.style.display = 'none'
    host.appendChild(el)
    this.el = el

    el.addEventListener('playing', () => this.emit('playing'))
    el.addEventListener('pause', () => this.emit('paused'))
    el.addEventListener('waiting', () => this.emit('buffering'))
    el.addEventListener('error', () => this.emit('error'))
    el.addEventListener('ended', () => {
      this.emit('ended')
      this.onEnded?.()
    })

    this.loadTrack(this.index)
  }

  /** Analyser is wired lazily — an AudioContext before a gesture starts suspended. */
  private ensureAnalyser(): void {
    if (this.analyser || !this.el) return
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext
    if (!Ctor) return
    try {
      this.ctx = new Ctor()
      const source = this.ctx.createMediaElementSource(this.el)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 256
      source.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
      this.buf = new Uint8Array(this.analyser.frequencyBinCount)
    } catch {
      this.analyser = null // CORS-tainted stream: fall back to a flat level
    }
  }

  loadTrack(index: number): void {
    this.index = index
    const track = this.tracks[index]
    if (!track || track.kind !== 'file' || !this.el) return
    this.el.src = track.src
    this.title = track.title ?? track.src.split('/').pop() ?? ''
    this.el.load()
  }

  play(): void {
    this.ensureAnalyser()
    void this.ctx?.resume()
    // Synchronous call — see the note on MediaProvider.play().
    void this.el?.play().catch(() => this.emit('error'))
  }

  pause(): void {
    this.el?.pause()
  }

  setVolume(v: number): void {
    if (this.el) this.el.volume = Math.max(0, Math.min(1, v))
  }

  getLevel(): number {
    if (!this.analyser || !this.buf) return this.state === 'playing' ? 0.5 : 0
    this.analyser.getByteFrequencyData(this.buf as Uint8Array<ArrayBuffer>)
    let sum = 0
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i]
    return Math.min(1, Math.sqrt(sum / this.buf.length) / 128)
  }

  destroy(): void {
    this.el?.pause()
    this.el?.remove()
    this.el = null
    void this.ctx?.close()
    this.ctx = null
    this.analyser = null
    this.listeners.clear()
  }
}
