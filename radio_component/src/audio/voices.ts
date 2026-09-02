/**
 * Synthesised voices. Nothing here is a recording — a mechanical click is a
 * transient (noise burst through a resonant band, plus a pitched body), and a
 * relay/static sweep is a filter envelope. Synthesising both means zero bytes
 * shipped, no licence to honour, and timing tied exactly to the animation.
 */

/** White-noise buffer, cached per context. */
const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>()

export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseCache.get(ctx)
  if (cached) return cached
  const len = Math.floor(ctx.sampleRate * 1.2)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  // Pinkish noise: a cheap one-pole lowpass over white reads warmer than raw
  // white, which is what makes the static bed sound like a radio and not a hiss.
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.035 * white) / 1.035
    data[i] = last * 3.2
  }
  noiseCache.set(ctx, buf)
  return buf
}

type Ctx = AudioContext

/** Short noise transient through a resonant bandpass — the "tick" of plastic. */
function transient(
  ctx: Ctx,
  out: AudioNode,
  t: number,
  o: { freq: number; q: number; dur: number; gain: number },
): void {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.playbackRate.value = 1 + (Math.random() * 0.2 - 0.1)

  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  // Detune every press slightly so repeated taps don't sound machine-gunned.
  bp.frequency.value = o.freq * (1 + (Math.random() * 0.12 - 0.06))
  bp.Q.value = o.q

  const g = ctx.createGain()
  g.gain.setValueAtTime(o.gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)

  src.connect(bp).connect(g).connect(out)
  src.start(t, Math.random() * 0.5)
  src.stop(t + o.dur + 0.02)
}

/** Pitched body — the low "thock" of the keycap bottoming out. */
function body(
  ctx: Ctx,
  out: AudioNode,
  t: number,
  o: { freq: number; dur: number; gain: number },
): void {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(o.freq * 1.6, t)
  osc.frequency.exponentialRampToValueAtTime(o.freq, t + o.dur)

  const g = ctx.createGain()
  g.gain.setValueAtTime(o.gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)

  osc.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + o.dur + 0.02)
}

export function clickDown(ctx: Ctx, out: AudioNode, t = ctx.currentTime): void {
  transient(ctx, out, t, { freq: 2200, q: 6, dur: 0.03, gain: 0.5 })
  body(ctx, out, t, { freq: 90, dur: 0.025, gain: 0.22 })
}

export function clickUp(ctx: Ctx, out: AudioNode, t = ctx.currentTime): void {
  transient(ctx, out, t, { freq: 3400, q: 7, dur: 0.018, gain: 0.26 })
}

/** Channel change: drier and higher than the transport click, plus a static blip. */
export function tick(ctx: Ctx, out: AudioNode, t = ctx.currentTime): void {
  transient(ctx, out, t, { freq: 2900, q: 9, dur: 0.022, gain: 0.4 })
  body(ctx, out, t, { freq: 140, dur: 0.02, gain: 0.14 })

  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1400
  bp.Q.value = 1.2
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t + 0.02)
  g.gain.linearRampToValueAtTime(0.13, t + 0.05)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
  src.connect(bp).connect(g).connect(out)
  src.start(t + 0.02, Math.random() * 0.5)
  src.stop(t + 0.2)
}

/** Relay thump, then static swelling open as the set warms up. */
export function powerOn(ctx: Ctx, out: AudioNode, t = ctx.currentTime): void {
  body(ctx, out, t, { freq: 55, dur: 0.12, gain: 0.5 })
  transient(ctx, out, t, { freq: 1800, q: 3, dur: 0.04, gain: 0.32 })

  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.loop = true

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(300, t)
  lp.frequency.exponentialRampToValueAtTime(6000, t + 0.7)
  lp.Q.value = 1.4

  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.28)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.92)

  src.connect(lp).connect(g).connect(out)
  src.start(t)
  src.stop(t + 1.0)

  // Descending "tuning in" whoop across the static.
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1500, t + 0.1)
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.62)
  const og = ctx.createGain()
  og.gain.setValueAtTime(0.0001, t + 0.1)
  og.gain.exponentialRampToValueAtTime(0.1, t + 0.22)
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.66)
  osc.connect(og).connect(out)
  osc.start(t + 0.1)
  osc.stop(t + 0.7)
}

/** The inverse: the band collapses shut and the relay drops out. */
export function powerOff(ctx: Ctx, out: AudioNode, t = ctx.currentTime): void {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.loop = true

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(6000, t)
  lp.frequency.exponentialRampToValueAtTime(200, t + 0.35)

  const g = ctx.createGain()
  g.gain.setValueAtTime(0.14, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38)

  src.connect(lp).connect(g).connect(out)
  src.start(t)
  src.stop(t + 0.45)

  body(ctx, out, t + 0.3, { freq: 48, dur: 0.1, gain: 0.4 })
  transient(ctx, out, t + 0.3, { freq: 1200, q: 4, dur: 0.03, gain: 0.2 })
}
