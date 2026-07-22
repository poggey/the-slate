/**
 * ACT III — DRAW THE LINE (the centrepiece)
 * The acclaim-vs-return scatter appears with no trend line.
 * The reader draws the relationship they expect; on release their
 * line ghosts as a pencil stroke and the real fit rises in brick,
 * with its confidence band and the verdict. Nothing communicates the
 * finding like being personally wrong on the record.
 *
 * Honesty note: the chart shows the raw bivariate fit computed from the
 * plotted points; the caption cites the full-model coefficient
 * (controls: budget, genre, year) from slate.json.
 */
import {
  scatterFilms, fitAcclaimLine, regression, metascoreTerm,
  acclaimPays, upliftPerTenMeta, sensitivity, betaRange, pMax, fmtNum,
} from '../core/data'
import { REDUCED } from '../core/motion'

const NS = 'http://www.w3.org/2000/svg'
const mk = (tag: string, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n as SVGElement
}

// chart domain
const X0 = 25, X1 = 100                 // metascore
const LY0 = Math.log(0.04), LY1 = Math.log(40) // ln(multiple)
const VB = { w: 1000, h: 520, l: 70, r: 30, t: 26, b: 48 }

const xToPx = (x: number) => VB.l + ((x - X0) / (X1 - X0)) * (VB.w - VB.l - VB.r)
const lyToPx = (ly: number) => VB.t + (1 - (ly - LY0) / (LY1 - LY0)) * (VB.h - VB.t - VB.b)

