/**
 * Copies compressed_assets/ into public/assets/ under kebab-case, web-safe
 * paths. Source stays untouched — re-run any time new exports land.
 */
import { cp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import sharp from 'sharp'

const SRC = 'compressed_assets'
const OUT = 'public/assets'

/**
 * Case-study art.
 *
 * Sources are Figma/Framer hashes, so every file is renamed explicitly -- a
 * positional rule would silently reshuffle the article the next time an export
 * lands. Keys are the hash stem; values are the semantic name and the alt text.
 *
 * Unlike the DIRS pass below, this one accepts any raster format and converts
 * to webp, because compressed_assets/case_studies carries png, jpeg and gif.
 *
 * NOTE: compressed_assets/case_studies/ is gitignored -- it is Praise's local
 * source art and never ships. If it is absent this pass is skipped and the
 * already-committed public/assets/case-studies/ output stands.
 */
const STUDY_ART = {
  metamask: {
    k3Fu9AlWkG9H7EqDVMJanizAvOU: ['01-intro', 'MetaMask Card onboarding, before the redesign'],
    dCSDMuR1JdkCMZ6NA4VEaIlbg: ['02-funding-drop-off', 'The unguided funding step that dropped users into a swap interface'],
    AtrmqO1C5w0ImEtUuSmtVZMGJbE: ['03-spending-limit', 'The delegation screen and its $2,192,020.00 default spending cap'],
    '3G9oOHrm1TtvjLn0ntCgevm8': ['04-stepper', 'The four-step onboarding stepper'],
    mUlpaWFwXV0Hwsl91U8emJyQQ: ['05-dashboard-states', 'Dashboard states for users who did not finish onboarding'],
  },
  bonadocs: {
    gwE1ZBDbkxRBd8ybA2dBtmEg: ['01-hero', 'The Bonadocs widget embedded in a documentation page'],
    KRIXkD9DMYocOSLYJSgO3sCUQc4: ['02-widget-in-docs', 'The widget running inside the Lido documentation'],
    oeJkBH1w2Hdx72BbAZd7LhqZQo: ['03-user-interview', 'A Jobs-to-be-Done interview with a Web3 developer'],
    IiMMVhFG1lfr4Dg8yA2DmcNvFY: ['04-journey-map', 'The user journey map built from the interview insights'],
    jXEjxOuwX4TsS00qu7Ic0RaI1Q: ['05-affinity-diagram', 'Affinity diagram clustering usability feedback'],
    ed6ekbFyJhV9mxgs8kfp3XuyjI: ['06-sketches', 'Early sketches of the widget'],
    m9ynFSqoL7aoJoFd0jKhakJdBCY: ['07-wireframes', 'Low-fidelity wireframes for querying a contract method'],
    K0ucKZiJkrxkoIxWciWO6SUMZhQ: ['08-moodboard', 'Moodboard for the widget interface'],
    dgNLGEgAN25eZFNdPSSt1cPzCk: ['09-first-hifi', 'First high-fidelity explorations'],
    B5vRGHdBlwKcXWAnyF1AJMsctc: ['10-userflow-first', 'The first user-flow exploration, recorded'],
    OjlIQFtCA8xgszlK7eMUwhshfQ: ['11-round-two-feedback', 'Participant feedback from the second usability round'],
    gDW7F7wbTKR87dJ3JNLgeCOgTE: ['12-userflow-revised', 'The revised user flow, recorded'],
    '5GphEl2qlLZcdsQN4Zi91ZNbzk': ['13-mainnet-query', 'Querying the mainnet from inside the docs'],
    sk4tU3H9Cp6DHyS6m1snAJxj3QQ: ['14-array-properties', 'Adding array properties that carry tuples of parameters'],
    '0Z2xtCfjfEJ6ISVLz83IirZ1WCg': ['15-parameter-tabs', 'Switching between method and transaction parameters'],
    QnY4F6cS1bieCL1Cbu2gHljqSY: ['16-consensys-fellowship', 'Selected for the maiden Consensys fellowship programme'],
  },
  // Keys here are path fragments, not bare stems: this study nests its exports
  // in subdirectories, one of which has a space in its name.
  passportmonie: {
    'branding_slides/01': ['01-app-icon', 'The PassportMonie app icon over a textured gradient'],
    'branding_slides/02': ['02-logotype', 'The PassportMonie logotype'],
    'branding_slides/05': ['03-color', 'Brand colors: Deep Current, Bold Velocity, Neon Pulse, Clear Horizon, Friendly Glow, Ice White'],
    'branding_slides/06': ['04-typography', 'DM Sans as the primary typeface, and why'],
    'branding_slides/07': ['05-gradients', 'Spectral, textured brand gradients'],
    'branding_slides/08': ['06-art-direction', 'Art direction: Lagos iconography, botanical texture, vintage gadgetry'],
    'branding_slides/9': ['07-tone-of-voice', 'Tone of voice: fast and direct, versatile, personable and warm, empowering'],
    'branding_slides/merch': ['08-merch', 'Brand applied to merchandise'],
    'product slides/Onboarding': ['09-onboarding', 'Onboarding screens carrying the illustrated system'],
    'product slides/Product Screens': ['10-product-screens', 'Product screens with wallet card backgrounds and setup banners'],
    '731d70400729539ef46aff37d1f6c19': ['11-in-product', 'AI illustration in the live product: wallet card, setup banners, and the Carter Bridge on clouds'],
    '8c534d605a156769c5bf6f3f44ffc54': ['12-icon-set', 'The icon set, themed to the same material palette'],
  },
  // One sheet each. An earlier pass cut these into their cells so individual
  // mockups would be legible; Praise wanted the sheets kept whole, so they run
  // at full column width as composed.
  dean: {
    '170d8a4caec08004b29406532dafeda3': ['01-logo-mockups', 'DEAN logo mockups across physical applications'],
  },
  'fagbemi-studios': {
    '5da8949d367a839431cb972cc206c4c5': ['01-brand-reel', 'Fagbemi Studios identity across renders, photography and the quote card'],
    // The two 4:5 sheets, run as a pair. Matched on a prefix rather than the
    // full name because both carry a double space Finder will not preserve.
    'Exhibition': ['02-exhibition', 'Light and Shadow: an exhibition poster in garnet and gold, the monogram set over an oval portrait'],
    'Work in Progress': ['03-work-in-progress', 'The artist at the easel, a portrait in progress under available light'],
  },
}

/** Every file under a directory, as paths relative to it. */
const walk = async (dir, base = '') => {
  const out = []
  for (const e of await readdir(join(dir, base), { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const rel = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...(await walk(dir, rel)))
    else out.push(rel)
  }
  return out
}

/**
 * Animated GIFs are copied through untouched.
 *
 * An earlier pass re-encoded them to animated WebP at 700px, which took 9.9MB
 * down to 2.7MB -- and visibly degraded UI recordings where the whole point is
 * that you can read the interface being demonstrated. Praise called it: keep
 * the GIFs. Weight is handled by loading="lazy" on the element instead, so a
 * clip is only fetched once a reader scrolls to it.
 *
 * A still first frame is still generated alongside, for prefers-reduced-motion.
 */

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
  /* cute_chef_heart_2.svg is NOT copied. Nothing renders it, and the export is
     broken: a 61x45 viewBox wrapping one full-resolution bitmap as a base64
     data URI, which is 2.3MB -- a thousand times its 2.2KB sibling, which is
     real vector. SVGs bypass next/image, so it would have shipped raw.
     Re-export it as vector from Figma before adding this line back. */
  'tag_images/unrefyned.webp': 'poster/revenue-photo.webp',
  'tag_images/tyreek_houston.webp': 'poster/testimonial-photo.webp',
  // The wall gallery's pinned photos (90:296). Exported by LAYER NAME, which
  // is the stable identifier here -- so unlike the tool icons, the mapping can
  // be read straight off the node tree rather than guessed from ordering.
  // Every one of these is FINAL artwork: the white frame and the layer's
  // rotation are already baked into the pixels. Do not re-apply either in CSS
  // -- that is what produced double frames and photos rotated twice.
  /* v2: Praise's re-exports, roughly twice the pixels of the originals at the
     same ratios (525-560 square against 269-287). The board doubles in size
     between peek and reveal, and the first set was being upscaled at reveal. */
  'wall_gallery_photos/v2/Rectangle 15.webp': 'gallery/rectangle-15.webp',
  'wall_gallery_photos/v2/Rectangle 16.webp': 'gallery/rectangle-16.webp',
  'wall_gallery_photos/v2/Rectangle 17.webp': 'gallery/rectangle-17.webp',
  'wall_gallery_photos/v2/Rectangle 18.webp': 'gallery/rectangle-18.webp',
  'wall_gallery_photos/IMG_0953 1.webp': 'gallery/img-0953.webp',
  // The board itself (121:395 onward): brown ground, tan rules, drop shadow.
  // Supersedes the red CSS lattice that matched the older 90:297.
  //
  // grid.svg is kept mapped but no longer painted -- grid_BG.webp replaces it
  // on the board. It is a photograph of the real surface where the SVG was a
  // flat redraw of it, and at reveal the board is ~960u wide, which is where a
  // flat fill starts looking like a fill.
  'wall_gallery_photos/grid.svg': 'gallery/grid.svg',
  'wall_gallery_photos/grid_BG.webp': 'gallery/grid-bg.webp',
  'wall_gallery_photos/v2/poster.webp': 'gallery/poster.webp',
  // The v2 zip nests this one under a folder whose name ends in a space. Both
  // the space and the capital are in the export, not typos.
  'wall_gallery_photos/v2/Poster / vibe.webp': 'gallery/vibe.webp',
  // Praise's signature, closing the chef bio (1:3815).
  // NOTE: 'meet_the_chef_tools/Meet the Chef_bg.webp' is deliberately NOT
  // mapped. The portrait behind the bio was tried and dropped -- it read badly
  // behind the text at any opacity. The source is still in compressed_assets if
  // it is ever wanted back.
  'meet_the_chef_tools/praise signature/Praise signature.svg': 'chef/praise-signature.svg',
}

/** Whole directories, with a filename transform. */
const DIRS = [
  ['works/cover_images', 'works', (n) => n.replace(/_/g, '-')],
  ['works/hover_state_logos', 'brands', (n) => n.replace(/_/g, '-')],
  ['garnishes', 'garnishes', (n) => n],
  ['comments', 'avatars', (n) => n.toLowerCase().replace(/_/g, '-')],
  ['meet_the_chef_tools', 'tools', (n) => n.toLowerCase().replace(/^shape\.webp$/, 'tool-0.webp').replace(/^shape-(\d)/, 'tool-$1'), (n) => /^shape/i.test(n)],
  ['chef_was_cute', 'chef', (n, i) => `chef-${i}.webp`],
  // The client marks shown in a case study masthead (192x192). Deliberately a
  // separate set from `brands/`, which the home popover's swatch still uses.
  ['case_studies/client_icons', 'client-icons', (n) => n],
  // Larger covers (712x400) for the next-case-study footer, where the 534x300
  // can artwork was being upscaled.
  ['works/bigger_sizes', 'covers', (n) => n.replace(/_/g, '-')],
  // Tool icons redrawn for the sand background. Held in their own directory
  // until the background change lands, so the purple build keeps working.
  /*
   * The on-sand export is sequenced differently from the purple one, so the two
   * are mapped by ARTWORK rather than by filename. Without this, tool-2 is a
   * sparkle on the kitchen and Webflow on a case study -- the icons change
   * identity when the room repaints.
   *
   * Verified by rendering both sets side by side, not by filename order:
   *   purple  0 Shopify  1 Webflow  2 sparkle  3 Framer  4 Jitter  5 Figma
   *   on-sand 0 Jitter   1 Shopify  2 Webflow  3 Framer  4 Figma   5 sparkle
   */
  ['meet_the_chef_tools/on-sand', 'tools-sand', (n) => {
    const BY_ARTWORK = {
      'shape-1.webp': 'tool-0.webp', // Shopify
      'shape-2.webp': 'tool-1.webp', // Weave
      'shape-5.webp': 'tool-2.webp', // Claude
      'shape-3.webp': 'tool-3.webp', // Framer
      'shape.webp': 'tool-4.webp',   // Jitter
      'shape-4.webp': 'tool-5.webp', // Figma
    }
    return BY_ARTWORK[n.toLowerCase()] ?? n.toLowerCase()
  }],
]

/**
 * The exports that need compressing, keyed by destination.
 *
 * OPT-IN, and deliberately so. A blanket re-encode of every mapped file was
 * tried first and is wrong: most of these were already tuned, and running an
 * existing webp through the encoder again is generational loss for whatever it
 * saves. It took `jodisco.webp` -- pixel art, kept as a bitmap precisely so the
 * letterforms stay hard -- from 6.7KB to 5.9KB by softening the edges the file
 * exists to preserve, and the can top from 48KB to 13KB.
 *
 * So: a plain copy by default, and this list for the ones measured to need it.
 *
 * `maxWidth` caps a source larger than anything that can be drawn from it. The
 * board is 481u wide and reveal scales it 1.91, so ~920u -- a little over 1000
 * CSS px at the unit sizes the scene reaches, and 2200 covers that at 2x. The
 * export was 3678px and 4.6MB: a background nobody can see the detail of,
 * costing more than every photograph on the board combined.
 */
const RE_ENCODE = {
  'gallery/grid-bg.webp': { maxWidth: 2200 },
  'gallery/rectangle-15.webp': {},
  'gallery/rectangle-16.webp': {},
  'gallery/rectangle-17.webp': {},
  'gallery/rectangle-18.webp': {},
  'gallery/poster.webp': {},
  'gallery/vibe.webp': {},
}

const copied = []

for (const [from, to] of Object.entries(FILES)) {
  const src = join(SRC, from)
  if (!existsSync(src)) { console.warn(`  MISSING  ${from}`); continue }
  await mkdir(dirname(join(OUT, to)), { recursive: true })

  const encode = RE_ENCODE[to]
  if (encode) {
    const img = sharp(src, { limitInputPixels: false })
    const { width } = await img.metadata()
    const cap = encode.maxWidth
    await (cap && width > cap ? img.resize({ width: cap }) : img)
      .webp({ quality: encode.quality ?? 82 })
      .toFile(join(OUT, to))
  } else {
    await cp(src, join(OUT, to))
  }

  copied.push(to)
}

for (const [from, to, rename, keep] of DIRS) {
  const dir = join(SRC, from)
  if (!existsSync(dir)) { console.warn(`  MISSING  ${from}/`); continue }
  await mkdir(join(OUT, to), { recursive: true })
  const names = (await readdir(dir))
    .filter((n) => n.endsWith('.webp') && (!keep || keep(n)))
    .sort()
  await Promise.all(names.map(async (n, i) => {
    const out = join(to, rename(n, i))
    await cp(join(dir, n), join(OUT, out))
    copied.push(out)
  }))
}

// -- Case studies -------------------------------------------------------------
// Dimensions are measured here and written into a generated module, so a
// content file never carries a hand-typed width. Wrong dimensions mean either
// a stretched image or a layout shift, and neither announces itself.
const media = {}
const loops = {}

for (const [slug, map] of Object.entries(STUDY_ART)) {
  // Source folders use underscores where slugs use hyphens.
  const dir = join(SRC, 'case_studies', slug.replace(/-/g, '_'))
  if (!existsSync(dir)) { console.warn(`  SKIP  ${dir} (no local source)`); continue }
  const names = await walk(dir)
  await mkdir(join(OUT, 'case-studies', slug), { recursive: true })

  for (const [stem, [name, alt]] of Object.entries(map)) {
    const file = names.find((n) => n.startsWith(stem) || n.includes(stem))
    if (!file) { console.warn(`  MISSING  case_studies/${slug}/${stem}*`); continue }
    const src = join(dir, file)
    const out = join('case-studies', slug, `${name}.webp`)

    if (file.toLowerCase().endsWith('.gif')) {
      const meta = await sharp(src, { animated: true, limitInputPixels: false }).metadata()
      const gifOut = join('case-studies', slug, `${name}.gif`)
      await cp(src, join(OUT, gifOut))

      // First frame only -- what a reduced-motion reader gets instead.
      const stillOut = join('case-studies', slug, `${name}-still.webp`)
      await sharp(src, { limitInputPixels: false }).webp({ quality: 80 }).toFile(join(OUT, stillOut))

      loops[`${slug}/${name}`] = {
        src: `/assets/${gifOut}`, still: `/assets/${stillOut}`, alt,
        width: meta.width, height: meta.pageHeight,
      }
      copied.push(gifOut, stillOut)
      const mb = (await import('node:fs')).statSync(src).size / 1048576
      console.log(`  loop  ${name}  ${meta.width}x${meta.pageHeight}  ${meta.pages} frames  ${mb.toFixed(2)}MB (original)`)
      continue
    }

    const { width, height } = await sharp(src).webp({ quality: 82 }).toFile(join(OUT, out))
    media[`${slug}/${name}`] = { src: `/assets/${out}`, alt, width, height }
    copied.push(out)
  }
}

/**
 * The image-trail cursor's pool (compressed_assets/Gallery).
 *
 * Praise's photographs, dropped in at 1080-1440px and 190-565KB each. The
 * trail is the first thing on screen and the loader waits on this set, so
 * shipping them at source size would make the loading animation the slowest
 * thing it is loading. They paint at 220x270, so 440 wide covers 2x.
 *
 * Sorted by filename for a stable order, then numbered -- the source names are
 * CDN hashes and carry no meaning, so the number is the only honest identifier.
 */
const trail = []
{
  const dir = join(SRC, 'Gallery')
  if (!existsSync(dir)) {
    console.warn('  MISSING  Gallery/')
  } else {
    const names = (await walk(dir)).filter((n) => /\.(jpe?g|png|webp)$/i.test(n)).sort()
    let i = 0
    for (const name of names) {
      const out = join('trail', `trail-${String(++i).padStart(2, '0')}.webp`)
      const { width, height } = await sharp(join(dir, name))
        .resize({ width: 440, withoutEnlargement: true })
        .webp({ quality: 74 })
        .toFile(join(OUT, out))
      trail.push({ src: `/assets/${out}`, width, height })
      copied.push(out)
    }
    console.log(`\n  trail: ${trail.length} images`)
  }
}

if (trail.length) {
  await writeFile(
    'content/trail.generated.ts',
    `// GENERATED by scripts/normalize-assets.mjs -- do not edit.\n` +
      `// The image-trail cursor's pool. Dimensions are measured off the files,\n` +
      `// so the trail never has to guess an aspect ratio.\n` +
      `export type TrailImage = { src: string; width: number; height: number };\n\n` +
      `export const TRAIL: TrailImage[] = [\n` +
      trail.map((t) => `  ${JSON.stringify(t)},`).join('\n') +
      `\n];\n`,
  )
}

if (Object.keys(media).length || Object.keys(loops).length) {
  const fmt = (o) => Object.entries(o)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join('\n')
  await writeFile(
    'content/case-studies/media.generated.ts',
    `// GENERATED by scripts/normalize-assets.mjs -- do not edit.\n` +
      `// Dimensions are measured off the files themselves, which is what keeps\n` +
      `// aspect ratios honest and the page free of layout shift.\n` +
      `import type { Loop, Media } from "./types";\n\n` +
      `export const MEDIA = {\n${fmt(media)}\n} as const satisfies Record<string, Media>;\n\n` +
      `export const LOOPS = {\n${fmt(loops)}\n} as const satisfies Record<string, Loop>;\n\n` +
      `export type MediaKey = keyof typeof MEDIA;\n` +
      `export type LoopKey = keyof typeof LOOPS;\n`,
  )
  console.log(`\n  media.generated.ts: ${Object.keys(media).length} images, ${Object.keys(loops).length} loops`)
}

console.log(copied.sort().map((c) => `  ${c}`).join('\n'))
console.log(`\n${copied.length} assets -> ${OUT}`)
