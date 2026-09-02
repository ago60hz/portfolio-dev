import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SoundEngine } from '../src/audio/SoundEngine'

/** Just enough of the Web Audio graph for SoundEngine to run without throwing. */
function installFakeAudioContext() {
  class FakeNode {
    connect() {
      return this
    }
    disconnect() {}
  }
  class FakeGain extends FakeNode {
    gain = {
      value: 1,
      setValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      setTargetAtTime: () => {},
    }
  }
  class FakeParam {
    value = 0
    setValueAtTime() {}
    exponentialRampToValueAtTime() {}
    linearRampToValueAtTime() {}
  }
  class FakeSource extends FakeNode {
    buffer: unknown
    loop = false
    playbackRate = new FakeParam()
    frequency = new FakeParam()
    type = 'sine'
    start() {}
    stop() {}
  }
  class FakeBiquad extends FakeNode {
    type = 'lowpass'
    frequency = new FakeParam()
    Q = new FakeParam()
  }
  class FakeCompressor extends FakeNode {
    threshold = new FakeParam()
    ratio = new FakeParam()
    attack = new FakeParam()
    release = new FakeParam()
  }

  class FakeAudioContext {
    static instances: FakeAudioContext[] = []
    currentTime = 0
    destination = new FakeNode()
    state: 'running' | 'suspended' = 'running'
    createGain() {
      return new FakeGain()
    }
    createBufferSource() {
      return new FakeSource()
    }
    createOscillator() {
      return new FakeSource()
    }
    createBiquadFilter() {
      return new FakeBiquad()
    }
    createDynamicsCompressor() {
      return new FakeCompressor()
    }
    createBuffer(_ch: number, len: number, rate: number) {
      const data = new Float32Array(len)
      return { getChannelData: () => data, length: len, sampleRate: rate }
    }
    resume() {
      return Promise.resolve()
    }
    close() {
      return Promise.resolve()
    }
    constructor() {
      FakeAudioContext.instances.push(this)
    }
  }
  // @ts-expect-error - test double
  window.AudioContext = FakeAudioContext
  return FakeAudioContext
}

describe('SoundEngine', () => {
  let FakeCtx: ReturnType<typeof installFakeAudioContext>

  beforeEach(() => {
    FakeCtx = installFakeAudioContext()
    // No network in jsdom: skip the sample probe so play() exercises the synth path.
  })

  afterEach(() => {
    // @ts-expect-error - cleanup
    delete window.AudioContext
  })

  it('fires exactly one voice per interaction, via the synth path', () => {
    const engine = new SoundEngine({ probeSamples: false })
    const spy = vi.spyOn(FakeCtx.prototype, 'createBufferSource')
    engine.play('clickDown')
    const callsAfterOne = spy.mock.calls.length
    expect(callsAfterOne).toBeGreaterThan(0)
    engine.play('clickDown')
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterOne)
  })

  it('muted suppresses all output', () => {
    const engine = new SoundEngine({ muted: true, probeSamples: false })
    engine.unlock()
    const spy = vi.spyOn(FakeCtx.prototype, 'createBufferSource')
    engine.play('powerOn')
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not throw when AudioContext is unavailable', () => {
    // @ts-expect-error - simulate an environment with no Web Audio
    delete window.AudioContext
    const engine = new SoundEngine({ probeSamples: false })
    expect(() => engine.play('tick')).not.toThrow()
  })
})
