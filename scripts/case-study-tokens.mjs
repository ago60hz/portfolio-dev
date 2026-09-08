// Distil the case-study design values out of the Figma snapshot.
//
//   node scripts/case-study-tokens.mjs
//
// Reads design/figma/file.json (pulled by figma-pull.mjs) and writes
// design/case-study.tokens.json -- the small, machine-readable subset the page
// actually renders. tests/e2e/case-study-fidelity.spec.ts asserts computed
// styles against that file, so when Praise moves something in Figma the loop is
// re-pull -> re-run this -> the fidelity test names the property that changed.
//
// Screenshots are deliberately not a source here. A render can be a version
// behind the file and look authoritative while it lies.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const doc = JSON.parse(readFileSync(join(ROOT, 'design/figma/file.json'), 'utf8')).document

const find = (id, n = doc) => {
  if (n.id === id) return n
  for (const c of n.children || []) { const r = find(id, c); if (r) return r }
}
const need = (id) => { const n = find(id); if (!n) throw new Error(`node ${id} missing -- re-run figma-pull.mjs`); return n }

const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
const fill = (n) => { const f = (n.fills || []).find((x) => x.visible !== false && x.type === 'SOLID'); return f ? hex(f.color) : null }
const stroke = (n) => { const s = (n.strokes || []).find((x) => x.visible !== false); return s ? { color: hex(s.color), opacity: s.opacity ?? 1, weight: n.strokeWeight, sides: n.individualStrokeWeights ?? null, dashes: n.strokeDashes ?? null } : null }
const type = (n) => ({
  family: n.style.fontFamily, weight: n.style.fontWeight, size: n.style.fontSize,
  lineHeight: Math.round(n.style.lineHeightPx * 100) / 100,
  letterSpacing: Math.round(n.style.letterSpacing * 100) / 100,
  color: fill(n),
})
const box = (n, origin) => ({
  x: Math.round((n.absoluteBoundingBox.x - origin.absoluteBoundingBox.x) * 10) / 10,
  y: Math.round((n.absoluteBoundingBox.y - origin.absoluteBoundingBox.y) * 10) / 10,
  w: Math.round(n.absoluteBoundingBox.width * 10) / 10,
  h: Math.round(n.absoluteBoundingBox.height * 10) / 10,
})

const win = need('25:665')
const ticks = need('35:313')

const tokens = {
  $source: 'Figma Qf9So7pT1dl36oVh98udnY node 25:664 "Homepage/ case_study"',
  $generatedBy: 'scripts/case-study-tokens.mjs',

  window: { ...box(win, win), surface: fill(win), border: stroke(win), radius: win.cornerRadius },

  header: { ...box(need('25:667'), win), border: stroke(need('25:667')),
    padding: { top: need('25:667').paddingTop, right: need('25:667').paddingRight, bottom: need('25:667').paddingBottom, left: need('25:667').paddingLeft } },

  breadcrumb: {
    gap: need('25:670').itemSpacing,
    chevron: box(need('25:671'), win),
    filterChip: { ...box(need('25:672'), win), fill: fill(need('25:672')), border: stroke(need('25:672')), radius: need('25:672').cornerRadius,
      padding: { top: need('25:672').paddingTop, right: need('25:672').paddingRight, bottom: need('25:672').paddingBottom, left: need('25:672').paddingLeft },
      text: type(need('25:674')) },
    separator: type(need('25:675')),
    studyChip: { fill: fill(need('25:676')), radius: need('25:676').cornerRadius, text: type(need('25:678')) },
  },

  column: { ...box(need('35:267'), win), rule: stroke(need('35:267')), paddingBottom: need('35:267').paddingBottom },

  masthead: { gap: need('35:244').itemSpacing, paddingBottom: need('35:244').paddingBottom,
    avatar: { ...box(need('26:236'), win), radius: need('26:236').cornerRadius, border: stroke(need('26:236')) },
    brandGap: need('32:242').itemSpacing,
    brandLine: type(need('26:240')),
    title: type(need('35:243')),
    hook: type(need('35:296')) },

  metaGrid: { ...box(need('35:266'), win),
    columnGap: Math.round((need('35:254').absoluteBoundingBox.x - need('35:245').absoluteBoundingBox.x - need('35:245').absoluteBoundingBox.width) * 10) / 10,
    rowGap: Math.round((need('35:258').absoluteBoundingBox.y - need('35:245').absoluteBoundingBox.y - need('35:245').absoluteBoundingBox.height) * 10) / 10,
    cellGap: need('35:245').itemSpacing,
    label: type(need('35:250')), value: type(need('35:251')) },

  media: { ...box(need('35:300'), win), radius: need('35:300').cornerRadius, border: stroke(need('35:300')),
    gapFromColumn: Math.round((need('35:300').absoluteBoundingBox.y - (need('35:267').absoluteBoundingBox.y + need('35:267').absoluteBoundingBox.height)) * 10) / 10 },

  rail: { ...box(need('35:338'), win),
    ticks: { ...box(ticks, win), pitch: ticks.itemSpacing,
      widths: ticks.children.map((c) => Math.round(c.absoluteBoundingBox.width)),
      color: stroke(ticks.children[0]).color, weight: stroke(ticks.children[0]).weight },
    label: type(need('35:320')),
    labelX: Math.round((need('35:320').absoluteBoundingBox.x - win.absoluteBoundingBox.x) * 10) / 10 },
}

// The tick widths are authored as a literal list. Reduce them to the rule the
// component implements, and fail loudly if the design stops matching it --
// silently rendering the wrong rail is worse than a broken build.
//
// A section tick is one that is WIDER THAN THE TICK BEFORE IT. That is what
// separates a real section marker from the decorative taper under the first
// one, which only ever decreases. Picking "wider than base" instead would read
// the whole opening ramp as eight sections.
const w = tokens.rail.ticks.widths
const counts = w.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map())
const base = [...counts].sort((a, b) => b[1] - a[1])[0][0]
const sectionIndices = w.map((x, i) => (i > 0 && x > w[i - 1] ? i : -1)).filter((i) => i > 0)
const sectionWidths = [...new Set(sectionIndices.map((i) => w[i]))]
if (sectionWidths.length > 1) throw new Error(`section ticks disagree: ${sectionWidths} -- the design changed shape, update ProgressRail`)

const rampEndsAt = w.findIndex((x, i) => i > 0 && x === base)
tokens.rail.rule = {
  base,
  section: sectionWidths[0] ?? null,
  first: w[0],
  ramp: w.slice(1, rampEndsAt + 1),
  sectionIndices: [0, ...sectionIndices],
}

writeFileSync(join(ROOT, 'design/case-study.tokens.json'), JSON.stringify(tokens, null, 2) + '\n')
console.log('wrote design/case-study.tokens.json')
const r = tokens.rail.rule
console.log(`  surface ${tokens.window.surface} · column ${tokens.column.w}`)
console.log(`  rail: base ${r.base} · section ${r.section} · first ${r.first} · pitch ${tokens.rail.ticks.pitch} · ramp [${r.ramp}] · sections at [${r.sectionIndices}]`)
