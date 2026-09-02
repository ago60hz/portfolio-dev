import * as THREE from 'three'

/** Palette read off image/with led.png. */
export const PALETTE = {
  aluminium: '#b9bcbe',
  aluminiumDark: '#8d9194',
  chrome: '#d7dade',
  weave: '#755A3D',
  weaveDark: '#3f3021',
  red: '#E50305',
  redDark: '#8f0203',
  lime: '#DDF45B',
  limeDark: '#8fa32f',
  cable: '#E50305',
  screenGlass: '#0a0c0d',
  amber: '#ffb347',
} as const

/** #755A3D, the specified grille colour, as the weave's base channels. */
const WEAVE_RGB = [0x75, 0x5a, 0x3d] as const

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
export function brushedMetalMaps(size = 512) {
  const [c, ctx] = canvas(size)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < size * 26; i++) {
    const y = Math.random() * size
    const x = Math.random() * size
    const len = 12 + Math.random() * 90
    const v = 128 + (Math.random() * 2 - 1) * 46
    ctx.strokeStyle = `rgb(${v},${v},${v})`
    ctx.globalAlpha = 0.16
    ctx.lineWidth = Math.random() < 0.85 ? 1 : 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y + (Math.random() * 0.6 - 0.3))
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const roughness = new THREE.CanvasTexture(c)
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping
  const normal = heightToNormal(c, 0.7)
  return { roughness, normal }
}

/**
 * Plain over/under weave for the speaker cloth. Drawn rather than sampled so
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
      // Threads are derived from the specified grille colour, so the map itself
      // carries the brown and no material tint has to correct it afterwards.
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

  for (let y = 0; y < h; y++) {
    // v: 0 at the top of the sphere, 1 at the bottom.
    const v = y / (h - 1)
    // Gentle top-to-bottom falloff — enough to read as a lit room, far too
    // little to register as a gradient across the object.
    const vertical = 0.94 - v * 0.22

    for (let x = 0; x < w; x++) {
      const u = x / (w - 1)

      // Soft broad key toward upper-right. Wide sigma keeps it a wash, not a
      // sharp reflected shape.
      const du = Math.min(Math.abs(u - 0.62), 1 - Math.abs(u - 0.62))
      const dv = v - 0.3
      const key = Math.exp(-((du * du) / 0.04 + (dv * dv) / 0.055)) * 0.8

      const level = vertical + key
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
