import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { BUTTON_H, BUTTON_ORDER, D, buttonY } from './dims'
import { PALETTE } from './materials'
import type { ButtonId } from '../core/types'

const COLOURS: Record<ButtonId, { face: string; icon: string }> = {
  up: { face: PALETTE.red, icon: PALETTE.redDark },
  down: { face: PALETTE.red, icon: PALETTE.redDark },
  playPause: { face: PALETTE.lime, icon: PALETTE.limeDark },
  power: { face: PALETTE.red, icon: PALETTE.redDark },
}

function Icon({ id, colour, depth }: { id: ButtonId; colour: string; depth: number }) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colour, roughness: 0.55, metalness: 0 }),
    [colour],
  )
  const s = 0.19

  if (id === 'up' || id === 'down') {
    // A 3-sided cylinder is a triangular prism. Its axis is Y and the triangle
    // lives in the local XZ-plane, so the aiming spin has to be around Y — a Z
    // rotation skews the axis instead and leaves both arrows pointing the same
    // way. Euler order is XYZ (Z, then Y, then X), so Y lands before the X-tip.
    // With rot=0 the apex tips to -Y, hence PI for 'up'.
    const rot = id === 'up' ? Math.PI : 0
    return (
      <mesh rotation={[Math.PI / 2, rot, 0]} position={[0, 0, depth / 2]} material={mat}>
        <cylinderGeometry args={[s, s, depth, 3]} />
      </mesh>
    )
  }

  if (id === 'power') {
    return (
      <mesh position={[0, 0, depth / 2]} material={mat}>
        <torusGeometry args={[s * 0.78, 0.033, 12, 40]} />
      </mesh>
    )
  }

  // play/pause: ▶ then two bars
  return (
    <group position={[0, 0, depth / 2]}>
      <mesh rotation={[Math.PI / 2, Math.PI / 2, 0]} position={[-0.16, 0, 0]} material={mat}>
        <cylinderGeometry args={[s * 0.92, s * 0.92, depth, 3]} />
      </mesh>
      {[0.09, 0.21].map((x) => (
        <mesh key={x} position={[x, 0, 0]} material={mat}>
          <boxGeometry args={[0.055, s * 1.5, depth]} />
        </mesh>
      ))}
    </group>
  )
}

type Props = {
  live: boolean
  onPress: (id: ButtonId) => void
  onPressDown: () => void
  onPressUp: () => void
  /** Pulses the power button's ring while booting. */
  booting: boolean
}

function Button({
  id,
  index,
  live,
  booting,
  onPress,
  onPressDown,
  onPressUp,
}: Props & { id: ButtonId; index: number }) {
  const ref = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const flash = useRef(0)

  const { w, d, radius, press, hover, x0 } = D.buttons
  const colour = COLOURS[id]
  const cx = x0 + w / 2
  const cy = buttonY(index)
  // Power stays interactive when the set is off — it is the only way back on.
  const enabled = live || id === 'power'

  const mat = useMemo(
    () =>
      // Vintage injection-molded plastic, not glossy acrylic: a low clearcoat
      // at high clearcoatRoughness gives a soft sheen instead of the sharp
      // "wet" highlight a full clearcoat throws.
      new THREE.MeshPhysicalMaterial({
        color: colour.face,
        roughness: 0.36,
        metalness: 0.03,
        clearcoat: 0.35,
        clearcoatRoughness: 0.42,
      }),
    [colour.face],
  )

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const target = d / 2 + (pressed ? -press : hovered && enabled ? hover : 0)
    g.position.z = THREE.MathUtils.damp(g.position.z, target, pressed ? 24 : 12, dt)

    flash.current = THREE.MathUtils.damp(flash.current, pressed ? 1 : 0, 14, dt)
    if (lightRef.current) {
      const boot = booting && id === 'power' ? 0.5 + Math.sin(performance.now() / 90) * 0.5 : 0
      lightRef.current.intensity = flash.current * 1.6 + boot * 0.8
    }
    // Unlit while inert, so a dead control looks dead.
    mat.emissiveIntensity = THREE.MathUtils.damp(
      mat.emissiveIntensity,
      enabled ? (hovered ? 0.18 : 0.05) : 0,
      10,
      dt,
    )
  })

  useMemo(() => {
    mat.emissive = new THREE.Color(colour.face)
    mat.emissiveIntensity = 0
  }, [mat, colour.face])

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()

  return (
    <group position={[cx, cy, 0]}>
      <group
        ref={ref}
        onPointerOver={(e) => {
          stop(e)
          setHovered(true)
          document.body.style.cursor = enabled ? 'pointer' : 'default'
        }}
        onPointerOut={(e) => {
          stop(e)
          setHovered(false)
          setPressed(false)
          document.body.style.cursor = 'default'
        }}
        onPointerDown={(e) => {
          stop(e)
          setPressed(true)
          onPressDown()
          // Fire on DOWN, not up: it feels immediate, and on iOS it keeps
          // playback inside the gesture that started it.
          if (enabled) onPress(id)
        }}
        onPointerUp={(e) => {
          stop(e)
          setPressed(false)
          onPressUp()
        }}
>
        <RoundedBox
          args={[w * 0.94, BUTTON_H * 0.9, d]}
          radius={radius}
          smoothness={4} 
          material={mat}
 />
        <Icon id={id} colour={colour.icon} depth={d} />
      </group>
      <pointLight
        ref={lightRef}
        position={[0, 0, d + 0.5]}
        color={colour.face}
        intensity={0}
        distance={2.4}
 />
    </group>
  )
}

export function ButtonStack(props: Props) {
  const { h, cy, x0, w } = D.buttons
  return (
    <group>
      {/* Housing the buttons sit in */}
      <RoundedBox
        args={[w, h, D.buttons.d * 0.55]}
        radius={0.05}
        smoothness={3}
        position={[x0 + w / 2, cy, D.buttons.d * 0.2]} 
>
        <meshStandardMaterial color="#7f8386" metalness={1} roughness={0.55} />
      </RoundedBox>
      {BUTTON_ORDER.map((id, i) => (
        <Button key={id} id={id} index={i} {...props} />
      ))}
    </group>
  )
}
