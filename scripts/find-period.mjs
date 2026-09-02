import sharp from 'sharp'

const file = process.argv[2]
const axis = process.argv[3] || 'v'
const img = sharp(file).removeAlpha()
const { width: W, height: H } = await img.metadata()
const { data } = await img.raw().toBuffer({ resolveWithObject: true })
const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i+1], data[i+2]] }

const rowDiff = (a, b) => { let s = 0; for (let x = 0; x < W; x += 3) { const p = px(x,a), q = px(x,b); s += Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]) } return s / (Math.ceil(W/3)*3) }
const colDiff = (a, b) => { let s = 0; for (let y = 0; y < H; y += 3) { const p = px(a,y), q = px(b,y); s += Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]) } return s / (Math.ceil(H/3)*3) }

const N = axis === 'v' ? H : W
const diff = axis === 'v' ? rowDiff : colDiff
const results = []
for (let p = 40; p <= Math.floor(N / 2); p++) {
  let s = 0, n = 0
  for (let i = 0; i + p < N; i += Math.max(1, Math.floor(N / 60))) { s += diff(i, i + p); n++ }
  results.push([p, s / n])
}
results.sort((a, b) => a[1] - b[1])
console.log(`${file} axis=${axis} size=${W}x${H}`)
console.log('best periods (lower = better match):')
for (const [p, d] of results.slice(0, 8)) console.log(`  period ${p}px -> ${d.toFixed(3)}   (${(N/p).toFixed(2)} repeats fit)`)
