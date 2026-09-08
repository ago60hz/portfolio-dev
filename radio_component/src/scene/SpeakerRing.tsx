import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { D } from './dims'
import { PALETTE } from './materials'

/**
 * LED level ring around the speaker.
 *
 * A single continuous torus stroke rather than discrete segments: colour is
 * written per-vertex around the ring, so the light reads as one unbroken band
 * that can shade smoothly instead of a row of dots.
 *
 * Behaviour is a bottom-up VU meter wrapped into a circle — each point's
 * threshold is set by how high it sits, so loud passages climb visibly toward
 * the top rather than the whole ring flashing at once. Hue carries level too:
 * the meter's body burns red where it is driven hardest and fades through
 * purple at its leading edge.
 */
const RADIAL_SEG = 8
const TUBULAR_SEG = 200
/** Sits just outside the chrome ring so it reads as a separate strip. */
const RING_R = D.speaker.ringInnerR + 0.085

export function SpeakerRing({
  live,
  levelRef,
}: {
  live: boolean
  levelRef: React.RefObject<number>
}) {
  const geoRef = useRef<THREE.TorusGeometry>(null)
  const smoothed = useRef(0)

  const { red, purple, off, tmp, edge } = useMemo(
    () => ({
      red: new THREE.Color(PALETTE.red),
      purple: new THREE.Color(PALETTE.purple),
      // Unlit isn't black — it's the dark tint of a coloured lens.
      off: new THREE.Color('#241028'),
      tmp: new THREE.Color(),
      edge: new THREE.Color(),
    }),
    [],
  )

  // One colour attribute, sized to the torus's vertex grid.
  useLayoutEffect(() => {
    const geo = geoRef.current
    if (!geo) return
    const count = geo.getAttribute('position').count
    if (!geo.getAttribute('color')) {
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    }
  }, [])

  useFrame((_, dt) => {
    const geo = geoRef.current
    if (!geo) return
    const colour = geo.getAttribute('color') as THREE.BufferAttribute | undefined
    if (!colour) return

    // Meters have inertia — a raw per-frame value strobes.
    const target = live ? levelRef.current : 0
    smoothed.current = THREE.MathUtils.damp(smoothed.current, target, 9, dt)
    const level = smoothed.current
    const t = performance.now() / 1000
    const cols = TUBULAR_SEG + 1

    for (let i = 0; i < cols; i++) {
      const a = (i / TUBULAR_SEG) * Math.PI * 2
      // 0 at the bottom of the ring, 1 at the top.
      const height = (Math.sin(a) + 1) / 2
      // Soft edge so the meter's leading edge glows rather than clipping.
      let amt = THREE.MathUtils.clamp((level - height * 0.92) * 5, 0, 1)
      // A slow counter-rotating shimmer keeps the band alive between beats
      // without ever lighting past where the level actually reached.
      if (live) amt *= 0.75 + 0.25 * Math.sin(a * 3 - t * 2.2)

      // Purple at the leading edge, burning to red through the driven body.
      edge.copy(purple).lerp(red, amt)
      tmp.copy(off).lerp(edge, amt)

      // Write the same colour down every radial row at this position.
      for (let j = 0; j <= RADIAL_SEG; j++) {
        colour.setXYZ(j * cols + i, tmp.r, tmp.g, tmp.b)
      }
    }
    colour.needsUpdate = true
  })

  return (
    <mesh position={[0, D.speaker.y, D.plate.d / 2 + 0.045]}>
      <torusGeometry ref={geoRef} args={[RING_R, 0.026, RADIAL_SEG, TUBULAR_SEG]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </mesh>
  )
}
