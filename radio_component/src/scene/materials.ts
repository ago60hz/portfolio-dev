import * as THREE from 'three'

/** Palette read off image/with led.png. */
export const PALETTE = {
  aluminium: '#b9bcbe',
  aluminiumDark: '#8d9194',
  chrome: '#d7dade',
  /** Speaker mesh — neutral silver, not the original brown cloth. */
  weave: '#B9BCBE',
  weaveDark: '#6E7173',
  red: '#E50305',
  redDark: '#8f0203',
  lime: '#DDF45B',
  limeDark: '#8fa32f',
  cable: '#E50305',
  screenGlass: '#0a0c0d',
  amber: '#ffb347',
  /** Second visualiser colour, paired with red on the LED ring. */
  purple: '#8B5CF6',
} as const

/** #755A3D, the specified grille colour, as the weave's base channels. */
/** Derived from PALETTE.weave so the texture can't drift from the palette. */
const WEAVE_RGB = [
  parseInt(PALETTE.weave.slice(1, 3), 16),
  parseInt(PALETTE.weave.slice(3, 5), 16),
  parseInt(PALETTE.weave.slice(5, 7), 16),
] as const

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!]
}

/** Grey height field -> tangent-space normal map, via a cheap Sobel. */
function heightToNormal(src: HTMLCanvasElement, strength = 2): THREE.CanvasTexture {
  const size = src.width
  const sctx = src.getContext('2d')!
  const h = sctx.getImageData(0, 0, size, size).data
  const [out, octx] = canvas(size)
  const img = octx.createImageData(size, size)
  const at = (x: number, y: number) => {
    const xi = (x + size) % size
    const yi = (y + size) % size
    return h[(yi * size + xi) * 4] / 255
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * size + x) * 4
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127
      img.data[i + 3] = 255
    }
  }
  octx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(out)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/**
 * Brushed aluminium. Real anisotropy needs an aniso-aware shader; fine
 * directional streaks in the roughness + normal get most of the way there
 * for a fraction of the cost, which is the right trade for a hero object.
 */
export function brushedMetalMaps(size = 1024) {
  const [c, ctx] = canvas(size)

  // The map is consumed at material roughness 1.0, so these greys ARE the
  // final roughness. Mid base, streaks swinging either side of it.
  ctx.fillStyle = 'rgb(96,96,96)' // ~0.38 roughness
  ctx.fillRect(0, 0, size, size)

  // Streak width is the thing that decides whether any of this is visible.
  // The plate renders a few hundred pixels wide, so a 1px line in a 1024px
  // map tiled even once lands well under a rendered pixel and disappears.
  // These are deliberately coarse for that reason.
  const streak = (n: number, minW: number, maxW: number, spread: number, alpha: number) => {
    for (let i = 0; i < n; i++) {
      const y = Math.random() * size
      const x = Math.random() * size
      const len = size * (0.25 + Math.random() * 0.75)
      const v = 96 + (Math.random() * 2 - 1) * spread
      ctx.strokeStyle = `rgb(${v | 0},${v | 0},${v | 0})`
      ctx.globalAlpha = alpha * (0.5 + Math.random() * 0.5)
      ctx.lineWidth = minW + Math.random() * (maxW - minW)
      ctx.beginPath()
      ctx.moveTo(x, y)
      // Near-horizontal: brushed metal's grain runs one way.
      ctx.lineTo(x + len, y + (Math.random() * 2 - 1))
      ctx.stroke()
    }
  }

  // Three scales, coarse to fine, so the grain doesn't read as one repeated
  // stripe frequency.
  streak(1100, 3, 7, 72, 0.6)
  streak(2200, 1.4, 3.4, 58, 0.42)
  streak(3400, 0.6, 1.8, 46, 0.26)

  ctx.globalAlpha = 1

  const roughness = new THREE.CanvasTexture(c)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  roughness.anisotropy = 16
  // Strong relief: the normal is what catches grazing light and turns a flat
  // roughness pattern into something that reads as physical grain.
  const normal = heightToNormal(c, 4.2)
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping
  normal.anisotropy = 16
  return { roughness, normal }
}

/**
 * Plain over/under weave for the speaker mesh. Drawn rather than sampled so
 * the thread pitch can be tuned to the reference instead of fighting a photo.
 */
export function weaveMaps(size = 512) {
  const [c, ctx] = canvas(size)
  const pitch = 8
  ctx.fillStyle = PALETTE.weaveDark
  ctx.fillRect(0, 0, size, size)

  for (let y = 0; y < size; y += pitch) {
    for (let x = 0; x < size; x += pitch) {
      const over = ((x / pitch + y / pitch) | 0) % 2 === 0
      // Per-thread colour jitter keeps the cloth from reading as a tiled grid.
      const j = 0.85 + Math.random() * 0.3
      // Threads are derived from the specified grille colour, so the map
      // itself carries the hue and no material tint has to correct it after.
      const k = (over ? 1.18 : 0.72) * j
      const r = Math.min(255, WEAVE_RGB[0] * k)
      const g = Math.min(255, WEAVE_RGB[1] * k)
      const b = Math.min(255, WEAVE_RGB[2] * k)
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
      ctx.beginPath()
      ctx.roundRect(x + 0.5, y + 0.5, pitch - 1, pitch - 1, 1.6)
      ctx.fill()
    }
  }

  const map = new THREE.CanvasTexture(c)
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8

  // Height field for the normal: over-threads sit proud of under-threads.
  const [hc, hctx] = canvas(size)
  hctx.fillStyle = '#4a4a4a'
  hctx.fillRect(0, 0, size, size)
  for (let y = 0; y < size; y += pitch) {
    for (let x = 0; x < size; x += pitch) {
      const over = ((x / pitch + y / pitch) | 0) % 2 === 0
      hctx.fillStyle = over ? '#d0d0d0' : '#3a3a3a'
      hctx.beginPath()
      hctx.roundRect(x + 0.5, y + 0.5, pitch - 1, pitch - 1, 1.6)
      hctx.fill()
    }
  }
  const normal = heightToNormal(hc, 2.6)
  return { map, normal }
}

