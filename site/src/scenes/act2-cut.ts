/**
 * ACT II — THE CUT: WHERE THE MONEY GOES
 * A waterfall the reader can follow without a caption: ticket money
 * enters at the left, each column falls (or rises) to the next level,
 * and what's left at the right is the studio's profit. The bars are
 * built from chip-courses (the site's money texture), reference lines
 * carry the three key levels across the frame, and the whole diagram
 * sizes itself to fill the pinned viewport. Rates from slate.json.
 */
import { meta, distribution, fmtPct } from '../core/data'
import { REDUCED } from '../core/motion'
import { setTickerContext } from '../core/ticker'

const A = meta.assumptions
const GROSS = 100
const DOM = 60
const INTL = 40
const THEATRES = DOM * (1 - A.r_dom) + INTL * (1 - A.r_intl) // 54 stays with cinemas
const RENTALS = GROSS - THEATRES                             // 46 reaches the studio
const ANCILLARY = RENTALS * A.a                              // +23 downstream
const REVENUE = RENTALS + ANCILLARY                          // 69
const BUDGET = 20
const PA = BUDGET * A.k_wide                                 // marketing ≈ budget
const PROFIT = REVENUE - BUDGET - PA                         // 29 — and that was a hit

interface Step {
  name: string
  sub: string
  from: number
  to: number
  kind: 'in' | 'down' | 'up' | 'out'
}

const STEPS: Step[] = [
  { name: 'TICKET MONEY', sub: 'worldwide box office', from: 0, to: GROSS, kind: 'in' },
  { name: 'THEATRES KEEP', sub: 'the house’s share', from: GROSS, to: RENTALS, kind: 'down' },
  { name: 'HOME & STREAMING', sub: 'life after cinemas', from: RENTALS, to: REVENUE, kind: 'up' },
  { name: 'MAKING THE FILM', sub: 'production budget', from: REVENUE, to: REVENUE - BUDGET, kind: 'down' },
  { name: 'SELLING THE FILM', sub: 'marketing ≈ budget', from: REVENUE - BUDGET, to: PROFIT, kind: 'down' },
  { name: 'A24 KEEPS', sub: 'the sliver', from: 0, to: PROFIT, kind: 'out' },
]

const NS = 'http://www.w3.org/2000/svg'
const mk = (tag: string, attrs: Record<string, string | number> = {}, text?: string) => {
  const n = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  if (text != null) n.textContent = text
  return n as SVGElement
}

