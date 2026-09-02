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

  buttons: {
    /** Left edge of the button block — flush against the plate's right
     * edge (plate.w / 2), no gap. The reference shows the buttons attached
     * directly to the body, not a separate part floating beside it. */
    x0: 2.315,
    w: 1.69,
    h: 5.5,
    /** Block centre in Y — the stack is very slightly low in the reference. */
    cy: -0.045,
    d: 0.95,
    count: 4,
    radius: 0.09,
    /** Travel when pressed, and lift on hover. */
    press: 0.11,
    hover: 0.02,
  },

  cable: {
    collarW: 0.83,
    collarH: 0.62,
    collarD: 0.62,
    coilR: 0.42,
    coilTurns: 4.2,
    coilPitch: 0.5,
    tubeR: 0.13,
  },
} as const

/** Y centre of each button, top to bottom. */
export function buttonY(i: number): number {
  const { h, cy, count } = D.buttons
  const each = h / count
  return cy + h / 2 - each * (i + 0.5)
}

export const BUTTON_H = D.buttons.h / D.buttons.count

/** Order matches the reference: up, down, play/pause, power. */
export const BUTTON_ORDER = ['up', 'down', 'playPause', 'power'] as const
