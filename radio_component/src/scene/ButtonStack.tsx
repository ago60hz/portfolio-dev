import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { BUTTON_H, BUTTON_ORDER, BUTTON_W, D, STRIP_H, buttonY } from './dims'
import { PALETTE, chassisMaterial } from './materials'
import type { ButtonId } from '../core/types'

const COLOURS: Record<ButtonId, { face: string; icon: string }> = {
  up: { face: PALETTE.red, icon: PALETTE.redDark },
  down: { face: PALETTE.red, icon: PALETTE.redDark },
  playPause: { face: PALETTE.lime, icon: PALETTE.limeDark },
  power: { face: PALETTE.red, icon: PALETTE.redDark },
}

/**
 * Icons are shallow extrusions with a bevel, not flat decals.
 *
 * The bevel is the whole point: it gives each symbol a chamfered lip that
 * catches the upper-right key light on one side and falls into shadow on the
 * other, so the symbol reads as moulded into the button rather than printed
 * on it. A flat plane or an un-bevelled prism has no such lip and stays a
 * silhouette no matter how the scene is lit.
 */
/**
 * Shapes are built at 10x and the finished geometry scaled down.
 * ExtrudeGeometry's bevel maths goes degenerate — NaN vertex positions — when
 * the bevel is a large fraction of the shape's coordinate magnitude, which it
 * is at icon size. Working large and scaling the result keeps the same visual
 * proportions with none of that.
 */
const S = 10
const ICON_DEPTH = 0.032 * S
const ICON_BEVEL = 0.008 * S

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: ICON_DEPTH,
  bevelEnabled: true,
  bevelThickness: ICON_BEVEL,
  bevelSize: ICON_BEVEL,
  bevelSegments: 2,
  curveSegments: 24,
}

/** Isosceles triangle pointing up, already centred on its bounding box. */
function triangleShape(s: number): THREE.Shape {
  const t = new THREE.Shape()
  t.moveTo(0, s * 0.75)
  t.lineTo(-s * 0.95, -s * 0.75)
  t.lineTo(s * 0.95, -s * 0.75)
  t.closePath()
  return t
}

/** Annulus — an outer circle with a concentric hole. */
function ringShape(outer: number, inner: number): THREE.Shape {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  return shape
}

function barShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-w / 2, -h / 2)
  s.lineTo(w / 2, -h / 2)
  s.lineTo(w / 2, h / 2)
  s.lineTo(-w / 2, h / 2)
  s.closePath()
  return s
}

function useIconGeometry(id: ButtonId): THREE.BufferGeometry {
  return useMemo(() => {
    const s = 0.2 * S
    let geo: THREE.BufferGeometry

    if (id === 'up' || id === 'down') {
      const g = new THREE.ExtrudeGeometry(triangleShape(s), EXTRUDE)
      // The shape always points up; flipping about Z aims the down arrow.
      if (id === 'down') g.rotateZ(Math.PI)
      geo = g
    } else if (id === 'power') {
      geo = new THREE.ExtrudeGeometry(ringShape(s * 0.82, s * 0.56), EXTRUDE)
    } else {
      // play/pause: the play triangle plus two bars
      const tri = new THREE.ExtrudeGeometry(triangleShape(s * 0.86), EXTRUDE)
      tri.rotateZ(-Math.PI / 2)
      tri.translate(-0.15 * S, 0, 0)

      const bars = [0.08 * S, 0.2 * S].map((x) => {
        const g = new THREE.ExtrudeGeometry(barShape(0.06 * S, s * 1.5), EXTRUDE)
        g.translate(x, 0, 0)
        return g
      })
      geo = mergeGeometries([tri, ...bars])
    }

    geo.scale(1 / S, 1 / S, 1 / S)
    geo.computeVertexNormals()
    return geo
  }, [id])
}

/** Minimal position/normal/uv merge — avoids pulling in BufferGeometryUtils. */
function mergeGeometries(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry()
  for (const name of ['position', 'normal', 'uv'] as const) {
    const arrays = list.map((g) => g.getAttribute(name)?.array as Float32Array | undefined)
    if (arrays.some((a) => !a)) continue
    const size = list[0].getAttribute(name).itemSize
    const merged = new Float32Array(
      arrays.reduce((n, a) => n + (a as Float32Array).length, 0),
    )
    let offset = 0
    for (const a of arrays) {
      merged.set(a as Float32Array, offset)
      offset += (a as Float32Array).length
    }
    out.setAttribute(name, new THREE.BufferAttribute(merged, size))
  }
  return out
}

function Icon({ id, colour }: { id: ButtonId; colour: string }) {
  const geometry = useIconGeometry(id)
  const mat = useMemo(
    // Slightly darker than the button face and a touch rougher, so the raised
    // faces read as the same material moulded, not a separate applied part.
    () => new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, metalness: 0.02 }),
    [colour],
  )
  return <mesh geometry={geometry} material={mat} />
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
        // Held down while the scene environment is turned up for the metal.
        // Plastic reflects far less than brushed aluminium, and without this
        // the raised environment washes the saturation out of the colour.
        envMapIntensity: 0.35,
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
        <RoundedBox args={[BUTTON_W, BUTTON_H, d]} radius={radius} smoothness={4} material={mat} />
        {/* Sits ON the button's front face, raised by its own extrusion depth. */}
        <group position={[0, 0, d / 2]}>
          <Icon id={id} colour={colour.icon} />
        </group>
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
  const { x0, w } = D.buttons
  return (
    <group>
      {/* Strip housing: exactly the chassis height and centred on it, so the
          assembly reads as one part rather than a block bolted to the side. */}
      <RoundedBox
        args={[w, STRIP_H, D.buttons.d * 0.55]}
        radius={0.05}
        smoothness={3}
        position={[x0 + w / 2, 0, D.buttons.d * 0.2]}
        material={chassisMaterial()}
      />
      {BUTTON_ORDER.map((id, i) => (
        <Button key={id} id={id} index={i} {...props} />
      ))}
    </group>
  )
}