export function initCut() {
  const stage = document.getElementById('cut-stage')!
  const wrap = document.createElement('div')
  wrap.className = 'wf-wrap'
  stage.appendChild(wrap)

  const punch = document.createElement('p')
  punch.className = 'cut-punch serif'
  punch.innerHTML =
    `A <strong class="num">$${GROSS}M</strong> hit nets <strong class="num">$${PROFIT}M</strong>.` +
    ` <span class="cut-punch-2">And that was a <em>hit</em> — the median A24 film returned <strong class="num">${fmtPct(distribution.median_roi)}</strong>.` +
    ` Rates are the register's base case (A1–A5), stress-tested in the credits.</span>`
  stage.appendChild(punch)

  /* ---- geometry: the viewBox adopts the frame's real aspect, so the
     waterfall always fills the pinned viewport edge to edge ---- */
  const box = wrap.getBoundingClientRect()
  const aspect = box.width > 100 && box.height > 100 ? box.height / box.width : 0.42
  const VB = {
    w: 1000,
    h: Math.round(1000 * Math.min(Math.max(aspect, 0.32), 0.52)),
    l: 10, r: 64, t: 52, b: 64,
  }

  const svg = mk('svg', {
    id: 'cut-waterfall',
    viewBox: `0 0 ${VB.w} ${VB.h}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': `Waterfall of a $${GROSS}M gross: theatres keep $${THEATRES}M, home and streaming add $${ANCILLARY}M, production costs $${BUDGET}M and marketing $${PA}M, leaving A24 $${PROFIT}M.`,
  }) as unknown as SVGSVGElement
  wrap.appendChild(svg)

  // chip-course texture — same money-language as the stakes chart
  const defs = mk('defs')
  const pat = mk('pattern', { id: 'wf-chip', width: 10, height: 9, patternUnits: 'userSpaceOnUse' })
  pat.appendChild(mk('rect', { y: 7, width: 10, height: 2, fill: 'rgba(0,0,0,0.4)' }))
  defs.appendChild(pat)
  svg.appendChild(defs)

  const plotH = VB.h - VB.t - VB.b
  const yAt = (v: number) => VB.t + (1 - v / GROSS) * plotH
  const n = STEPS.length
  const gap = 22
  const colW = (VB.w - VB.l - VB.r - gap * (n - 1)) / n
  const xAt = (i: number) => VB.l + i * (colW + gap)

  /* reference levels carried across the whole frame */
  const REFS = [
    { v: GROSS, cls: 'wf-ref' },
    { v: RENTALS, cls: 'wf-ref' },
    { v: PROFIT, cls: 'wf-ref wf-ref--profit' },
  ]
  REFS.forEach((r) => {
    svg.appendChild(mk('line', { class: r.cls, x1: VB.l, y1: yAt(r.v), x2: VB.w - VB.r + 14, y2: yAt(r.v) }))
    svg.appendChild(mk('text', {
      class: 'wf-ref-label num', x: VB.w - VB.r + 20, y: yAt(r.v) + 4,
    }, `${Math.round((r.v / GROSS) * 100)}%`))
  })

  const groups: SVGElement[] = []
  const connectors: SVGElement[] = []

  STEPS.forEach((s, i) => {
    const g = mk('g', { class: `wf-step wf-${s.kind}` })
    const top = yAt(Math.max(s.from, s.to))
    const h = Math.abs(yAt(s.from) - yAt(s.to))
    const grows = s.to > s.from || s.kind === 'in' || s.kind === 'out'

    // the column: solid fill + chip-course texture, animated as one
    const barWrap = mk('g', { class: 'wf-barwrap', 'data-origin': grows ? 'bottom' : 'top' })
    barWrap.appendChild(mk('rect', {
      class: 'wf-bar', x: xAt(i), y: top, width: colW, height: Math.max(h, 2), rx: 3,
    }))
    barWrap.appendChild(mk('rect', {
      class: 'wf-bar-tex', x: xAt(i), y: top, width: colW, height: Math.max(h, 2), rx: 3,
      fill: 'url(#wf-chip)',
    }))
    g.appendChild(barWrap)

    if (s.kind === 'down' || s.kind === 'up') {
      const ax = xAt(i) + colW / 2
      const [y1, y2] = s.kind === 'down' ? [top, top + h - 8] : [top + h, top + 8]
      g.appendChild(mk('line', { class: 'wf-arrow', x1: ax, y1, x2: ax, y2 }))
      g.appendChild(mk('path', {
        class: 'wf-arrow-head',
        d: s.kind === 'down'
          ? `M${ax - 5} ${y2 - 6} L${ax} ${y2} L${ax + 5} ${y2 - 6}`
          : `M${ax - 5} ${y2 + 6} L${ax} ${y2} L${ax + 5} ${y2 + 6}`,
      }))
    }
    const value = s.kind === 'in' || s.kind === 'out' ? `$${s.to}M`
      : `${s.to > s.from ? '+' : '−'}$${Math.abs(s.to - s.from)}M`
    g.appendChild(mk('text', {
      class: 'wf-value num', x: xAt(i) + colW / 2, y: top - 12, 'text-anchor': 'middle',
    }, value))
    g.appendChild(mk('text', {
      class: 'wf-name', x: xAt(i) + colW / 2, y: VB.h - VB.b + 26, 'text-anchor': 'middle',
    }, s.name))
    g.appendChild(mk('text', {
      class: 'wf-sub', x: xAt(i) + colW / 2, y: VB.h - VB.b + 44, 'text-anchor': 'middle',
    }, s.sub))
    svg.appendChild(g)
    groups.push(g)

    if (i < n - 1) {
      const y = i === n - 2 ? yAt(PROFIT) : yAt(STEPS[i].to)
      const c = mk('line', {
        class: 'wf-connector',
        x1: xAt(i) + colW, y1: y, x2: xAt(i + 1), y2: y,
      })
      svg.appendChild(c)
      connectors.push(c)
    }
  })

  svg.appendChild(mk('line', {
    class: 'wf-base', x1: VB.l, y1: yAt(0), x2: VB.w - VB.r + 14, y2: yAt(0),
  }))

  if (REDUCED) return

  /* ---- the scrubbed build: one column per beat ---- */
  groups.forEach((g) => {
    const bar = g.querySelector('.wf-barwrap') as SVGElement
    gsap.set(bar, { scaleY: 0, transformOrigin: `center ${bar.getAttribute('data-origin')}` })
    gsap.set(g.querySelectorAll('.wf-value, .wf-name, .wf-sub, .wf-arrow, .wf-arrow-head'), { opacity: 0 })
  })
  gsap.set(connectors, { scaleX: 0, transformOrigin: 'left center' })
  gsap.set(punch, { autoAlpha: 0, y: 24 })

  const tl = gsap.timeline({
    defaults: { ease: 'snap', duration: 0.8 },
    scrollTrigger: {
      trigger: '#cut',
      start: 'top top',
      end: '+=220%',
      pin: '.cut-viewport',
      scrub: 0.6,
      anticipatePin: 1,
      snap: { snapTo: 'labelsDirectional', duration: 0.4, ease: 'power2.inOut' },
      onUpdate: (self: any) => {
        const k = Math.min(n - 1, Math.floor(self.progress * (n + 0.6)))
        const s = STEPS[k]
        setTickerContext(`FOLLOWING THE MONEY · <span class="tick-val">${s.name} ${s.kind === 'in' || s.kind === 'out' ? `$${s.to}M` : `$${s.to}M LEFT`}</span>`)
      },
    },
  })

  groups.forEach((g, i) => {
    const bar = g.querySelector('.wf-barwrap')
    tl.addLabel(`s${i}`)
      .to(bar, { scaleY: 1 })
      .to(g.querySelectorAll('.wf-value, .wf-name, .wf-sub'), { opacity: 1, duration: 0.4 }, '<+=0.3')
    const arrows = g.querySelectorAll('.wf-arrow, .wf-arrow-head')
    if (arrows.length) tl.to(arrows, { opacity: 0.8, duration: 0.3 }, '<')
    if (connectors[i]) tl.to(connectors[i], { scaleX: 1, duration: 0.4 }, '>-0.1')
  })
  tl.addLabel('punch').to(punch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'slate' })
}
