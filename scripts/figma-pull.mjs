// Pull raw design data from the Figma REST API into design/figma/.
//
//   FIGMA_TOKEN=... node scripts/figma-pull.mjs [fileKey] [nodeId ...]
//
// fileKey defaults to FIGMA_FILE_KEY or the "IJO DISCO / File" key recorded in
// design/spec.md. Extra args are node ids (from a Figma link's node-id=1-189,
// written either 1-189 or 1:189) — each is dumped on its own as node-<id>.json
// via the /nodes endpoint, in addition to the whole-file cache.
//
// Token is a personal access token (Figma > Settings > Security). For
// variables.json add the file_variables:read scope. Output is raw JSON —
// design/spec.md stays the curated prose layer on top.

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const TOKEN = process.env.FIGMA_TOKEN
const args = process.argv.slice(2)
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
const targets = [
  ['file.json', `files/${FILE_KEY}`, true],
  ['styles.json', `files/${FILE_KEY}/styles`, true],
  ['components.json', `files/${FILE_KEY}/components`, true],
  ['component_sets.json', `files/${FILE_KEY}/component_sets`, true],
  ['variables.json', `files/${FILE_KEY}/variables/local`, false],
]

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

await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`\n${manifest.name} · v${manifest.version} · modified ${manifest.lastModified}`)
console.log(`Wrote design/figma/ (${Object.keys(manifest.endpoints).length + 1} files)`)
