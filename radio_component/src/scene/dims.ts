/**
 * Every number here is measured off image/with led.png.
 * Scene scale: 1 unit = 100 reference pixels. Origin = centre of the metal plate.
 *
 * Two deliberate departures from the reference, per the brief:
 *   - the screen and speaker are centred on the plate's axis (they sit ~16px
 *     left of centre in the photo)
 *   - the two black pins on the top edge are gone
 */
export const D = {
  plate: { w: 4.63, h: 5.47, d: 0.75, radius: 0.06 },

  screen: {
    w: 2.22,
    h: 1.34,
    y: 1.495,
    /** How far the glass slab protrudes from the chassis face — no separate
     * frame part; the slab's own bevel is the only edge treatment. */
    protrude: 0.075,
  },

  speaker: {
    /** Chrome ring and grille shrunk and tightened together so no backing
     * material shows past the ring (was reading as a thick brown outer ring). */
    ringInnerR: 1.03,
    clothR: 0.97,
    y: -0.815,
  },

  /** Small, nearly flush Phillips heads — diameter ~0.21, minimal protrusion. */
  screw: { x: 1.825, yTop: 2.27, yBottom: -2.28, r: 0.105, d: 0.018 },

  /**
   * The control strip is a layout system, not four hand-placed buttons:
   * the strip spans the chassis height exactly, the buttons are inset from
   * it by a uniform padding, and the gaps between them are equal. Button
   * size is DERIVED from those (see BUTTON_H / BUTTON_W below), so changing
   * the strip or the padding keeps the spacing correct automatically.
   */
  buttons: {
    /** Left edge of the strip — flush against the plate's right edge
     * (plate.w / 2). The reference shows the controls attached directly to
     * the body, not a separate part floating beside it. */
    x0: 2.315,
    /** Strip width, measured off the reference: 169px of the plate's 463px. */
    w: 1.69,
    d: 0.95,
    count: 4,
    /** Equal gap between buttons, and equal inset from the strip edge. */
    gap: 0.065,
    padX: 0.111,
    padY: 0.087,
    radius: 0.09,
    /** Travel when pressed, and lift on hover. */
    press: 0.11,
    hover: 0.02,
  },

  cable: {
    collarW: 0.83,
    collarH: 0.62,
    collarD: 0.62,
    /** More turns and a tighter pitch — a real longer helix, not the old one
     * scaled up, so it reads as a coiled cord rather than a spring. */
    coilR: 0.46,
    coilTurns: 7,
    coilPitch: 0.32,
    tubeR: 0.15,
    /** Straight run between the collar and the first turn. */
    lead: 0.62,
  },
} as const

/**
 * Control-strip layout, derived rather than hand-placed.
 *
 *   STRIP (= chassis height)
 *     └─ padY ─┬─ button ─ gap ─ button ─ gap ─ button ─ gap ─ button ─┬─ padY
 *
 * Button height falls out of the strip height minus the padding and gaps, so
 * the stack is always exactly centred and evenly spaced whatever the strip
 * dimensions become.
 */
export const STRIP_H = D.plate.h

export const BUTTON_H =
  (STRIP_H - 2 * D.buttons.padY - (D.buttons.count - 1) * D.buttons.gap) / D.buttons.count

export const BUTTON_W = D.buttons.w - 2 * D.buttons.padX

/** Y centre of each button, top to bottom. Strip is centred on the chassis. */
export function buttonY(i: number): number {
  const top = STRIP_H / 2 - D.buttons.padY
  return top - BUTTON_H / 2 - i * (BUTTON_H + D.buttons.gap)
}

/** Order matches the reference: up, down, play/pause, power. */
export const BUTTON_ORDER = ['up', 'down', 'playPause', 'power'] as const
