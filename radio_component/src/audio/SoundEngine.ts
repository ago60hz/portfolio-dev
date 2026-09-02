import type { SoundVoice } from '../core/types'
import * as V from './voices'

const SYNTH: Record<SoundVoice, (c: AudioContext, o: AudioNode, t?: number) => void> = {
  clickDown: V.clickDown,
  clickUp: V.clickUp,
  tick: V.tick,
  powerOn: V.powerOn,
  powerOff: V.powerOff,
}

/** Files that override a synth voice if present. Nothing ships here by default. */
const SAMPLE_DIR = '/sounds'
const SAMPLE_EXT = ['m4a', 'wav']

type Options = {
  muted?: boolean
  /** Set false in tests to skip the sample probe entirely. */
  probeSamples?: boolean
}

/**
 * Owns the one AudioContext and every UI sound.
 *
 * Voices are synthesised by default. On construction the engine probes
 * /sounds/<voice>.{m4a,wav}; anything it finds transparently replaces the
 * synth for that voice. Dropping a real recording into public/sounds/ is
 * therefore a file copy, not a code change — the same swap-without-rewrite
 * idea the media layer uses.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private samples = new Map<SoundVoice, AudioBuffer>()
  private muted: boolean
  private probeSamples: boolean
  private unavailable = false

  constructor(opts: Options = {}) {
    this.muted = opts.muted ?? false
    this.probeSamples = opts.probeSamples ?? true
  }

  /**
   * Must be called from inside a user gesture — browsers refuse to start an
   * AudioContext otherwise. Safe to call repeatedly.
   */
  unlock(): void {
    if (this.unavailable) return
    if (!this.ctx) {
      const Ctor =
        typeof window !== 'undefined'
          ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined
      if (!Ctor) {
        this.unavailable = true // no Web Audio (old browser, SSR, jsdom): stay silent
        return
      }
      try {
        this.ctx = new Ctor()
      } catch {
        this.unavailable = true
        return
      }

      const master = this.ctx.createGain()
      master.gain.value = this.muted ? 0 : 0.9
      // Keeps a click from spiking over the music when both land together.
      const comp = this.ctx.createDynamicsCompressor()
      comp.threshold.value = -18
      comp.ratio.value = 4
      comp.attack.value = 0.002
      comp.release.value = 0.12
      master.connect(comp).connect(this.ctx.destination)
      this.master = master

      if (this.probeSamples) void this.loadSamples()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  private async loadSamples(): Promise<void> {
    const ctx = this.ctx
    if (!ctx) return
    const voices = Object.keys(SYNTH) as SoundVoice[]
    await Promise.all(
      voices.map(async (voice) => {
        for (const ext of SAMPLE_EXT) {
          try {
            const res = await fetch(`${SAMPLE_DIR}/${kebab(voice)}.${ext}`)
            if (!res.ok) continue
            const buf = await ctx.decodeAudioData(await res.arrayBuffer())
            this.samples.set(voice, buf)
            return
          } catch {
            /* absent or undecodable — the synth voice stands in */
          }
        }
      }),
    )
  }

  play(voice: SoundVoice): void {
    if (this.muted || this.unavailable) return
    this.unlock()
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return

    const sample = this.samples.get(voice)
    if (sample) {
      const src = ctx.createBufferSource()
      src.buffer = sample
      src.connect(master)
      src.start()
      return
    }
    try {
      SYNTH[voice](ctx, master, ctx.currentTime)
    } catch {
      /* a failed voice must never break an interaction */
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.02)
    }
  }

  isMuted(): boolean {
    return this.muted
  }

  /** Exposed for tests. */
  hasSampleFor(voice: SoundVoice): boolean {
    return this.samples.has(voice)
  }

  destroy(): void {
    void this.ctx?.close()
    this.ctx = null
    this.master = null
    this.samples.clear()
  }
}

function kebab(v: string): string {
  return v.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}
