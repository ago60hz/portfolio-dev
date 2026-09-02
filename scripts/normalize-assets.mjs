/**
 * Copies compressed_assets/ into public/assets/ under kebab-case, web-safe
 * paths. Source stays untouched — re-run any time new exports land.
 */
import { cp, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

const SRC = 'compressed_assets'
const OUT = 'public/assets'

/** Explicit one-to-one moves. */
const FILES = {
  'container parts/top.webp': 'can/top.webp',
  'container parts/base.webp': 'can/base.webp',
  'branding/praise_fabilola_logo.webp': 'brand/praise-fabilola.webp',
  "branding/'jo'disco Logo.webp": 'brand/jodisco.webp',
  'shelf_props/wall-tile.webp': 'scene/wall-tile.webp',
  'shelf_props/shelf-plank.webp': 'scene/shelf-plank.webp',
  'Contact_me_dropdown/praise_avatar.webp': 'brand/praise-avatar.webp',
  // Praise's own artwork, so we never draw these in code.
  'works/Hot ribbon.svg': 'works/hot-ribbon.svg',
  // The two purple notes (revenue + testimonial) share one heart; the red
  // CHEF WAS CUTE sticker has its own.
  'tag_images/comment_heart.svg': 'poster/note-heart.svg',
  'tag_images/comment_heart_2.svg': 'poster/note-heart-2.svg',
  'tag_images/cute_chef_heart.svg': 'poster/vibe-heart.svg',
  'tag_images/cute_chef_heart_2.svg': 'poster/vibe-heart-2.svg',
  'tag_images/unrefyned.webp': 'poster/revenue-photo.webp',
  'tag_images/tyreek_houston.webp': 'poster/testimonial-photo.webp',
}

/** Whole directories, with a filename transform. */
const DIRS = [
  ['works/cover_images', 'works', (n) => n.replace(/_/g, '-')],
  ['works/hover_state_logos', 'brands', (n) => n.replace(/_/g, '-')],
  ['garnishes', 'garnishes', (n) => n],
  ['comments', 'avatars', (n) => n.toLowerCase().replace(/_/g, '-')],
  ['meet_the_chef_tools', 'tools', (n) => n.toLowerCase().replace(/^shape\.webp$/, 'tool-0.webp').replace(/^shape-(\d)/, 'tool-$1')],
  ['chef_was_cute', 'chef', (n, i) => `chef-${i}.webp`],
]

const copied = []

for (const [from, to] of Object.entries(FILES)) {
  const src = join(SRC, from)
  if (!existsSync(src)) { console.warn(`  MISSING  ${from}`); continue }
  await mkdir(dirname(join(OUT, to)), { recursive: true })
  await cp(src, join(OUT, to))
  copied.push(to)
}

for (const [from, to, rename] of DIRS) {
  const dir = join(SRC, from)
  if (!existsSync(dir)) { console.warn(`  MISSING  ${from}/`); continue }
  await mkdir(join(OUT, to), { recursive: true })
  const names = (await readdir(dir)).filter((n) => n.endsWith('.webp')).sort()
  await Promise.all(names.map(async (n, i) => {
    const out = join(to, rename(n, i))
    await cp(join(dir, n), join(OUT, out))
    copied.push(out)
  }))
}

console.log(copied.sort().map((c) => `  ${c}`).join('\n'))
console.log(`\n${copied.length} assets -> ${OUT}`)
