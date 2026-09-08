import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RadioBody } from './RadioBody'
import { ButtonStack } from './ButtonStack'
import { ScreenPanel } from './ScreenPanel'
import { Cable } from './Cable'
import { SpeakerRing } from './SpeakerRing'
import { D } from './dims'
import { studioEnvMap } from './materials'
import type { UseRadio } from '../hooks/useRadio'

/**
 * True centre of the whole assembly: from the plate's left edge to the
 * control strip's right edge. The old version measured from the strip alone,
 * which pushed everything ~1.2 units left of centre.
 */
const UNIT_OFFSET_X = -(-D.plate.w / 2 + D.buttons.x0 + D.buttons.w) / 2

/**
 * The unit rides high in frame so the cable has room to fall, matching the
 * reference photo's composition (body in the upper two-thirds, cord trailing
 * out of the bottom) rather than centring the body and cropping the coil.
 */
const UNIT_OFFSET_Y = 0.8

type Props = { radio: UseRadio; lowPower: boolean; reducedMotion: boolean }

/**
 * Pointer parallax. Safer than it was: the screen is now a pure DOM layer with
 * no WebGL slab underneath, so tilting can no longer slide the two out of
 * register — the only constraint left is that the CSS3D layer keeps agreeing
 * with the chassis mesh.
 *
 * Widened well past the original ±4°, which was set while a WebGL slab still
 * sat behind the screen and the two passes visibly diverged. Yaw gets a wider
 * budget than pitch because horizontal swing shows the brushed grain and the
 * softbox reflections travelling across the plate, which is the point of it.
 * Still capped: the Html layer always composites above the canvas, so past
 * roughly 18° the screen reads as floating in front of the body.
 */
const MAX_TILT_X = THREE.MathUtils.degToRad(13)
const MAX_TILT_Y = THREE.MathUtils.degToRad(16)

function Rig({ children, reducedMotion }: { children: React.ReactNode; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const pointer = useThree((s) => s.pointer)

  useFrame((_, dt) => {
    const g = ref.current
    if (!g || reducedMotion) return
    // Damped slower than before so the unit settles like it has mass rather
    // than snapping to the cursor — more travel needs more easing.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.x * MAX_TILT_Y, 3.5, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * MAX_TILT_X, 3.5, dt)
  })

  return <group ref={ref}>{children}</group>
}

/**
 * Studio environment, generated in-process (no CDN fetch, nothing over the
 * wire). See studioEnvMap() for why this is an even bright field rather than
 * three's RoomEnvironment: at metalness 0.88 the chassis's brightness IS its
 * reflection, so an uneven environment paints a gradient and a dark vignette
 * directly onto it, and dimming that environment just makes the metal dark.
 */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const src = studioEnvMap()
    const target = pmrem.fromEquirectangular(src)
    scene.environment = target.texture
    // Back to the level the silver read correctly at. The softbox shapes in
    // the map give the metal something to reflect; turning the whole thing up
    // just made everything brighter, which is not the same as texture.
    scene.environmentIntensity = 0.55
    return () => {
      scene.environment = null
      target.texture.dispose()
      src.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  // Static on purpose: any metalness catches a moving env's bright/dark
  // patches as it rotates, which swung both the chassis and the screen glass
  // between correct and washed-out. A fixed angle, once set correctly, stays
  // correct — reliability over a shimmer effect, per "UI look over 3D env."
  return null
}

function Scene({ radio, reducedMotion }: { radio: UseRadio; reducedMotion: boolean }) {
  const live = radio.state.power !== 'off'

  return (
    <>
      <StudioEnvironment />

      {/* Flat, even, near-shadowless catalog-photo lighting — no shadow maps.
          Key light sits upper-right (shadows fall lower-left), soft and
          warm-neutral; fill is intentionally weak. Generous ambient keeps
          the chassis reading as one even silver surface rather than a
          gradient, closer to a controlled editorial shot than a 3D render. */}
      <ambientLight intensity={0.28} />
      <directionalLight position={[3.5, 4, 5]} intensity={0.9} color="#fff6ec" />
      <directionalLight position={[-4, -2, 5]} intensity={0.18} color="#eef2f6" />

      <Rig reducedMotion={reducedMotion}>
        <group position={[UNIT_OFFSET_X, UNIT_OFFSET_Y, 0]}>
        <RadioBody />
        <ScreenPanel state={radio.state} setHost={radio.setHost} />
        <ButtonStack
          live={live}
          booting={radio.state.power === 'booting'}
          onPress={radio.press}
          onPressDown={radio.pressDown}
          onPressUp={radio.pressUp}
        />
        <Cable />
          <SpeakerRing live={live} levelRef={radio.levelRef} />
        </group>
      </Rig>
    </>
  )
}

export default function RadioScene({ radio, lowPower, reducedMotion }: Props) {
  const dpr = useMemo<[number, number]>(() => (lowPower ? [1, 1.5] : [1, 2]), [lowPower])

  return (
    <Canvas
      dpr={dpr}
      // A narrow FOV pulled far back approximates an orthographic "product
      // photo" camera — minimal perspective distortion — while staying a
      // real PerspectiveCamera, so R3F's auto aspect/resize handling keeps
      // working for a responsive, drop-in-anywhere container. A true
      // OrthographicCamera would need its zoom hand-recomputed against the
      // container's pixel size on every resize to avoid breaking that.
      camera={{ position: [0, 0, 37.2], fov: 15 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
      }}
    >
      <Scene radio={radio} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
