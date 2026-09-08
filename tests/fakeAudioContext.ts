import { vi } from "vitest";

/**
 * The smallest AudioContext the kitchen's engine can run against.
 *
 * jsdom ships no Web Audio at all, which means every test without this one is
 * really only testing that the engine goes quiet. Anything asserting that a
 * voice actually gets scheduled -- which is the thing that broke -- needs a
 * context that records what was built on it.
 */
export type FakeAudio = {
  /** Every node the engine created, in order, by kind. */
  created: string[];
  /** The master gain's target value, which is what mute actually moves. */
  gainTargets: number[];
  restore: () => void;
};

export function installFakeAudioContext(): FakeAudio {
  const created: string[] = [];
  const gainTargets: number[] = [];

  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn((v: number) => gainTargets.push(v)),
  });

  const node = (kind: string) => {
    created.push(kind);
    const self: Record<string, unknown> = {
      connect: vi.fn(() => self),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      gain: param(),
      frequency: param(),
      detune: param(),
      Q: param(),
      threshold: param(),
      ratio: param(),
      attack: param(),
      release: param(),
      type: "",
      loop: false,
      buffer: null,
    };
    return self;
  };

  class FakeContext {
    state = "running";
    currentTime = 0;
    sampleRate = 48000;
    destination = node("destination");
    createGain = () => node("gain");
    createBiquadFilter = () => node("filter");
    createOscillator = () => node("oscillator");
    createBufferSource = () => node("bufferSource");
    createDynamicsCompressor = () => node("compressor");
    createBuffer = (ch: number, len: number) => ({
      duration: len / 48000,
      getChannelData: () => new Float32Array(len),
    });
    resume = vi.fn();
    suspend = vi.fn();
    close = vi.fn();
  }

  const original = window.AudioContext;
  window.AudioContext = FakeContext as unknown as typeof AudioContext;

  return {
    created,
    gainTargets,
    restore: () => {
      window.AudioContext = original;
    },
  };
}
