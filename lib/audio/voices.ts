/**
 * The kitchen's one-shot voices, synthesised.
 *
 * Every voice is a pure `(ctx, dest, t)` function that schedules its own nodes
 * and lets them expire -- nothing here holds state, so the engine can call them
 * as often as it likes. Nothing ships either: the brief asks for recognisable
 * sounds, and filtered noise plus a decaying oscillator gets there in bytes we
 * do not have to download.
 *
 * The same shape as `radio_component/src/audio/voices.ts` on purpose. That is
 * the file the next reader will already have seen.
 */

export type KitchenVoice = "canLift" | "canDrop";

/** Two seconds of white noise, made once and shared by every voice that wants it. */
let noise: AudioBuffer | null = null;

export function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noise = buf;
  return buf;
}

/** A gain node that starts at 0, rises to `peak`, and decays to silence by `t + dur`. */
function envelope(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  peak: number,
  attack: number,
  dur: number,
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest);
  return g;
}

/**
 * Picking the can off the shelf: a short upward air whoosh with a soft blip on
 * top, so the ear reads it as something leaving a surface rather than landing
 * on one. Roughly the length of SPRING.lift.
 */
export function canLift(ctx: AudioContext, dest: AudioNode, t = ctx.currentTime): void {
  const g = envelope(ctx, dest, t, 0.18, 0.012, 0.16);

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.4;
  // The sweep IS the lift -- a fixed filter reads as a hiss, not a movement.
  band.frequency.setValueAtTime(700, t);
  band.frequency.exponentialRampToValueAtTime(2600, t + 0.14);
  band.connect(g);

  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(ctx);
  air.connect(band);
  air.start(t);
  air.stop(t + 0.18);

  // A quiet sine riding the same rise gives it pitch, which is what stops six
  // cans in a row sounding like six identical bursts of static.
  const blip = ctx.createOscillator();
  blip.type = "sine";
  blip.frequency.setValueAtTime(420, t);
  blip.frequency.exponentialRampToValueAtTime(760, t + 0.12);
  const bg = envelope(ctx, dest, t, 0.05, 0.01, 0.13);
  blip.connect(bg);
  blip.start(t);
  blip.stop(t + 0.15);
}

/**
 * Setting it back down: a low thud, then a small metallic ring that decays over
 * about a quarter second -- matched to RING_OUT in WorkCan, so the sound stops
 * at roughly the frame the can stops wobbling.
 */
export function canDrop(ctx: AudioContext, dest: AudioNode, t = ctx.currentTime): void {
  const thud = ctx.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(96, t);
  thud.frequency.exponentialRampToValueAtTime(48, t + 0.11);
  const tg = envelope(ctx, dest, t, 0.24, 0.006, 0.14);
  thud.connect(tg);
  thud.start(t);
  thud.stop(t + 0.16);

  // The tin. Two detuned partials rather than one, because a single triangle
  // reads as a bell and a spice can is not a bell.
  for (const [freq, level] of [[1180, 0.045], [1790, 0.028]] as const) {
    const ring = ctx.createOscillator();
    ring.type = "triangle";
    ring.frequency.setValueAtTime(freq, t);
    const rg = envelope(ctx, dest, t + 0.01, level, 0.008, 0.26);
    ring.connect(rg);
    ring.start(t + 0.01);
    ring.stop(t + 0.3);
  }
}

export const VOICES: Record<
  KitchenVoice,
  (ctx: AudioContext, dest: AudioNode, t?: number) => void
> = { canLift, canDrop };
