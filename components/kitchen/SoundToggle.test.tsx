import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { installFakeAudioContext } from "../../tests/fakeAudioContext";
import { getKitchenSound } from "@/lib/audio/engine";
import { useKitchen } from "@/lib/store";
import { SoundToggle } from "./SoundToggle";

describe("SoundToggle", () => {
  // Installed for every test, not just the one that asserts on it: the engine
  // latches to `unavailable` the first time it unlocks without Web Audio, and
  // that latch is permanent -- one earlier test reaching it would silence the
  // shared instance for the rest of the file.
  let audio: ReturnType<typeof installFakeAudioContext>;

  beforeEach(() => {
    audio = installFakeAudioContext();
    useKitchen.setState({ soundEnabled: false, soundMutedByUser: false });
  });

  afterEach(() => {
    audio.restore();
  });

  it("starts muted -- sound is opt-in", () => {
    render(<SoundToggle />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(useKitchen.getState().soundEnabled).toBe(false);
  });

  /**
   * Both halves of switching sound on, in one test because they share the
   * click: the store flips, and -- the part that shipped broken -- the engine
   * is actually unmuted.
   *
   * `soundEnabled` and the engine's own mute are two different things, and
   * this component is the only thing that joins them. Without the join the
   * store said sound was on and every voice still returned at the engine's
   * mute check: a silent kitchen that looked correct from the outside.
   */
  it("turns sound on, and unmutes the engine so a can can be heard", async () => {
    render(<SoundToggle />);
    await userEvent.click(screen.getByRole("button"));

    expect(useKitchen.getState().soundEnabled).toBe(true);
    // Not marked as a deliberate mute, so the radio may still arm sound later.
    expect(useKitchen.getState().soundMutedByUser).toBe(false);

    getKitchenSound().play("canLift");
    expect(audio.created).toContain("oscillator");
  });

  it("records a deliberate mute, so powering the radio cannot undo it", async () => {
    useKitchen.setState({ soundEnabled: true });
    render(<SoundToggle />);
    await userEvent.click(screen.getByRole("button"));
    expect(useKitchen.getState().soundEnabled).toBe(false);
    expect(useKitchen.getState().soundMutedByUser).toBe(true);
  });
});
