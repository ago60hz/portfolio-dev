"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRadio } from "@ijodisco/radio-3d";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getKitchenSound } from "@/lib/audio/engine";
import { useKitchen } from "@/lib/store";

/**
 * The site's only contact with @ijodisco/radio-3d (90:346, 125 x 151 in the
 * wall gallery). Nothing else imports the package.
 *
 * `ssr: false` is not optional. The package decides what to render from a
 * synchronous `detectWebGL()` probe, which is false on the server and true in
 * the browser -- rendering it server-side is a guaranteed hydration mismatch.
 * It also keeps three/R3F out of the server bundle; the package's own
 * `lazy(() => import('./scene/RadioScene'))` keeps it out of the initial client
 * chunk.
 */
const Radio3D = dynamic(
  () => import("@ijodisco/radio-3d").then((m) => m.Radio3D),
  {
    ssr: false,
  },
);

export function RadioSlot({ width, height }: { width: number; height: number }) {
  // Owned here rather than left to the component so the tooltip can read the
  // power state without standing up a second player. That is what the
  // package's `radio` prop is for. It also makes this the one place on the site
  // that can see the radio's state, which is why the sound wiring lives here.
  const radio = useRadio({ muted: true });
  const off = radio.state.power === "off";

  const soundOn = useKitchen((s) => s.soundEnabled);
  const mutedByUser = useKitchen((s) => s.soundMutedByUser);
  const setSoundEnabled = useKitchen((s) => s.setSoundEnabled);
  const { power } = radio.state;

  /**
   * The radio arms the kitchen.
   *
   * Powering it on is the gesture the browser wants -- it happens inside the
   * button press, which is the only moment an AudioContext is allowed to
   * start -- and it is also the invitation the tooltip already makes.
   */
  // Transitions only, and only the one that switches sound ON. Powering the
  // radio off stops the music and nothing else: the kitchen's own effects are
  // the mute button's business, and having the radio silence them too meant
  // turning the track off cost you the room as well.
  //
  // On mount the radio is always off, which is the other reason this watches
  // for a transition rather than the value -- acting on that initial "off"
  // would silence a visitor who had already switched sound on from the toggle.
  const wasOn = useRef(false);
  useEffect(() => {
    const live = power !== "off";
    if (live === wasOn.current) return;
    wasOn.current = live;
    if (!live) return;

    // Inside the power press, which is the only moment a browser will let an
    // AudioContext start.
    getKitchenSound().unlock();
    // The radio ARMS sound; it never overrules a deliberate mute.
    if (!mutedByUser) setSoundEnabled(true);
  }, [power, mutedByUser, setSoundEnabled]);

  /**
   * The package synthesises clickDown/clickUp/powerOn/powerOff already; they
   * were only ever silent because this mounts it muted. One line is the whole
   * of the brief's "radio click and on/off sound effects".
   */
  const setRadioMuted = radio.setMuted;
  useEffect(() => {
    setRadioMuted(!soundOn);
  }, [soundOn, setRadioMuted]);

  return (
    <Tooltip>
      <TooltipTrigger
        // A span, not a button: the radio's own controls are the interactive
        // elements, and the package already ships a focusable control row.
        render={<span className="block" />}
      >
        <div
          // overflow-clip contains two things: the cable, which is drawn past
          // the bottom edge on purpose, and the package's WebGL-less fallback,
          // which is a flat 222x125px box far wider than this 125u slot.
          data-radio-slot
          // The canvas fills the slot whatever R3F last measured. R3F writes
          // the canvas's CSS size inline a frame or two after its container
          // resizes; for those frames the radio drew at its old size inside
          // the new box -- a visible pop right after the dock settles.
          // Stretching the last frame's buffer across them is invisible.
          className="relative overflow-clip [&_canvas]:h-full! [&_canvas]:w-full!"
          // Real pixels, and a real size rather than a transform. R3F measures
          // with getBoundingClientRect, so a scaled ancestor makes it size the
          // drawing buffer to the scaled rect and then set that as the canvas's
          // CSS size too -- applying the scale twice.
          //
          // Pixels rather than --u because this no longer lives inside the
          // Window: --u is a container query unit and resolves against the
          // wrong box out in the layout. RadioDock hands down the size it
          // measured off the anchor instead.
          style={{ width, height }}
        >
          <Radio3D
            radio={radio}
            // The package's root is `width:100%; aspect-ratio:4/3`, an inline
            // style, so only `!important` can reach it. At 125u wide that
            // aspect gives 94u of height and crops the cable; the design draws
            // 151. With width and height both definite, aspect-ratio drops out.
            className="h-full! w-full! [aspect-ratio:auto]!"
          />
        </div>
      </TooltipTrigger>

      {/* Only while it is off -- once the disco is on, the invitation is spent.
          Rendering the content conditionally rather than swapping the trigger
          keeps the canvas from remounting when the power changes. */}
      {off && (
        <TooltipContent side="top">
          Turn on radio for a disco party
        </TooltipContent>
      )}
    </Tooltip>
  );
}
