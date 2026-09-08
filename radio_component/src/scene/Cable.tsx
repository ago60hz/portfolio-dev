import { useMemo } from 'react'
import * as THREE from 'three'
import { D } from './dims'
import { PALETTE } from './materials'

/**
 * Strain-relief collar plus the coiled cord. The coil is a parametric helix
 * swept as a tube — cheaper and more controllable than modelling it.
 */
class Coil extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radius: number,
    private turns: number,
    private pitch: number,
    private lead: number,
    private leadLen: number,
  ) {
    super()
  }
  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    // First slice is a straight lead-in, then it winds.
    if (t < this.lead) {
      const k = t / this.lead
      return target.set(0, -k * this.leadLen, 0)
    }
    const u = (t - this.lead) / (1 - this.lead)
    const a = u * Math.PI * 2 * this.turns
    // Ease the radius open over the first turn so the straight run flows into
    // the helix instead of kinking into it.
    const r = this.radius * Math.min(1, u * this.turns)
    return target.set(
      Math.sin(a) * r,
      -this.leadLen - u * this.pitch * this.turns,
      // Squashed in Z so the coil reads as a cord seen face-on, not a spring.
      Math.cos(a) * r * 0.55,
    )
  }
}

export function Cable() {
  const { collarW, collarH, collarD, coilR, coilTurns, coilPitch, tubeR, lead } = D.cable
  const plateBottom = -D.plate.h / 2

  const geo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new Coil(coilR, coilTurns, coilPitch, 0.1, lead),
        // Segment count scales with turns — too few and the tube facets.
        Math.round(48 * coilTurns),
        tubeR,
        14,
        false,
      ),
    [coilR, coilTurns, coilPitch, tubeR, lead],
  )

  const rubber = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        // Soft glossy rubber spec: low roughness, tight clearcoat — a
        // sharper, wetter highlight than a matte cord would give.
        color: PALETTE.cable,
        roughness: 0.18,
        metalness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
      }),
    [],
  )

  return (
    <group position={[0, plateBottom, 0]}>
      <mesh position={[0, -collarH / 2 + 0.06, 0]} material={rubber}>
        <boxGeometry args={[collarW, collarH, collarD]} />
      </mesh>
      <mesh
        position={[0, -collarH + 0.1, 0]}
        geometry={geo}
        material={rubber} 
 />
    </group>
  )
}
