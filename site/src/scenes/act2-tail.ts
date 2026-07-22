/**
 * ACT II→III BRIDGE — THE TAIL, IN ONE FRAME
 * Every film is a chip stacked in its return bin. The mean/median
 * markers and the shaded gap between them put the whole argument
 * inside the chart; the outliers sit past an axis break. The chips
 * rain in under scroll — slowly — and the same formation re-sorts
 * into the acclaim scatter one scene later.
 *
 * The landing answers "who pays for it all": five gold profit bars
 * against one long red bar for everyone else combined.
 */
import {
  core, roiHistogram, topFive, topFiveShare, profitCore,
  distribution, fmtMoney, fmtPct,
} from '../core/data'
import { REDUCED } from '../core/motion'
import { particleText } from '../core/particles'

/** Bins shown in full; anything beyond goes after the axis break. */
const BREAK_AFTER = 9 // ROI +900%

export function initTail() {
  const chart = document.getElementById('tail-chart')!
  const bins = roiHistogram()
  const shown = bins.filter((b) => (b.x0 < BREAK_AFTER && b.n > 0) || b.x0 < 4)
  const outliers = bins.filter((b) => b.x0 >= BREAK_AFTER && b.n > 0)

  document.getElementById('tail-sub')!.innerHTML =
    `Under base-case assumptions, <strong class="num">${Math.round((1 - core.filter((f) => f.profit_real > 0).length / core.length) * 100)}%</strong> of the slate loses money.
     The median film returns <strong class="num">${fmtPct(distribution.median_roi)}</strong> — yet the mean is
     <strong class="num">${fmtPct(distribution.mean_roi)}</strong>. That gap <em>is</em> the business model.`

  const binEls: HTMLElement[] = []
  const mkBin = (x0: number, films: typeof core) => {
    const col = document.createElement('div')
    col.className = 'tbin'
    const count = films.length >= 5 ? `<span class="tbin-count num">${films.length} FILMS</span>` : ''
    col.innerHTML = `<div class="tbin-dots">${count}</div><span class="tbin-label micro num">${fmtPct(x0, 0)}</span>`
    const dots = col.querySelector('.tbin-dots')!
    films.forEach((f) => {
      const d = document.createElement('span')
      d.className = `tdot ${f.profit_real >= 0 ? 'is-profit' : 'is-loss'}`
      d.title = `${f.title} (${f.year}) · ${fmtPct(f.roi)}`
      dots.appendChild(d)
    })
    return col
  }

  shown.forEach((b) => { const el = mkBin(b.x0, b.films); binEls.push(el); chart.appendChild(el) })

  // Chip size derives from the tallest stack so it always fits the frame.
  const maxN = Math.max(...bins.map((b) => b.n))
  const sizeDots = () => {
    const h = chart.clientHeight - 46
    const size = Math.max(5, Math.min(13, Math.floor(h / maxN) - 3))
    chart.style.setProperty('--dot', `${size}px`)
  }
  sizeDots()
  window.addEventListener('resize', sizeDots)

  // the axis break, then the outliers
  const brk = document.createElement('div')
  brk.className = 'tbreak'
  brk.setAttribute('aria-hidden', 'true')
  brk.innerHTML = `<span></span><span></span>`
  chart.appendChild(brk)
  outliers.forEach((b) => {
    const col = mkBin(b.x0, b.films)
    col.classList.add('is-outlier')
    const name = document.createElement('span')
    name.className = 'tbin-name micro'
    name.textContent = b.films.map((f) => f.title).join(' · ')
    col.appendChild(name)
    chart.appendChild(col)
  })

  const zero = chart.querySelectorAll('.tbin')[1]
  if (zero) zero.classList.add('has-breakeven')

  /* ---- the argument, drawn into the chart: median, mean, the gap ---- */
  const markerX = (v: number): number | null => {
    const idx = Math.floor(v) + 1
    const el = binEls[idx]
    if (!el) return null
    return el.offsetLeft + (v - Math.floor(v)) * el.offsetWidth
  }
  const gapEl = document.createElement('div')
  gapEl.className = 'tail-gap'
  gapEl.setAttribute('aria-hidden', 'true')
  chart.appendChild(gapEl)
  const mkMarker = (cls: string, label: string) => {
    const m = document.createElement('div')
    m.className = `tail-marker ${cls}`
    m.innerHTML = `<span class="tail-marker-label micro">${label}</span>`
    chart.appendChild(m)
    return m
  }
  const medianEl = mkMarker('is-median', `MEDIAN ${fmtPct(distribution.median_roi)}`)
  const meanEl = mkMarker('is-mean', `MEAN ${fmtPct(distribution.mean_roi)}`)
  const placeMarkers = () => {
    const xMed = markerX(distribution.median_roi)
    const xMean = markerX(distribution.mean_roi)
    if (xMed == null || xMean == null) return
    medianEl.style.left = `${xMed}px`
    meanEl.style.left = `${xMean}px`
    gapEl.style.left = `${xMed}px`
    gapEl.style.width = `${xMean - xMed}px`
  }
  placeMarkers()
  window.addEventListener('resize', placeMarkers)
  ScrollTrigger.addEventListener('refresh', placeMarkers)

  document.getElementById('tail-caption')!.innerHTML =
    `EVERY CHIP IS A FILM · SKEWNESS ${distribution.skewness.toFixed(1)} · EXCESS KURTOSIS ${distribution.excess_kurtosis.toFixed(1)} · GINI OF PROFIT ${distribution.gini_profit.toFixed(2)}`

  /* ---- landing: who pays for everything ----
     The number itself is the picture: hundreds of particles drift in
     and settle into the share figure as the reader scrolls. */
  const share = Math.round(topFiveShare * 100)
  const statEl = document.getElementById('tail-stat')!
  statEl.innerHTML =
    `of every dollar of profit the portfolio ever made — earned by ` +
    `<span class="num">${Math.round((topFive.length / core.length) * 100)}%</span> of the slate. ` +
    `Everyone else, combined, lost money.`

  const canvas = document.getElementById('five-canvas') as HTMLCanvasElement
  const number = particleText(canvas, `${share}%`, '#e8b45a')
  if (REDUCED) {
    number.setProgress(1)
  } else {
    ScrollTrigger.create({
      trigger: canvas,
      start: 'top 92%',
      end: 'top 30%',
      scrub: 0.7,
      onUpdate: (self: any) => number.setProgress(self.progress),
    })
    ScrollTrigger.addEventListener('refresh', () => number.resize())
  }

  const bars = document.getElementById('five-bars')!
  const restProfit = profitCore - topFive.reduce((s, f) => s + f.profit_real, 0)
  const maxAbs = Math.max(Math.abs(restProfit), ...topFive.map((f) => f.profit_real))
  const row = (title: string, value: number, cls: string, rank?: string) => `
    <div class="fb-row ${cls}">
      <span class="fb-title micro">${rank ? `<span class="fb-rank num">${rank}</span>` : ''}${title}</span>
      <span class="fb-track"><span class="fb-bar" style="--w:${(Math.abs(value) / maxAbs) * 100}%"></span></span>
      <span class="fb-amount num">${value >= 0 ? '+' : '−'}${fmtMoney(Math.abs(value)).replace('−', '')}</span>
    </div>`
  bars.innerHTML =
    topFive.map((f, i) => row(f.title.toUpperCase(), f.profit_real, 'is-win', `0${i + 1}`)).join('') +
    row(`THE OTHER ${core.length - topFive.length}, COMBINED`, restProfit, 'is-rest')

  /* ---- motion: slow, scroll-scrubbed ---- */
  if (!REDUCED) {
    gsap.from('.tdot', {
      opacity: 0,
      y: -36,
      stagger: { each: 0.012, from: 'random' },
      ease: 'none',
      scrollTrigger: { trigger: chart, start: 'top 88%', end: 'top 28%', scrub: 0.7 },
    })
    gsap.from('.tail-marker, .tail-gap, .tbin-count', {
      opacity: 0,
      scrollTrigger: { trigger: chart, start: 'top 45%', end: 'top 25%', scrub: 0.7 },
    })
    gsap.from('.fb-bar', {
      scaleX: 0,
      transformOrigin: 'left',
      stagger: 0.12,
      ease: 'none',
      scrollTrigger: { trigger: bars, start: 'top 88%', end: 'top 45%', scrub: 0.7 },
    })
  }
}
