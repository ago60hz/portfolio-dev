// Pull raw design data from the Figma REST API into design/figma/.
//
//   FIGMA_TOKEN=... node scripts/figma-pull.mjs [fileKey] [nodeId ...]
//   FIGMA_TOKEN=... node scripts/figma-pull.mjs --images <outDir> [fileKey] [nodeId ...]
//
// With --images, the node dump is written as usual and every IMAGE fill found
// under those nodes is downloaded into <outDir>, named by its imageRef. That
// is the only way to get the artwork out: a node's `imageRef` is an opaque id
// that only files/:key/images resolves to a (short-lived) URL.
//
// fileKey defaults to FIGMA_FILE_KEY or the "IJO DISCO / File" key recorded in
// design/spec.md. Extra args are node ids (from a Figma link's node-id=1-189,
// written either 1-189 or 1:189) — each is dumped on its own as node-<id>.json
// via the /nodes endpoint, in addition to the whole-file cache.
//
// Token is a personal access token (Figma > Settings > Security). For
// variables.json add the file_variables:read scope. Output is raw JSON —
// design/spec.md stays the curated prose layer on top.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'

// Trimmed: a token pasted from Figma's dialog often carries a trailing
// newline or space, which survives into the header and comes back as a bare
// "403 Invalid token" that looks exactly like a revoked one.
const TOKEN = process.env.FIGMA_TOKEN?.trim()
let args = process.argv.slice(2)

// --nodes-only: skip the whole-file cache and the styles/components/variables
// endpoints, and fetch just the requested nodes. One request instead of five.
// file.json is 20MB and rarely changes; re-pulling it to read three nodes is
// what exhausts Figma's rate limit.
const NODES_ONLY = args.includes('--nodes-only')
args = args.filter((a) => a !== '--nodes-only')

// --images <outDir>, anywhere in the args.
const imagesAt = args.indexOf('--images')
const IMAGE_DIR = imagesAt === -1 ? null : args[imagesAt + 1]
if (imagesAt !== -1) {
  if (!IMAGE_DIR) {
    console.error('--images needs an output directory, e.g. --images compressed_assets/wall_gallery')
    process.exit(1)
  }
  args = [...args.slice(0, imagesAt), ...args.slice(imagesAt + 2)]
}
const FILE_KEY = args[0] || process.env.FIGMA_FILE_KEY || 'Qf9So7pT1dl36oVh98udnY'
const NODE_IDS = args.slice(1).map((s) => s.replace(/-/g, ':'))
// Resolved from this file's location, not the shell's cwd — lets the script run
// from anywhere (some macOS setups block Node's getcwd on ~/Documents).
const OUT = join(import.meta.dirname, '..', 'design', 'figma')

if (!TOKEN) {
  console.error('Missing FIGMA_TOKEN. Pass it inline:\n  FIGMA_TOKEN=figd_... node scripts/figma-pull.mjs')
  process.exit(1)
}

