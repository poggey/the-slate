/**
 * EFFECTS — the projector-beam dust motes over the dark world.
 * Code, not video: lighter, seamless, paused when invisible.
 */
import { REDUCED } from './motion'

/** Dust motes drifting through a single beam of projector light. */
export function initDust() {
  if (REDUCED) return
  const canvas = document.createElement('canvas')
  canvas.id = 'dust'
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', zIndex: '6',
    pointerEvents: 'none', opacity: '0',
    transition: 'opacity 0.9s ease',
  } as CSSStyleDeclaration)
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  interface Mote { x: number; y: number; r: number; vx: number; vy: number; a: number }
  let motes: Mote[] = []
  let running = false

  const size = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    motes = Array.from({ length: 70 }, () => ({
      x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.6,
      vx: 0.00004 + Math.random() * 0.00012, vy: -0.00003 + Math.random() * 0.00006,
      a: 0.08 + Math.random() * 0.3,
    }))
  }
  size()
  window.addEventListener('resize', size)

  const draw = () => {
    if (!running) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    // the beam: a faint cone from top-left toward centre-right
    const grad = ctx.createLinearGradient(0, 0, w * 0.9, h * 0.7)
    grad.addColorStop(0, 'rgba(200,210,235,0.05)')
    grad.addColorStop(1, 'rgba(200,210,235,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(-w * 0.05, -h * 0.1)
    ctx.lineTo(w * 1.05, h * 0.42)
    ctx.lineTo(w * 1.05, h * 0.78)
    ctx.lineTo(-w * 0.05, h * 0.25)
    ctx.closePath()
    ctx.fill()

    for (const m of motes) {
      m.x += m.vx; m.y += m.vy
      if (m.x > 1.02) m.x = -0.02
      if (m.y < -0.02) m.y = 1.02
      if (m.y > 1.02) m.y = -0.02
      // motes are brightest inside the beam band
      const beamY = 0.16 + m.x * 0.44
      const dist = Math.abs(m.y - beamY)
      const glow = Math.max(0, 1 - dist * 4)
      ctx.beginPath()
      ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(215,222,240,${(m.a * glow).toFixed(3)})`
      ctx.fill()
    }
    requestAnimationFrame(draw)
  }

  return {
    show() {
      canvas.style.opacity = '1'
      if (!running) { running = true; requestAnimationFrame(draw) }
    },
    hide() {
      canvas.style.opacity = '0'
      running = false
    },
  }
}
