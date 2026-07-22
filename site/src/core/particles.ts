/**
 * PARTICLE TYPE — a number assembled from hundreds of small squares
 * that drift in from scatter and settle into the glyphs, keeping the
 * slightly ragged, printed edge of the reference. Scroll-driven.
 */

export interface ParticleTextHandle {
  /** 0 = fully scattered, 1 = settled into the glyphs */
  setProgress(p: number): void
  resize(): void
}

const EASE = (t: number) => 1 - Math.pow(1 - t, 3)

export function particleText(
  canvas: HTMLCanvasElement,
  text: string,
  color: string,
  opts: { font?: string; density?: number; sizeRatio?: number } = {},
): ParticleTextHandle {
  const ctx = canvas.getContext('2d')!
  let particles: {
    tx: number; ty: number
    sx: number; sy: number
    size: number
    delay: number
    jx: number; jy: number
    alpha: number
  }[] = []
  let W = 0
  let H = 0
  let progress = 0
  const dpr = Math.min(2, window.devicePixelRatio || 1)

  const build = () => {
    const box = canvas.getBoundingClientRect()
    if (box.width < 10) return
    W = box.width
    H = box.height
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // sample the glyphs offscreen
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const octx = off.getContext('2d')!
    const fontSize = H * (opts.sizeRatio ?? 0.82)
    octx.font = opts.font ?? `700 ${fontSize}px 'Space Grotesk', sans-serif`
    octx.textAlign = 'left'
    octx.textBaseline = 'middle'
    octx.fillText(text, W * 0.02, H * 0.52)
    const img = octx.getImageData(0, 0, W, H).data

    const step = opts.density ?? 3.5
    particles = []
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (img[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] > 120 && Math.random() < 0.85) {
          const spread = 1 - Math.random() * 0.15
          particles.push({
            tx: x + (Math.random() - 0.5) * step, // lightly ragged edge, still legible
            ty: y + (Math.random() - 0.5) * step,
            sx: W * 0.5 + (Math.random() - 0.5) * W * 1.15 * spread,
            sy: H * 0.5 + (Math.random() - 0.5) * H * 2.4 * spread,
            size: 1.6 + Math.random() * 1.8,
            delay: Math.random() * 0.35,
            jx: (Math.random() - 0.5) * 2,
            jy: (Math.random() - 0.5) * 2,
            alpha: 0.65 + Math.random() * 0.35,
          })
        }
      }
    }
    draw()
  }

  const draw = () => {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = color
    for (const pt of particles) {
      const local = Math.min(1, Math.max(0, (progress - pt.delay) / (1 - pt.delay)))
      const t = EASE(local)
      const x = pt.sx + (pt.tx - pt.sx) * t + pt.jx * (1 - t)
      const y = pt.sy + (pt.ty - pt.sy) * t + pt.jy * (1 - t)
      ctx.globalAlpha = pt.alpha * (0.25 + 0.75 * Math.min(1, local * 3))
      ctx.fillRect(x, y, pt.size, pt.size)
    }
    ctx.globalAlpha = 1
  }

  build()
  window.addEventListener('resize', build)

  return {
    setProgress(p: number) {
      progress = p
      draw()
    },
    resize: build,
  }
}
