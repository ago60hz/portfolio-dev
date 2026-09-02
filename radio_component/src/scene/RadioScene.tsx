import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RadioBody } from './RadioBody'
import { ButtonStack } from './ButtonStack'
import { ScreenPanel } from './ScreenPanel'
import { Cable } from './Cable'
import { D } from './dims'
import { PALETTE, studioEnvMap } from './materials'
import type { UseRadio } from '../hooks/useRadio'

/** Whole unit is ~6.5 wide; shift left so plate + buttons balance in frame. */
const UNIT_OFFSET_X = -(D.buttons.x0 + D.buttons.w) / 2

type Props = { radio: UseRadio; lowPower: boolean }

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
    // Bright on purpose — this is the metal's primary light source, not an
    // accent. The evenness of the map is what keeps it from reading as a
    // gradient at this intensity.
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

/** Warm lamp behind the cloth, pulsing with playback. */
function SpeakerLamp({ live, levelRef }: { live: boolean; levelRef: React.RefObject<number> }) {
  const ref = useRef<THREE.PointLight>(null)
  useFrame((_, dt) => {
    const l = ref.current
    if (!l) return
    // Toned down from the original: at full strength this read as a bright
    // gold hotspot on the grille rather than a subtle warm glow behind it.
    const target = live ? 0.3 + levelRef.current * 0.8 : 0
    l.intensity = THREE.MathUtils.damp(l.intensity, target, 8, dt)
  })
  return (
    <pointLight
      ref={ref}
      position={[0, D.speaker.y, D.plate.d / 2 + 0.35]}
      color={PALETTE.amber}
      intensity={0}
      distance={2.6}
    />
  )
}

function Scene({ radio }: { radio: UseRadio }) {
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

      {/* Static — no pointer-parallax tilt, per the user's explicit request. */}
      <group position={[UNIT_OFFSET_X, 0, 0]}>
        <RadioBody />
        <ScreenPanel
          state={radio.state}
          meta={radio.meta}
          levelRef={radio.levelRef}
          setHost={radio.setHost}
        />
        <ButtonStack
          live={live}
          booting={radio.state.power === 'booting'}
          onPress={radio.press}
          onPressDown={radio.pressDown}
          onPressUp={radio.pressUp}
        />
        <Cable />
        <SpeakerLamp live={live} levelRef={radio.levelRef} />
      </group>
    </>
  )
}

export default function RadioScene({ radio, lowPower }: Props) {
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
      camera={{ position: [0, 0, 27.5], fov: 15 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
      }}
    >
      <Scene radio={radio} />
    </Canvas>
  )
}
