import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeAudioContext } from "../../tests/fakeAudioContext";
import { KitchenSound } from "./engine";

/**
 * jsdom ships no Web Audio, which makes it exactly the environment the engine
 * has to survive: an old browser, a locked-down one, or the server. The
 * contract under test is that it goes quiet, never that it makes a sound.
 */
describe("KitchenSound without Web Audio", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not throw when unlocked in an environment with no AudioContext", () => {
    const sound = new KitchenSound({ probeSamples: false });
    expect(() => sound.unlock()).not.toThrow();
    expect(() => sound.play("canLift")).not.toThrow();
    expect(() => sound.startBed()).not.toThrow();
    expect(() => sound.stopBed()).not.toThrow();
    expect(() => sound.destroy()).not.toThrow();
  });

  it("stays silent while muted, so nothing can start an AudioContext behind the toggle", () => {
    const sound = new KitchenSound({ probeSamples: false });
    const unlock = vi.spyOn(sound, "unlock");
    // Muted is the default: sound is opt-in and the store says never to flip
    // that by default.
    sound.play("canDrop");
    expect(unlock).not.toHaveBeenCalled();
  });

  it("drops a repeat of the same voice inside the min-gap", () => {
    const sound = new KitchenSound({ probeSamples: false });
    sound.setMuted(false);
    // Stubbed rather than spied: a real unlock in jsdom finds no AudioContext
    // and latches the engine to unavailable, after which every play returns
    // before it reaches the guard this test is about.
    const unlock = vi.spyOn(sound, "unlock").mockImplementation(() => {});

    sound.play("canLift");
    sound.play("canLift");
    // Sweeping a pointer along a shelf crosses three cans in well under the
    // gap; without the guard that is three lifts stacked into one burst.
    expect(unlock).toHaveBeenCalledTimes(1);

    // A different voice is a different event and is not throttled with it.
    sound.play("canDrop");
    expect(unlock).toHaveBeenCalledTimes(2);
  });
});

/**
 * The regression suite for the bug this feature shipped with: the engine keeps
 * its own mute, it starts muted, and nothing was mirroring the store's
 * `soundEnabled` onto it -- so every `play()` returned at the mute check and
 * the whole kitchen was silent.
 */
describe("KitchenSound with a context", () => {
  let audio: ReturnType<typeof installFakeAudioContext>;

  beforeEach(() => {
    audio = installFakeAudioContext();
  });

  afterEach(() => {
    audio.restore();
  });

  it("schedules a voice once it is unmuted", () => {
    const sound = new KitchenSound({ probeSamples: false });
    sound.setMuted(false);
    sound.play("canLift");

    // canLift builds a bandpass, a noise source and a sine with two envelopes.
    expect(audio.created).toContain("filter");
    expect(audio.created).toContain("bufferSource");
    expect(audio.created).toContain("oscillator");
    sound.destroy();
  });

  it("schedules nothing while it is muted, however loud the store is", () => {
    const sound = new KitchenSound({ probeSamples: false });
    sound.play("canDrop");
    expect(audio.created).toHaveLength(0);
    sound.destroy();
  });

  it("brings the bed back when unmuted after being asked for while muted", () => {
    const sound = new KitchenSound({ probeSamples: false });
    // The order the toggle and the radio actually produce: intent first, then
    // the unmute from the sync effect a commit later.
    sound.startBed();
    expect(audio.created).toHaveLength(0);

    sound.setMuted(false);
    expect(audio.created).toContain("bufferSource");
    sound.destroy();
  });
});
