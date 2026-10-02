// Build the globe gallery's thumbnail pool.
//
//   node scripts/gallery-tiles.mjs
//
// The globe shows every curated case-study still at once -- around forty
// images on screen together -- so it cannot reuse the article's artwork. Those
// files run to 3840px and 11MB a folder, and forty of them is a multi-megabyte
// download for a decoration the visitor has not asked for yet.
//
// This resizes each one to TILE_W wide and writes them to
// public/assets/gallery-tiles/, plus a generated module carrying the measured
// dimensions so the globe never has to guess an aspect ratio.
//
// It reads from `public/assets/case-studies/`, which is COMMITTED, rather than
// from `compressed_assets/`, which is Praise's local export and is often
// absent. That is what makes this runnable on a fresh clone.
//
// Which images are in the pool is not decided here -- `content/gallery.ts`
// owns that list, and this script derives its work from the same constant so
// the two cannot disagree.

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const SRC = 'public/assets/case-studies'
const OUT = 'public/assets/gallery-tiles'

/**
 * The widest a print is ever painted is ~320 CSS px -- a hero on the collage
 * ball -- and the wall now draws every print at ~210. 640 covers both on a 2x
 * screen; at 300, and then 480, they were visibly soft on a retina display.
 * The quality comes down to pay for most of the extra pixels: a 2x image is
 * shown at half size, which hides what 60 gives up against 74.
 */
const TILE_W = 640

/**
 * The curated keys, read out of content/gallery.ts rather than duplicated.
 *
 * A regex over the source instead of an import because this is a plain .mjs
 * script and that file is TypeScript. The list is a single flat array of string
 * literals under a named marker, which is exactly what this expects -- if the
 * shape of that constant changes, this throws rather than silently emitting an
 * empty pool.
 */
async function curatedKeys() {
  const source = await readFile('content/gallery.ts', 'utf8')
  const block = source.match(/const TILE_KEYS = \[([\s\S]*?)\] as const/)
  if (!block) throw new Error('content/gallery.ts: TILE_KEYS not found')
  const keys = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  if (!keys.length) throw new Error('content/gallery.ts: TILE_KEYS is empty')
  return keys
}

/**
 * A key's file on disk.
 *
 * A loop's key names the GIF, which cannot be resized into a still by a plain
 * `sharp().resize()` -- the first frame is what we want, and normalize-assets
 * has already written it next to the recording as `-still.webp`. Falling back
 * to it keeps the key space single: `bonadocs/13-mainnet-query` means the same
 * recording everywhere, and only this line knows it is served as two files.
 */
const candidates = (key) => [
  join(SRC, `${key}.webp`),
  join(SRC, `${key}-still.webp`),
]

// Emptied first, so removing a key from the list removes its file too. Without
// this the pool only ever grows, and a tile dropped from the globe goes on
// shipping in the repository for the next person to wonder about.
await rm(OUT, { recursive: true, force: true })

/**
 * Crop the presentation canvas off a board before it becomes a print.
 *
 * Most case-study boards sit on a flat grey or white canvas, which reads fine
 * inside an article and reads as a grey slab on a collage of prints. So the
 * uniform border is trimmed -- but only when the trim leaves most of the
 * board: a logotype alone on a canvas trims down to a speck, and a speck is
 * worse than the canvas it came on. Under KEEP of either side, the board is
 * used whole.
 */
const KEEP = 0.55

async function trimCanvas(source) {
  const whole = sharp(source, { limitInputPixels: false })
  const { width: w0, height: h0 } = await whole.metadata()
  const { data, info } = await whole
    .clone()
    .trim({ threshold: 18 })
    .toBuffer({ resolveWithObject: true })
  const kept = Math.min(info.width / w0, info.height / h0)
  return kept >= KEEP ? data : await whole.toBuffer()
}

/**
 * How much colour a print carries: mean HSV saturation over a 32x32 sample.
 *
 * The collage spends it. A board that is mostly white UI on white canvas reads
 * as a pale slab on the ball, so the layout gives those the small tier and
 * keeps them apart, and gives the hero spots to the prints with the most
 * colour -- which is a judgement that belongs to the pixels, not to a list
 * someone has to remember to update.
 */
async function saturation(file) {
  const data = await sharp(file).resize(32, 32, { fit: 'fill' }).removeAlpha().raw().toBuffer()
  let sum = 0
  for (let i = 0; i < data.length; i += 3) {
    const max = Math.max(data[i], data[i + 1], data[i + 2])
    const min = Math.min(data[i], data[i + 1], data[i + 2])
    sum += max ? (max - min) / max : 0
  }
  return Math.round((sum / (data.length / 3)) * 100) / 100
}

/**
 * How sharp a print reads: the variance of its Laplacian at 320px wide.
 *
 * A soft source -- a holographic gradient, a blurred photograph -- looks out
 * of focus the moment it is drawn large, so the layout keeps soft prints off
 * the hero spots and out of the body tier however much colour they carry.
 */
async function crispness(file) {
  const data = await sharp(file)
    .resize(320)
    .greyscale()
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] })
    .raw()
    .toBuffer()
  let mean = 0
  for (const v of data) mean += v
  mean /= data.length
  let variance = 0
  for (const v of data) variance += (v - mean) ** 2
  return Math.round(variance / data.length)
}

const tiles = {}

for (const key of await curatedKeys()) {
  let source = null
  for (const path of candidates(key)) {
    try {
      await sharp(path).metadata()
      source = path
      break
    } catch {
      /* try the next candidate */
    }
  }
  if (!source) throw new Error(`gallery-tiles: no file for "${key}"`)

  const out = join(OUT, `${key}.webp`)
  await mkdir(dirname(out), { recursive: true })
  const { width, height } = await sharp(await trimCanvas(source))
    .resize({ width: TILE_W, withoutEnlargement: true })
    .webp({ quality: 60 })
    .toFile(out)

  tiles[key] = {
    src: `/${out.replace('public/', '')}`,
    width,
    height,
    sat: await saturation(out),
    crisp: await crispness(out),
  }
}

const body = Object.entries(tiles)
  .map(([key, tile]) => `  ${JSON.stringify(key)}: ${JSON.stringify(tile)},`)
  .join('\n')

await writeFile(
  'content/gallery.generated.ts',
  `// GENERATED by scripts/gallery-tiles.mjs -- do not edit.\n` +
    `// Thumbnails for the globe gallery. Dimensions are measured off the files,\n` +
    `// so a tile's aspect ratio is never guessed.\n` +
    `export const TILE_ART = {\n${body}\n} as const;\n`,
)

const bytes = Object.keys(tiles).length
console.log(`  gallery-tiles: ${bytes} thumbnails at ${TILE_W}px -> ${OUT}`)
