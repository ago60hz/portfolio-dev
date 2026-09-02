import sharp from 'sharp'

async function analyse(file) {
  const img = sharp(file).removeAlpha()
  const { width: W, height: H } = await img.metadata()
  const { data } = await img.raw().toBuffer({ resolveWithObject: true })
  const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i+1], data[i+2]] }
  const colDiff = (a, b) => { let s = 0; for (let y = 0; y < H; y++) { const p = px(a,y), q = px(b,y); s += Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]) } return s/(H*3) }
  const rowDiff = (a, b) => { let s = 0; for (let x = 0; x < W; x++) { const p = px(x,a), q = px(x,b); s += Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]) } return s/(W*3) }
  const avg = a => a.reduce((x,y)=>x+y,0)/a.length
  const baseCol = avg([0.25,0.5,0.75].map(f => colDiff(Math.floor(W*f), Math.floor(W*f)+1)))
  const baseRow = avg([0.25,0.5,0.75].map(f => rowDiff(Math.floor(H*f), Math.floor(H*f)+1)))
  const hSeam = colDiff(W-1, 0), vSeam = rowDiff(H-1, 0)
  const verdict = (s, b) => s <= b * 2 ? 'SEAMLESS' : s <= b * 5 ? 'slight seam' : 'VISIBLE SEAM'
  console.log(`\n${file}  ${W}x${H}`)
  console.log(`  horizontal: ${hSeam.toFixed(2)} vs baseline ${baseCol.toFixed(2)}  -> ${verdict(hSeam, baseCol)}`)
  console.log(`  vertical  : ${vSeam.toFixed(2)} vs baseline ${baseRow.toFixed(2)}  -> ${verdict(vSeam, baseRow)}`)
}
for (const f of process.argv.slice(2)) await analyse(f)
