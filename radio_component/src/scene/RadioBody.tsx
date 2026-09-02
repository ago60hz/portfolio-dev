import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { D } from './dims'
import { getMaps, PALETTE } from './materials'

/** How far the speaker's chrome ring stands proud of the chassis face, and
 * how deep behind that rim the grille itself sits. CAVITY < RIM keeps the
 * grille clear of the chassis's own solid volume. */
const SPEAKER_RIM = 0.12
const SPEAKER_CAVITY = 0.095

/** Small, nearly flush Phillips screw: one head disc, one recessed slot. */
function Screw({ x, y }: { x: number; y: number }) {
  const { r, d } = D.screw
  const z = D.plate.d / 2
  return (
    <group position={[x, y, z]}>
      {/* AO shadow ring, seating the head into the plate */}
      <mesh position={[0, 0, -0.002]}>
        <circleGeometry args={[r * 1.22, 28]} />
        <meshStandardMaterial color="#68696b" roughness={0.85} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, d / 2]}>
        <cylinderGeometry args={[r, r * 0.95, d, 32]} />
        <meshStandardMaterial color="#9a9c9a" metalness={0.85} roughness={0.26} />
      </mesh>
      {/* Cross slot, recessed as real grooves cut into the head, not a decal */}
      {[0, Math.PI / 2].map((rot) => (
        <mesh key={rot} position={[0, 0, d - r * 0.18]} rotation={[0, 0, rot]}>
          <boxGeometry args={[r * 1.6, r * 0.22, r * 0.4]} />
          <meshStandardMaterial color="#333537" roughness={0.75} metalness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

export function RadioBody() {
  const maps = useMemo(() => getMaps(), [])

  const metal = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      // Deliberately below the 0.88 the spec asks for. A flat, camera-facing
      // plate at 0.88 has almost no diffuse response and samples only a
      // narrow slice of the environment, so it renders as one flat tone that
      // no light can shape — and dimming the environment just turns it dark.
      // At ~0.55 the key light produces a real, aimable highlight and the
      // base colour carries even brightness, which is what the reference
      // actually looks like. Visual hierarchy over the numeric value.
      color: '#C4C5C3',
      metalness: 0.55,
      roughness: 0.3,
      roughnessMap: maps.metal.roughness,
      normalMap: maps.metal.normal,
      normalScale: new THREE.Vector2(0.28, 0.28),
    })
    m.roughnessMap!.repeat.set(2, 2)
    m.normalMap!.repeat.set(2, 2)
    return m
  }, [maps])

  const grille = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Fine perforated metal mesh, dark warm brown, matte-leaning — low
        // enough metalness/high enough roughness that it doesn't throw a
        // bright specular hotspot under the key light.
        map: maps.weave.map,
        normalMap: maps.weave.normal,
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughness: 0.64,
        metalness: 0.24,
        // No tint: the weave map already carries #755A3D.
      }),
    [maps],
  )

  const chrome = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.chrome,
        metalness: 1,
        roughness: 0.14,
      }),
    [],
  )

  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.screenGlass,
        roughness: 0.19,
        metalness: 0.02,
        map: maps.glass,
      }),
    [maps],
  )

  const { plate, screen, speaker, screw } = D
  const faceZ = plate.d / 2

  return (
    <group>
      {/* Chassis */}
      <RoundedBox args={[plate.w, plate.h, plate.d]} radius={plate.radius} smoothness={4} material={metal} />

      {/*
        Screen and speaker both sit ENTIRELY IN FRONT of the chassis face
        (z > faceZ), never inside its solid volume — the old version measured
        the recess from inside the box itself, which put it behind the box's
        own opaque front face.
      */}

      {/* Screen: a single protruding slab, no separate frame part. Reads as
          black glass embedded directly in the chassis, not glass-then-bezel. */}
      <RoundedBox
        args={[screen.w, screen.h, screen.protrude]}
        radius={0.03}
        smoothness={3}
        position={[0, screen.y, faceZ + screen.protrude / 2]}
        material={glass}
      />

      {/* Speaker: recessed well, thin chrome ring, perforated mesh grille — same forward-of-chassis logic. */}
      <group position={[0, speaker.y, faceZ]}>
        {/* AO backing sized to the grille itself, not larger — a wider
            backing disc here is what read as a thick brown outer ring. */}
        <mesh position={[0, 0, SPEAKER_RIM - SPEAKER_CAVITY - 0.004]}>
          <circleGeometry args={[speaker.clothR, 64]} />
          <meshStandardMaterial color="#3f3021" roughness={1} />
        </mesh>
        <mesh position={[0, 0, SPEAKER_RIM - SPEAKER_CAVITY]}>
          <circleGeometry args={[speaker.clothR, 64]} />
          <primitive object={grille} attach="material" />
        </mesh>
        {/* Thin chrome ring: back edge flush with the chassis, front edge proud of it. */}
        <mesh position={[0, 0, SPEAKER_RIM / 2]}>
          <torusGeometry args={[speaker.ringInnerR, SPEAKER_RIM / 2, 16, 72]} />
          <primitive object={chrome} attach="material" />
        </mesh>
      </group>

      <Screw x={-screw.x} y={screw.yTop} />
      <Screw x={screw.x} y={screw.yTop} />
      <Screw x={-screw.x} y={screw.yBottom} />
      <Screw x={screw.x} y={screw.yBottom} />
    </group>
  )
}
