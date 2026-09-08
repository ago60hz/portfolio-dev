"use client";

import { useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getKitchenSound } from "@/lib/audio/engine";
import { useKitchen } from "@/lib/store";

/**
 * The override on the room's sound.
 *
 * The radio arms sound and is the discoverable way in -- its tooltip already
 * invites the press. This is the other half of that: it silences the kitchen's
 * own effects (the can lift and drop, the crackle bed, the radio's button
 * voices) WITHOUT stopping the music, because the two are different decisions.
 * Killing the track is the radio's power button, and always was.
 *
 * Fixed pixels, not --u. It is a hit target, and those are exempt: a 20u pill
 * on a small Window is a control nobody can reliably hit.
 */
export function SoundToggle() {
  const on = useKitchen((s) => s.soundEnabled);
  const setSoundEnabled = useKitchen((s) => s.setSoundEnabled);

  /**
   * The one place the store's `soundEnabled` reaches the engine.
   *
   * The engine keeps its own mute -- it has to, it is a plain class with no
   * knowledge of React -- and the two are only the same thing if something
   * mirrors one onto the other. Without this the radio could set
   * `soundEnabled` and every `play()` would still return at the engine's mute
   * check, which is exactly the silence this shipped with.
   *
   * It lives here rather than in a hook the cans call because there is one
   * SoundToggle and nine cans, and this is a single subscription either way.
   * The bed follows too: `startBed` while muted only records the intent, so
   * the effect can own both and no caller has to remember the order.
   */
  useEffect(() => {
    const sound = getKitchenSound();
    sound.setMuted(!on);
    if (on) sound.startBed();
    else sound.stopBed();
  }, [on]);

  return (
    // The pin and the control are separate elements on purpose: `hit-32` sets
    // `position: relative` to anchor its own pseudo-element, and putting that
    // on the same node as `absolute` leaves two position values racing for one
    // property. The wrapper owns the placement, the button owns the target.
    // Lifted clear of the Menu button below md. Both sat bottom-left and the
    // drawer trigger covered this outright. Menu is the primary control and
    // keeps the thumb position; mute stacks above it.
    <span className="absolute bottom-16 left-2 z-40 md:bottom-2">
      <button
        type="button"
        data-sound-toggle
        aria-pressed={on}
        aria-label={on ? "Mute kitchen sound" : "Unmute kitchen sound"}
        onClick={() => {
          const sound = getKitchenSound();
          const next = !on;
          // `true` marks this as deliberate, so cycling the radio afterwards
          // cannot quietly turn sound back on over the top of it.
          setSoundEnabled(next, true);
          sound.setMuted(!next);
          if (next) {
            // Inside the click, which is the gesture the AudioContext needs. A
            // visitor can therefore reach sound without ever touching the radio.
            sound.unlock();
            sound.startBed();
          } else {
            sound.stopBed();
          }
        }}
        className="press hit-32 flex size-7 cursor-pointer items-center justify-center rounded-full border border-kitchen-ink bg-kitchen-paper/80 text-kitchen-ink backdrop-blur-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-ink"
      >
        {on ? (
          <Volume2 className="size-3.5" aria-hidden />
        ) : (
          <VolumeX className="size-3.5" aria-hidden />
        )}
      </button>
    </span>
  );
}