export function initDrawLine() {
  const svg = document.getElementById('dl-chart') as unknown as SVGSVGElement
  svg.setAttribute('viewBox', `0 0 ${VB.w} ${VB.h}`)
  const prompt = document.getElementById('dl-prompt')!
  const verdictEl = document.getElementById('dl-verdict')!
  const skipBtn = document.getElementById('dl-skip')!
  const retryBtn = document.getElementById('dl-retry')!

  /* ---- axes ---- */
  const axes = mk('g', { class: 'dl-axes' })
  ;[0.1, 0.25, 1, 4, 16].forEach((m) => {
    const y = lyToPx(Math.log(m))
    axes.appendChild(mk('line', {
      x1: VB.l, x2: VB.w - VB.r, y1: y, y2: y,
      class: m === 1 ? 'dl-grid dl-breakeven' : 'dl-grid',
    }))
    const t = mk('text', { x: VB.l - 10, y: y + 4, class: 'dl-tick', 'text-anchor': 'end' })
    t.textContent = m >= 1 ? `${m}×` : `${m}×`
    axes.appendChild(t)
  })
  ;[40, 60, 80, 100].forEach((x) => {
    const t = mk('text', { x: xToPx(x), y: VB.h - VB.b + 26, class: 'dl-tick', 'text-anchor': 'middle' })
    t.textContent = String(x)
    axes.appendChild(t)
  })
  const xl = mk('text', { x: (VB.l + VB.w - VB.r) / 2, y: VB.h - 6, class: 'dl-axis-label', 'text-anchor': 'middle' })
  xl.textContent = 'METASCORE →'
  const yl = mk('text', { x: 16, y: VB.t + 10, class: 'dl-axis-label' })
  yl.textContent = 'REVENUE MULTIPLE (LOG)'
  const be = mk('text', { x: VB.w - VB.r, y: lyToPx(0) - 8, class: 'dl-axis-label', 'text-anchor': 'end' })
  be.textContent = 'BREAK-EVEN'
  axes.append(xl, yl, be)
  svg.appendChild(axes)

  /* ---- points ----
     The dots open scattered at random across the frame, then find
     their true places — winners first, then the losers — under scroll. */
  const plotW = VB.w - VB.l - VB.r
  const plotBottom = VB.h - VB.b
  const randomPos = scatterFilms.map(() => ({
    x: VB.l + Math.random() * plotW,
    y: VB.t + Math.random() * (plotBottom - VB.t),
  }))

  const ptsG = mk('g', { class: 'dl-points' })
  const dots: SVGElement[] = scatterFilms.map((f, i) => {
    const start = REDUCED ? null : randomPos[i]
    const c = mk('circle', {
      cx: start ? start.x : xToPx(f.metascore as number),
      cy: start ? start.y : lyToPx(Math.log(f.revenue_multiple)),
      r: 5.5,
      class: `dl-dot ${f.profit_real >= 0 ? 'is-profit' : 'is-loss'}`,
    })
    const tip = mk('title')
    tip.textContent = `${f.title} (${f.year}) — Metascore ${f.metascore}, ${f.revenue_multiple.toFixed(2)}× multiple`
    c.appendChild(tip)
    ptsG.appendChild(c)
    return c
  })
  svg.appendChild(ptsG)

  if (!REDUCED) {
    // EVERY dot — green and red — travels for the WHOLE approach and
    // settles only at the exact moment the section top reaches the top
    // of the viewport (heading + chart fully on screen together).
    // No staggered starts: uniform, slow, continuous motion; the greens
    // touch down a breath before the reds at the very end.
    const morph = gsap.timeline({
      scrollTrigger: { trigger: '#drawline', start: 'top bottom', end: 'top top', scrub: 1.5 },
    })
    dots.forEach((d, i) => {
      const f = scatterFilms[i]
      const isProfit = f.profit_real >= 0
      morph.to(d, {
        attr: { cx: xToPx(f.metascore as number), cy: lyToPx(Math.log(f.revenue_multiple)) },
        ease: 'power1.inOut',
        duration: isProfit ? 0.94 : 1,
      }, 0)
    })
  }

  /* ---- drawing layer ---- */
  const userLine = mk('line', { class: 'dl-user-line', x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0 })
  svg.appendChild(userLine)

  const fit = fitAcclaimLine()
  const fx0 = X0 + 4, fx1 = X1 - 2
  const fitLine = mk('line', {
    class: 'dl-fit-line',
    x1: xToPx(fx0), y1: lyToPx(fit.intercept + fit.slope * fx0),
    x2: xToPx(fx1), y2: lyToPx(fit.intercept + fit.slope * fx1),
    opacity: 0,
  })
  // confidence band (±1.96 SE of the mean fit)
  const bandPts: string[] = []
  const upper: string[] = [], lower: string[] = []
  for (let x = fx0; x <= fx1; x += 5) {
    const y = fit.intercept + fit.slope * x
    const se = fit.seAt(x) * 1.96
    upper.push(`${xToPx(x)},${lyToPx(y + se)}`)
    lower.unshift(`${xToPx(x)},${lyToPx(y - se)}`)
  }
  bandPts.push(...upper, ...lower)
  const band = mk('polygon', { class: 'dl-band', points: bandPts.join(' '), opacity: 0 })
  svg.insertBefore(band, ptsG)
  svg.appendChild(fitLine)

  /* ---- interaction state machine ---- */
  let drawing = false
  let drawn = false
  let start: [number, number] | null = null

  const svgPoint = (e: PointerEvent): [number, number] => {
    const r = svg.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * VB.w, ((e.clientY - r.top) / r.height) * VB.h]
  }

  const reveal = (userSlope: number | null) => {
    if (drawn) return
    drawn = true
    prompt.style.opacity = '0'
    skipBtn.hidden = true
    retryBtn.hidden = false

    const realRises = fit.slope > 0
    let personal: string
    if (userSlope == null) personal = realRises
      ? 'No guess on the record. The line rises anyway.'
      : 'No guess on the record. The line falls.'
    else if (userSlope > 0 === realRises) personal = realRises
      ? 'You called it. Almost nobody does: acclaim <em>pays</em>.'
      : 'You called it: acclaim doesn’t pay.'
    else personal = realRises
      ? 'You drew art losing money. <em>The data disagrees.</em>'
      : 'You drew acclaim paying. The data disagrees.'

    verdictEl.innerHTML = `
      <p class="dl-personal">${personal}</p>
      <div class="dl-stats">
        <div class="dl-stat"><span class="micro">FULL-MODEL β · METASCORE</span>
          <span class="giant-num num">${metascoreTerm.coef > 0 ? '+' : '−'}${fmtNum(Math.abs(metascoreTerm.coef), 3)}</span>
          <span class="micro">PER POINT · p = ${fmtNum(metascoreTerm.p_value, 3)} · CONTROLS: BUDGET, GENRE, YEAR</span></div>
        <div class="dl-stat"><span class="micro">SPEARMAN ρ · ACCLAIM ↔ ROI</span>
          <span class="giant-num num">${regression.spearman_acclaim_roi.rho > 0 ? '+' : '−'}${fmtNum(Math.abs(regression.spearman_acclaim_roi.rho), 2)}</span>
          <span class="micro">p = ${fmtNum(regression.spearman_acclaim_roi.p_value, 3)} · N = ${regression.n}</span></div>
        <div class="dl-stat"><span class="micro">TEN METASCORE POINTS BUY</span>
          <span class="giant-num num">×${fmtNum(upliftPerTenMeta, 2)}</span>
          <span class="micro">ON THE REVENUE MULTIPLE</span></div>
      </div>
      <p class="dl-robust">${acclaimPays
        ? `Stress-tested across ${sensitivity.length} assumption scenarios: β never leaves <span class="num">${fmtNum(betaRange[0], 3)}–${fmtNum(betaRange[1], 3)}</span>, p never exceeds <span class="num">${fmtNum(pMax, 3)}</span>. The finding does not flip.`
        : 'The relationship is not robust across assumptions — see the credits.'}</p>`
    verdictEl.hidden = false
    // the reveal adds real page height; every trigger below (including the
    // final frame's pin) must re-measure or it fires at a stale position
    ScrollTrigger.refresh()

    if (REDUCED) {
      band.setAttribute('opacity', '1')
      fitLine.setAttribute('opacity', '1')
      return
    }
    const tl = gsap.timeline()
    tl.to(userLine, { opacity: 0.45, duration: 0.3 })
      .fromTo(fitLine, { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'slate' })
      .to(band, { opacity: 1, duration: 0.8 }, '-=0.4')
      .from(verdictEl.querySelectorAll('.dl-personal, .dl-stat, .dl-robust'), {
        y: 24, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'slate',
      }, '-=0.6')
  }

  svg.addEventListener('pointerdown', (e) => {
    if (drawn) return
    drawing = true
    start = svgPoint(e)
    userLine.setAttribute('x1', String(start[0]))
    userLine.setAttribute('y1', String(start[1]))
    userLine.setAttribute('x2', String(start[0]))
    userLine.setAttribute('y2', String(start[1]))
    userLine.setAttribute('opacity', '1')
    svg.setPointerCapture(e.pointerId)
  })
  svg.addEventListener('pointermove', (e) => {
    if (!drawing || !start) return
    const [x, y] = svgPoint(e)
    userLine.setAttribute('x2', String(x))
    userLine.setAttribute('y2', String(y))
  })
  svg.addEventListener('pointerup', () => {
    if (!drawing || !start) return
    drawing = false
    const x2 = Number(userLine.getAttribute('x2'))
    const y2 = Number(userLine.getAttribute('y2'))
    const dx = x2 - start[0]
    if (Math.abs(dx) < 40) { userLine.setAttribute('opacity', '0'); return } // a click, not a line
    // slope in data units (ln-multiple per metascore point); px y is inverted
    const slope = -(y2 - start[1]) / dx
    reveal(slope)
  })

  skipBtn.addEventListener('click', () => reveal(null))
  retryBtn.addEventListener('click', () => {
    drawn = false
    userLine.setAttribute('opacity', '0')
    gsap.set([fitLine, band], { opacity: 0 })
    verdictEl.hidden = true
    prompt.style.opacity = '1'
    retryBtn.hidden = true
    skipBtn.hidden = false
    ScrollTrigger.refresh() // height shrank back — re-measure again
  })

}
