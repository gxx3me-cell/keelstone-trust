// Canvas chart helpers ported from the original Dashboard.dc.html.

export const chartData = {
  '1W': [505, 508, 503, 512, 518, 515, 527],
  '1M': [470, 478, 472, 485, 498, 492, 505, 515, 508, 520, 527],
  '3M': [410, 430, 420, 455, 448, 470, 465, 490, 505, 498, 520, 527],
  '1Y': [232, 250, 245, 280, 310, 300, 345, 380, 360, 420, 470, 505, 527],
  ALL: [100, 140, 130, 180, 235, 225, 300, 360, 345, 430, 500, 527],
}

export const perfData = {
  '6M': [420, 448, 470, 498, 512, 527],
  '1Y': [232, 260, 310, 345, 380, 430, 470, 505, 527],
  ALL: [100, 160, 235, 300, 360, 440, 500, 527],
}

export const barsData = [3.2, -1.4, 5.1, 2.8, -0.9, 4.4, 6.2, 1.8, -2.1, 3.9, 5.5, 2.4]

const donutSegs = [
  { v: 45.8, c: '#7c3aed' },
  { v: 24.3, c: '#6366f1' },
  { v: 12.0, c: '#ec4899' },
  { v: 10.4, c: '#14b8a6' },
  { v: 7.4, c: '#f59e0b' },
]

const palette = (rootEl) => {
  const cs = getComputedStyle(rootEl)
  return {
    border: cs.getPropertyValue('--border').trim() || '#ece4fb',
  }
}

const setupCanvas = (cv, h) => {
  const dpr = window.devicePixelRatio || 1
  const w = cv.clientWidth || cv.parentElement.clientWidth
  cv.width = w * dpr
  cv.height = h * dpr
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w, h }
}

const visible = (cv) => cv && cv.clientWidth > 0 && cv.offsetParent !== null

const smooth = (ctx, pts) => {
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 0; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2
    const yc = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc)
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
}

export const drawArea = (cv, data, prog, rootEl) => {
  if (!visible(cv)) return
  const { ctx, w, h } = setupCanvas(cv, cv.clientHeight || 230)
  const p = palette(rootEl)
  const padT = 18, padB = 18
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const n = data.length
  const pts = data.map((v, i) => ({ x: (i / (n - 1)) * w, y: padT + (1 - (v - min) / rng) * (h - padT - padB) }))
  const cut = Math.max(2, Math.floor(n * prog))
  const vis = pts.slice(0, cut)
  ctx.clearRect(0, 0, w, h)
  ctx.strokeStyle = p.border
  ctx.lineWidth = 1
  for (let g = 0; g <= 3; g++) {
    const y = padT + (g / 3) * (h - padT - padB)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'rgba(124,58,237,.32)')
  grad.addColorStop(1, 'rgba(124,58,237,0)')
  ctx.beginPath(); smooth(ctx, vis); ctx.lineTo(vis[vis.length - 1].x, h); ctx.lineTo(0, h); ctx.closePath()
  ctx.fillStyle = grad; ctx.fill()
  ctx.beginPath(); smooth(ctx, vis)
  const lg = ctx.createLinearGradient(0, 0, w, 0)
  lg.addColorStop(0, '#7c3aed'); lg.addColorStop(1, '#ec4899')
  ctx.strokeStyle = lg; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke()
  const last = vis[vis.length - 1]
  ctx.beginPath(); ctx.arc(last.x, last.y, 4.5, 0, 7); ctx.fillStyle = '#ec4899'; ctx.fill()
  ctx.beginPath(); ctx.arc(last.x, last.y, 8, 0, 7); ctx.strokeStyle = 'rgba(236,72,153,.3)'; ctx.lineWidth = 2; ctx.stroke()
}

export const drawDonut = (cv, prog) => {
  if (!visible(cv)) return
  const { ctx, w, h } = setupCanvas(cv, 180)
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 6, rin = r - 22
  ctx.clearRect(0, 0, w, h)
  let a = -Math.PI / 2
  const tot = 100
  donutSegs.forEach((s) => {
    const ang = (s.v / tot) * Math.PI * 2 * prog
    ctx.beginPath(); ctx.arc(cx, cy, r, a, a + ang); ctx.arc(cx, cy, rin, a + ang, a, true); ctx.closePath()
    ctx.fillStyle = s.c; ctx.fill()
    a += (s.v / tot) * Math.PI * 2
  })
}

export const drawBars = (cv, prog, rootEl) => {
  if (!visible(cv)) return
  const { ctx, w, h } = setupCanvas(cv, 200)
  const p = palette(rootEl)
  const n = barsData.length, gap = 8
  const bw = (w - gap * (n - 1)) / n
  const max = Math.max(...barsData.map(Math.abs))
  const zeroY = h * 0.62
  ctx.clearRect(0, 0, w, h)
  barsData.forEach((v, i) => {
    const x = i * (bw + gap)
    const bh = (Math.abs(v) / max) * (h * 0.42) * prog
    const y = v >= 0 ? zeroY - bh : zeroY
    ctx.fillStyle = v >= 0 ? '#7c3aed' : '#ec4899'
    const rr = Math.min(5, bw / 2)
    ctx.beginPath(); ctx.roundRect(x, y, bw, Math.max(bh, 1), rr); ctx.fill()
  })
  ctx.strokeStyle = p.border; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, zeroY); ctx.lineTo(w, zeroY); ctx.stroke()
}

export const drawSpark = (cv, data, color) => {
  if (!visible(cv)) return
  const { ctx, w, h } = setupCanvas(cv, cv.clientHeight || 32)
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: 4 + (1 - (v - min) / rng) * (h - 8) }))
  ctx.clearRect(0, 0, w, h)
  ctx.beginPath(); smooth(ctx, pts); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke()
}

export const animate = (fn, dur) => {
  const t0 = performance.now()
  const tick = (now) => {
    let p = Math.min((now - t0) / dur, 1)
    p = 1 - Math.pow(1 - p, 3)
    fn(p)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
