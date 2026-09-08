"use client";

import { SizzleBed } from "./sizzle";
import { VOICES, type KitchenVoice } from "./voices";

/**
 * The kitchen's sound. One AudioContext, and every voice synthesised.
 *
 * Shaped after `radio_component/src/audio/SoundEngine.ts` -- same unlock/play/
 * setMuted contract, same sample override -- because that is the pattern this
 * codebase already has and the radio owns its own context regardless. Two
 * contexts on the page is well inside the browser's limit, and both stay
 * suspended until a gesture, so an idle visit pays nothing.
 *
 * Nothing ships: no mp3, no library, no bytes.
 */

/**
 * Real recordings that replace a synth voice, `voice -> file under public/`.
 *
 * Empty, and an empty map costs **zero requests**. The radio's engine probes
 * blindly for every voice in two formats and eats ten 404s the first time it is
 * unlocked; naming the files instead is one extra line next to the file copy and
 * keeps the network panel honest.
 */
const SAMPLES: Partial<Record<KitchenVoice, string>> = {
  // canLift: "/sounds/can-lift.m4a",
};

/**
 * The floor between two one-shots of the same voice.
 *
 * Sweeping the pointer along a shelf crosses three cans in well under this, and
 * without the guard that is three lift sounds stacked into a burst of noise.
 */
const MIN_GAP_MS = 60;

export class KitchenSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private samples = new Map<KitchenVoice, AudioBuffer>();
  private last = new Map<KitchenVoice, number>();
  private bed = new SizzleBed();
  private bedWanted = false;
  private muted = true;
  private unavailable = false;
  private probeSamples: boolean;
  private detachVisibility: (() => void) | null = null;

  constructor(opts: { probeSamples?: boolean } = {}) {
    this.probeSamples = opts.probeSamples ?? true;
  }

  /**
   * Must be called from inside a user gesture -- browsers refuse to start an
   * AudioContext otherwise. Safe to call repeatedly.
   */
  unlock(): void {
    if (this.unavailable) return;
    if (!this.ctx) {
      const Ctor =
        typeof window !== "undefined"
          ? window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext
          : undefined;
      if (!Ctor) {
        // No Web Audio: SSR, jsdom, an old browser. Stay silent, never throw.
        this.unavailable = true;
        return;
      }
      try {
        this.ctx = new Ctor();
      } catch {
        this.unavailable = true;
        return;
      }

      const master = this.ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.9;
      // The radio's music comes through its own context and its own element, so
      // nothing here can duck it. A compressor is what keeps a can drop landing
      // on a crackle from poking over the top of the track.
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      comp.attack.value = 0.002;
      comp.release.value = 0.12;
      master.connect(comp).connect(this.ctx.destination);
      this.master = master;

      this.watchVisibility();
      if (this.probeSamples && Object.keys(SAMPLES).length) void this.loadSamples();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  /**
   * A hidden tab should not be sizzling. Suspending the whole context is one
   * line and stops the lookahead scheduler along with it, where pausing the bed
   * alone would leave the timer running for nothing.
   */
  private watchVisibility(): void {
    if (typeof document === "undefined" || this.detachVisibility) return;
    const onChange = () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (!this.muted) void this.ctx.resume();
    };
    document.addEventListener("visibilitychange", onChange);
    this.detachVisibility = () =>
      document.removeEventListener("visibilitychange", onChange);
  }

  private async loadSamples(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    await Promise.all(
      Object.entries(SAMPLES).map(async ([voice, src]) => {
        try {
          const res = await fetch(src);
          if (!res.ok) return;
          const buf = await ctx.decodeAudioData(await res.arrayBuffer());
          this.samples.set(voice as KitchenVoice, buf);
        } catch {
          /* absent or undecodable -- the synth voice stands in */
        }
      }),
    );
  }

  play(voice: KitchenVoice): void {
    if (this.muted || this.unavailable) return;

    const now = Date.now();
    if (now - (this.last.get(voice) ?? 0) < MIN_GAP_MS) return;
    this.last.set(voice, now);

    this.unlock();
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;

    const sample = this.samples.get(voice);
    if (sample) {
      const src = ctx.createBufferSource();
      src.buffer = sample;
      src.connect(master);
      src.start();
      return;
    }
    try {
      VOICES[voice](ctx, master, ctx.currentTime);
    } catch {
      /* a voice failing is never worth taking the room down for */
    }
  }

  /** The cooking bed. Remembered while muted, so unmuting brings it back. */
  startBed(): void {
    this.bedWanted = true;
    if (this.muted || this.unavailable) return;
    this.unlock();
    if (this.ctx && this.master) this.bed.start(this.ctx, this.master);
  }

  stopBed(): void {
    this.bedWanted = false;
    this.bed.stop();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      // Ramped, not assigned: a gain step on a running noise bed is a click.
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
    if (m) this.bed.stop();
    else if (this.bedWanted) this.startBed();
  }

  destroy(): void {
    this.bed.stop();
    this.detachVisibility?.();
    this.detachVisibility = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}

let instance: KitchenSound | null = null;

/**
 * The one engine every can shares.
 *
 * Lazy and module-level rather than in a provider: a can's pointer handler
 * needs it synchronously, and there is exactly one kitchen.
 */
export function getKitchenSound(): KitchenSound {
  if (!instance) instance = new KitchenSound();
  return instance;
}