/** Faint scanline + glass grime for the LED screen's inner surface. */
export function screenGlassMap(size = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(size)
  ctx.fillStyle = '#0a0c0d'
  ctx.fillRect(0, 0, size, size)
  ctx.globalAlpha = 0.06
  ctx.fillStyle = '#7fa8c0'
  for (let y = 0; y < size; y += 3) ctx.fillRect(0, y, size, 1)
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

let chassisMat: THREE.MeshPhysicalMaterial | null = null

/**
 * One shared chassis material. The control strip uses this too, so the strip
 * and the body are the same surface rather than two parts that happen to sit
 * next to each other.
 */
export function chassisMaterial(): THREE.MeshPhysicalMaterial {
  if (!chassisMat) {
    const maps = getMaps()
    chassisMat = new THREE.MeshPhysicalMaterial({
      // Brushed silver. Swap this one value to recolour the whole body —
      // the control strip shares this material, so both change together.
      color: '#C4C5C3',
      metalness: 0.62,
      // 1.0 so the roughness map passes through at full range. three.js
      // MULTIPLIES roughnessMap by this value, so any base below 1 compresses
      // the map's contrast — at 0.22 the grain was squashed into a 0.04-0.18
      // band and became invisible. This is the single thing that was hiding
      // the texture.
      roughness: 1.0,
      roughnessMap: maps.metal.roughness,
      normalMap: maps.metal.normal,
      normalScale: new THREE.Vector2(1.7, 1.7),
      // The thing that actually makes brushed metal look brushed: highlights
      // smear along the grain instead of staying round. Rotation 0 = the
      // grain runs horizontally, matching the scratch direction in the map.
      anisotropy: 0.75,
      anisotropyRotation: 0,
      envMapIntensity: 0.85,
    })
    // Near 1:1. Higher repeats shrink the grain below a rendered pixel, which
    // is what made it invisible however much contrast the map carried.
    chassisMat.roughnessMap!.repeat.set(1.4, 1.4)
    chassisMat.normalMap!.repeat.set(1.4, 1.4)
  }
  return chassisMat
}

let cached: {
  metal: ReturnType<typeof brushedMetalMaps>
  weave: ReturnType<typeof weaveMaps>
  glass: THREE.CanvasTexture
} | null = null

/** Generated once per document — the maps are identical for every instance. */
export function getMaps() {
  if (!cached) {
    cached = { metal: brushedMetalMaps(), weave: weaveMaps(), glass: screenGlassMap() }
  }
  return cached
}

/**
 * Equirectangular studio environment, generated in-process.
 *
 * Why not three's RoomEnvironment: it models a room with bright emissive
 * panels and dark corners. A high-metalness surface has almost no diffuse
 * response — its brightness IS its reflection — so those bright/dark zones
 * paint a hard gradient and a dark vignette straight onto the chassis.
 * Turning that environment *down* only makes the metal dark, because there's
 * nothing else lighting it.
 *
 * This is the opposite: a broad, even, bright field with one soft upper-right
 * hotspot. Even field -> even light silver; single soft hotspot -> one
 * controlled highlight instead of a gradient.
 */
export function studioEnvMap(w = 1024, h = 512): THREE.DataTexture {
  const data = new Float32Array(w * h * 4)

  /** Soft rectangular light panel, feathered at the edges. */
  const softbox = (
    u: number,
    v: number,
    cu: number,
    cv: number,
    halfU: number,
    halfV: number,
    feather: number,
  ) => {
    // Wrap horizontally — the map is a sphere, u = 0 and u = 1 are the seam.
    const du = Math.min(Math.abs(u - cu), 1 - Math.abs(u - cu))
    const dv = Math.abs(v - cv)
    const fu = 1 - THREE.MathUtils.smoothstep(du, halfU, halfU + feather)
    const fv = 1 - THREE.MathUtils.smoothstep(dv, halfV, halfV + feather)
    return fu * fv
  }

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1)
    // Base room: bright above, falling off below. Kept shallow so it never
    // paints a gradient across the body the way a room environment does.
    const vertical = 0.72 - v * 0.3

    for (let x = 0; x < w; x++) {
      const u = x / (w - 1)

      // Structured sources. An even field gives a reflective surface nothing
      // to reflect and it renders flat — these are the shapes that read as
      // shine, and their edges are what travel across the metal on movement.
      const key = softbox(u, v, 0.62, 0.24, 0.1, 0.13, 0.13) * 1.5
      const fill = softbox(u, v, 0.2, 0.3, 0.075, 0.1, 0.16) * 0.55
      const rim = softbox(u, v, 0.9, 0.46, 0.05, 0.16, 0.12) * 0.7
      // Bright horizon band — sweeps a long specular streak across the plate.
      const band = softbox(u, v, 0.5, 0.44, 0.5, 0.028, 0.06) * 0.5

      const level = Math.max(0.04, vertical + key + fill + rim + band)
      const i = (y * w + x) * 4
      // Very slightly cool, so the silver reads neutral rather than champagne.
      data[i] = level * 0.985
      data[i + 1] = level * 0.995
      data[i + 2] = level
      data[i + 3] = 1
    }
  }

  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.needsUpdate = true
  return tex
}