const get = async (path) => {
  const res = await fetch(`https://api.figma.com/v1/${path}`, {
    headers: { 'X-Figma-Token': TOKEN },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} — ${body.err || body.message || 'unknown'}`)
    err.status = res.status
    throw err
  }
  return body
}

// [filename, endpoint, required] — non-required endpoints (e.g. variables, an
// Enterprise-only API) log a warning instead of aborting the run.
const targets = NODES_ONLY
  ? []
  : [
      ['file.json', `files/${FILE_KEY}`, true],
      ['styles.json', `files/${FILE_KEY}/styles`, true],
      ['components.json', `files/${FILE_KEY}/components`, true],
      ['component_sets.json', `files/${FILE_KEY}/component_sets`, true],
      ['variables.json', `files/${FILE_KEY}/variables/local`, false],
    ]

if (NODES_ONLY && !NODE_IDS.length) {
  console.error('--nodes-only needs at least one node id.')
  process.exit(1)
}

if (NODE_IDS.length) {
  const q = encodeURIComponent(NODE_IDS.join(','))
  targets.push([`node-${NODE_IDS.join('_').replace(/:/g, '-')}.json`, `files/${FILE_KEY}/nodes?ids=${q}`, true])
}

await mkdir(OUT, { recursive: true })

const manifest = {
  fileKey: FILE_KEY,
  nodeIds: NODE_IDS,
  pulledAt: new Date().toISOString(),
  endpoints: {},
}

for (const [name, endpoint, required] of targets) {
  try {
    const data = await get(endpoint)
    await writeFile(join(OUT, name), JSON.stringify(data, null, 2) + '\n')

    if (name === 'file.json') {
      manifest.name = data.name
      manifest.lastModified = data.lastModified
      manifest.version = data.version
    }
    const meta = data.meta || {}
    const count =
      meta.styles?.length ??
      meta.components?.length ??
      meta.component_sets?.length ??
      (meta.variables && Object.keys(meta.variables).length) ??
      (data.nodes && `nodes: ${Object.keys(data.nodes).join(', ')}`)
    manifest.endpoints[name] = count === undefined ? 'ok' : count
    console.log(`✓ ${name}${count === undefined ? '' : `  (${count})`}`)
  } catch (err) {
    if (required) {
      console.error(`✗ ${name} — ${err.message}`)
      process.exit(1)
    }
    manifest.endpoints[name] = `skipped: ${err.message}`
    console.warn(`– ${name} — ${err.message} (skipped)`)
  }
}

if (IMAGE_DIR && NODE_IDS.length) {
  const dumpName = `node-${NODE_IDS.join('_').replace(/:/g, '-')}.json`
  const dump = JSON.parse(await readFile(join(OUT, dumpName), 'utf8'))

  // Collect every imageRef under the requested nodes, remembering the layer it
  // came from -- an imageRef alone tells you nothing about what it depicts.
  const refs = new Map()
  const visit = (n) => {
    for (const f of n.fills || []) {
      if (f.type === 'IMAGE' && f.imageRef && !refs.has(f.imageRef)) {
        refs.set(f.imageRef, `${n.name} [${n.id}]`)
      }
    }
    for (const c of n.children || []) visit(c)
  }
  for (const entry of Object.values(dump.nodes)) visit(entry.document)

  const { meta } = await get(`files/${FILE_KEY}/images`)
  const urls = meta?.images || {}
  const dir = isAbsolute(IMAGE_DIR) ? IMAGE_DIR : join(import.meta.dirname, '..', IMAGE_DIR)
  await mkdir(dir, { recursive: true })

  console.log(`\nDownloading ${refs.size} image fill(s) into ${IMAGE_DIR}`)
  const index = []
  for (const [ref, layer] of refs) {
    const url = urls[ref]
    if (!url) {
      console.warn(`– ${ref} — no URL returned (skipped) — ${layer}`)
      continue
    }
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`– ${ref} — ${res.status} ${res.statusText} (skipped)`)
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    // Figma serves whatever was uploaded; sniff the two that actually turn up.
    const ext = buf.subarray(0, 8).toString('hex').startsWith('89504e47') ? 'png' : 'jpg'
    const name = `${ref}.${ext}`
    await writeFile(join(dir, name), buf)
    index.push({ ref, file: name, layer, bytes: buf.length })
    console.log(`✓ ${name}  (${(buf.length / 1024).toFixed(0)} KB)  ${layer}`)
  }
  // Without this you have a folder of 40-hex-character filenames and no idea
  // which is which.
  await writeFile(join(dir, 'index.json'), JSON.stringify(index, null, 2) + '\n')
  manifest.images = { dir: IMAGE_DIR, downloaded: index.length, requested: refs.size }
}

if (NODES_ONLY) {
  // Keep the file-level facts from the last full pull rather than blanking them.
  try {
    const prev = JSON.parse(await readFile(join(OUT, 'manifest.json'), 'utf8'))
    manifest.name = prev.name
    manifest.lastModified = prev.lastModified
    manifest.version = prev.version
    manifest.endpoints = { ...prev.endpoints, ...manifest.endpoints }
  } catch {}
}
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
if (manifest.name) {
  console.log(`\n${manifest.name} · v${manifest.version} · modified ${manifest.lastModified}`)
}
console.log(`Wrote design/figma/ (${Object.keys(manifest.endpoints).length + 1} files)`)
