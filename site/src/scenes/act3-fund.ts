/**
 * ACT III — THE FUND'S TRACK RECORD
 * If A24 were a fund: the cumulative value of a dollar riding every
 * slate, year by year (log scale — honest about the collapse).
 * The Reel becomes the curve itself. Peak, then the drawdown.
 * Data: slate_timeseries in slate.json.
 */
import { timeseries, portfolio, peakFund, lastFund, fmtMoney, fmtMult, fmtNum, fmtPct } from '../core/data'
import { REDUCED } from '../core/motion'

const NS = 'http://www.w3.org/2000/svg'
const mk = (tag: string, attrs: Record<string, string | number> = {}) => {
  const n = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  return n as SVGElement
}

const VB = { w: 1000, h: 430, l: 56, r: 36, t: 48, b: 40 }
const LMIN = Math.log(0.08)
const LMAX = Math.log(100)

export function initFund() {
  const svg = document.getElementById('fund-chart') as unknown as SVGSVGElement
  svg.setAttribute('viewBox', `0 0 ${VB.w} ${VB.h}`)

  const years = timeseries.map((t) => t.year)
  const xAt = (year: number) =>
    VB.l + ((year - years[0]) / (years[years.length - 1] - years[0])) * (VB.w - VB.l - VB.r)
  const yAt = (v: number) =>
    VB.t + (1 - (Math.log(Math.max(v, 0.08)) - LMIN) / (LMAX - LMIN)) * (VB.h - VB.t - VB.b)

  // gridlines at 0.1×, 1×, 10×, 100×
  ;[0.1, 1, 10, 100].forEach((m) => {
    svg.appendChild(mk('line', {
      x1: VB.l, x2: VB.w - VB.r, y1: yAt(m), y2: yAt(m),
      class: m === 1 ? 'dl-grid dl-breakeven' : 'dl-grid',
    }))
    const t = mk('text', { x: VB.l - 8, y: yAt(m) + 4, class: 'dl-tick', 'text-anchor': 'end' })
    t.textContent = `${m}×`
    svg.appendChild(t)
  })
  years.forEach((y) => {
    if (y % 3 !== 0 && y !== years[years.length - 1]) return
    const t = mk('text', { x: xAt(y), y: VB.h - 12, class: 'dl-tick', 'text-anchor': 'middle' })
    t.textContent = `’${String(y).slice(2)}`
    svg.appendChild(t)
  })

  /* the drawdown era, shaded: from the peak to the last year */
  const defs = mk('defs')
  const grad = mk('linearGradient', { id: 'fund-area-grad', x1: 0, y1: 0, x2: 0, y2: 1 })
  grad.appendChild(mk('stop', { offset: '0%', 'stop-color': '#e8b45a', 'stop-opacity': 0.2 }))
  grad.appendChild(mk('stop', { offset: '100%', 'stop-color': '#e8b45a', 'stop-opacity': 0 }))
  defs.appendChild(grad)
  svg.appendChild(defs)

  svg.appendChild(mk('rect', {
    class: 'fund-drawdown-zone',
    x: xAt(peakFund.year), y: VB.t,
    width: xAt(lastFund.year) - xAt(peakFund.year), height: VB.h - VB.t - VB.b,
  }))
  const zoneLabel = mk('text', {
    class: 'fund-era num',
    x: xAt(peakFund.year) + 14, y: VB.h - VB.b - 14,
  })
  zoneLabel.textContent = 'THE SCALE-UP ERA'
  svg.appendChild(zoneLabel)

  // the curve + the area beneath it
  const line = timeseries.map((t, i) =>
    `${i === 0 ? 'M' : 'L'}${xAt(t.year).toFixed(1)} ${yAt(t.cumulative_fund_value).toFixed(1)}`).join('')
  const baseline = yAt(0.08)
  svg.appendChild(mk('path', {
    class: 'fund-area',
    d: `${line}L${xAt(lastFund.year).toFixed(1)} ${baseline}L${xAt(timeseries[0].year).toFixed(1)} ${baseline}Z`,
  }))
  svg.appendChild(mk('path', { d: line, class: 'fund-path' }))
  timeseries.forEach((t) => {
    const c = mk('circle', { cx: xAt(t.year), cy: yAt(t.cumulative_fund_value), r: 5, class: 'fund-dot' })
    const tip = mk('title')
    tip.textContent = `${t.year}: ${t.n} films, slate return ${fmtPct(t.slate_return)}, fund value ${fmtMult(t.cumulative_fund_value, 2)}`
    c.appendChild(tip)
    svg.appendChild(c)
  })

  // story annotations: the peak, the biggest write-off, the floor
  const peakT = mk('text', { x: xAt(peakFund.year), y: yAt(peakFund.cumulative_fund_value) - 14, class: 'fund-ann num', 'text-anchor': 'middle' })
  peakT.textContent = `PEAK ${fmtMult(peakFund.cumulative_fund_value, 1)} · ${peakFund.year}`
  svg.appendChild(peakT)

  const worst = timeseries.reduce((a, b) => (b.profit < a.profit ? b : a))
  const lastT = mk('text', { x: xAt(lastFund.year) - 10, y: yAt(lastFund.cumulative_fund_value) + 26, class: 'fund-ann fund-ann--loss num', 'text-anchor': 'end' })
  lastT.textContent = worst.year === lastFund.year
    ? `${fmtMult(lastFund.cumulative_fund_value, 2)} · ${lastFund.year} · −${fmtMoney(Math.abs(worst.profit))} THAT YEAR`
    : `${fmtMult(lastFund.cumulative_fund_value, 2)} · ${lastFund.year}`
  svg.appendChild(lastT)
  if (worst.year !== lastFund.year) {
    const wx = xAt(worst.year)
    const wy = yAt(worst.cumulative_fund_value)
    svg.appendChild(mk('line', { class: 'fund-flag-line', x1: wx, y1: wy + 8, x2: wx, y2: wy + 40 }))
    const worstT = mk('text', { class: 'fund-ann fund-ann--loss num', x: wx - 8, y: wy + 52, 'text-anchor': 'end' })
    worstT.textContent = `’${String(worst.year).slice(2)} SLATE · −${fmtMoney(Math.abs(worst.profit))}`
    svg.appendChild(worstT)
  }

  const callout = document.getElementById('fund-callout')!
  callout.innerHTML = `
    <p class="fund-drawdown"><span class="giant-num num">−${(portfolio.max_drawdown * 100).toFixed(1)}%</span>
      <span class="mono-label">MAXIMUM DRAWDOWN</span></p>
    <ul class="fund-stats micro num">
      <li>SHARPE (FILM-LEVEL ANALOGUE) <span class="leader"></span> ${fmtNum(portfolio.sharpe_analogue_film, 2)}</li>
      <li>SHARPE (ANNUAL SLATES, TRUE TIME-SERIES) <span class="leader"></span> ${fmtNum(portfolio.sharpe_timeseries_year, 2)}</li>
      <li>SORTINO (DOWNSIDE-ADJUSTED) <span class="leader"></span> ${fmtNum(portfolio.sortino, 2)}</li>
      <li>VALUE AT RISK · 5TH PERCENTILE FILM <span class="leader"></span> ${fmtPct(portfolio.var_5pct_roi)}</li>
    </ul>
    <p class="fund-caption">A dollar riding every slate peaked at <strong class="num">${fmtMult(peakFund.cumulative_fund_value, 1)}</strong> in ${peakFund.year} —
      the prestige years minted money at venture-fund rates. Then the budgets grew.</p>`

  if (!REDUCED) {
    // the decade draws itself, slowly, under the reader's thumb
    gsap.from('.fund-path', {
      drawSVG: '0%', ease: 'none',
      scrollTrigger: { trigger: '#fund', start: 'top 80%', end: 'center 35%', scrub: 0.8 },
    })
    gsap.from('.fund-area, .fund-drawdown-zone, .fund-era', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#fund', start: 'top 55%', end: 'center 40%', scrub: 0.8 },
    })
    gsap.from('.fund-dot', {
      scale: 0, transformOrigin: 'center', stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: '#fund', start: 'top 70%', end: 'center 40%', scrub: 0.8 },
    })
    gsap.from(callout, {
      opacity: 0, y: 30, duration: 0.7, ease: 'slate',
      scrollTrigger: { trigger: callout, start: 'top 85%' },
    })
  }

}
