import { noiseBuffer } from "./voices";

/**
 * The cooking bed: something is on the heat below the shelf.
 *
 * Two layers, because a sizzle is not one sound. A looping band of noise gives
 * the continuous hiss of fat in a pan, and sparse filtered impulses give the
 * crackle on top. Without the crackle it reads as tape hiss; without the hiss
 * the crackle reads as a fault.
 *
 * The brief says quiet, and means it -- this sits under the music, not beside
 * it. LEVEL is deliberately low enough that you notice it leaving.
 */
const LEVEL = 0.05;

/** How far ahead pops are scheduled, and how often we top the queue up. */
const LOOKAHEAD_MS = 250;
const HORIZON = 0.4;
/** Pops per second, on average. Sparse: this is a simmer, not a deep fry. */
const POP_RATE = 7;

export class SizzleBed {
  private out: GainNode | null = null;
  private hiss: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private next = 0;

  get running(): boolean {
    return this.out !== null;
  }

  start(ctx: AudioContext, dest: AudioNode): void {
    if (this.out) return;

    const out = ctx.createGain();
    // Faded in rather than switched on: a noise bed that appears at full level
    // is a click, and this is meant to be something you only half notice.
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(LEVEL, ctx.currentTime + 0.8);
    out.connect(dest);
    this.out = out;

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 2500;
    band.Q.value = 0.7;
    band.connect(out);

    const hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuffer(ctx);
    hiss.loop = true;
    hiss.connect(band);
    hiss.start();
    this.hiss = hiss;

    // The breath. A steady band of noise is immediately identifiable as a loop;
    // a slow swell either side of the mean is what makes it read as a pan.
    const depth = ctx.createGain();
    depth.gain.value = 0.35;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.23;
    lfo.connect(depth).connect(hiss.detune);
    // Reused for amplitude too -- one oscillator, two jobs.
    const swell = ctx.createGain();
    swell.gain.value = 260;
    lfo.connect(swell).connect(band.frequency);
    lfo.start();
    this.lfo = lfo;

    this.next = ctx.currentTime;
    this.timer = setInterval(() => this.fill(ctx, out), LOOKAHEAD_MS);
    this.fill(ctx, out);
  }

  /**
   * Schedules every pop that falls inside the next HORIZON seconds.
   *
   * A timer, not requestAnimationFrame: the Web Audio clock is what these are
   * placed against, so the only thing the interval has to do is stay ahead of
   * it -- and a rAF loop here would run 60 times a second to do the work of
   * four, next to a WebGL canvas that needs the frames.
   */
  private fill(ctx: AudioContext, dest: AudioNode): void {
    const until = ctx.currentTime + HORIZON;
    if (this.next < ctx.currentTime) this.next = ctx.currentTime;
    while (this.next < until) {
      pop(ctx, dest, this.next);
      // Exponential gaps rather than a fixed grid, or the crackle turns into a
      // rhythm and the ear locks onto it.
      this.next += -Math.log(1 - Math.random()) / POP_RATE;
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try {
      this.hiss?.stop();
      this.lfo?.stop();
    } catch {
      /* already stopped */
    }
    this.hiss = null;
    this.lfo = null;
    this.out?.disconnect();
    this.out = null;
  }
}

/** One crackle: a few milliseconds of high noise, gone before it has a pitch. */
function pop(ctx: AudioContext, dest: AudioNode, t: number): void {
  const g = ctx.createGain();
  const peak = 0.35 + Math.random() * 0.65;
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  g.connect(dest);

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800 + Math.random() * 2600;
  hp.connect(g);

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  // A random offset into the shared buffer, so no two pops are the same slice.
  const offset = Math.random() * (src.buffer.duration - 0.05);
  src.connect(hp);
  src.start(t, offset, 0.04);
}
