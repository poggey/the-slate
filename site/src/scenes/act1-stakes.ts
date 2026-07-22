/**
 * ACT I — THE STAKES
 * Every film is a stack of $10M chips (capital at risk), in release
 * order: the reader literally watches the stakes rise across a decade,
 * which foreshadows Act III's villain. Green stacks came back with
 * profit; red didn't. Sortable by year / return, tap for the receipt.
 */
import { core, topFive, Film, fmtMoney, fmtPct, bindAll } from '../core/data'
import { REDUCED, revealLines } from '../core/motion'
import { setTickerContext } from '../core/ticker'

const CHIP_USD = 10e6

function cardHtml(f: Film): string {
  const quad: Record<string, string> = {
    dream: 'The dream — acclaimed and profitable',
    subsidised: 'Subsidised prestige — acclaimed, unprofitable',
    cashcow: 'The cash cow — unloved, profitable',
    miss: 'The miss — unloved, unprofitable',
  }
  return `
    <button class="film-card-close" aria-label="Close">×</button>
    <p class="fc-quad micro">${f.quadrant ? quad[f.quadrant] : '—'}</p>
    <p class="fc-title display">${f.title}</p>
    <p class="fc-meta micro">${f.year} · ${f.primary_genre.toUpperCase()}${f.festival_premiere ? ' · ' + String(f.festival_premiere).toUpperCase() : ''}${f.metascore != null ? ' · METASCORE ' + f.metascore : ''}</p>
    <div class="fc-rows">
      <div class="fc-row"><span>Capital at risk</span><span class="leader"></span><span class="num">${fmtMoney(f.cost_real)}</span></div>
      <div class="fc-row"><span>Came back</span><span class="leader"></span><span class="num">${fmtMoney(f.studio_revenue_real)}</span></div>
      <div class="fc-row fc-roi ${f.profit_real >= 0 ? 'is-profit' : 'is-loss'}"><span>Return</span><span class="leader"></span><span class="num">${fmtPct(f.roi)}</span></div>
    </div>`
}

export function initStakes() {
  bindAll()
  revealLines('#thesis-fragments .fragment', { stagger: 0.12 })

  const chart = document.getElementById('stakes-chart')!
  const card = document.getElementById('film-card')!
  const winners = new Set(topFive)

  /* ---- build the stacks ---- */
  let lastYear = 0
  const stacks = core.map((f, i) => {
    const col = document.createElement('button')
    col.className = `stack ${f.profit_real >= 0 ? 'is-profit' : 'is-loss'}${winners.has(f) ? ' is-winner' : ''}`
    col.dataset.i = String(i)
    col.setAttribute('aria-label',
      `${f.title}, ${f.year}. ${fmtMoney(f.cost_real)} at risk, returned ${fmtPct(f.roi)}.`)
    const nChips = Math.max(1, Math.round(f.cost_real / CHIP_USD))
    let chips = ''
    for (let c = 0; c < nChips; c++) chips += '<span class="chip"></span>'
    const yearLabel = f.year !== lastYear
      ? `<span class="stack-year micro num">’${String(f.year).slice(2)}</span>` : ''
    lastYear = f.year
    col.innerHTML = `<span class="stack-chips">${chips}</span>${yearLabel}${winners.has(f) ? '<span class="stack-star" title="One of the five that paid for everything">★</span>' : ''}`
    chart.appendChild(col)
    return col
  })

  /* the foreshadowing note: how much the average bet grew */
  const years = [...new Set(core.map((f) => f.year))].sort()
  const avgCost = (y: number) => {
    const fs = core.filter((f) => f.year === y)
    return fs.reduce((s, f) => s + f.cost_real, 0) / fs.length
  }
  const firstAvg = avgCost(years[0])
  const lastFull = years[years.length - 2] // last complete-ish year
  const lastAvg = avgCost(lastFull)
  document.getElementById('stakes-note')!.innerHTML =
    `The average bet grew from <strong class="num">${fmtMoney(firstAvg)}</strong> in ${years[0]} to ` +
    `<strong class="num">${fmtMoney(lastAvg)}</strong> in ${lastFull} — <strong class="num">${(lastAvg / firstAvg).toFixed(1)}×</strong> the stake. Remember that.`

  /* ---- detail card ---- */
  let pinned = -1
  const hideCard = () => {
    pinned = -1
    card.hidden = true
    stacks.forEach((p) => p.classList.remove('is-pinned'))
  }
  const showCard = (i: number) => {
    pinned = i
    card.innerHTML = cardHtml(core[i])
    card.hidden = false
    stacks.forEach((p, j) => p.classList.toggle('is-pinned', j === i))
    card.querySelector('.film-card-close')!.addEventListener('click', hideCard)
    if (!REDUCED) gsap.from(card, { y: 14, opacity: 0, duration: 0.35, ease: 'slate' })
  }
  stacks.forEach((p, i) => {
    p.addEventListener('click', (e) => {
      e.stopPropagation()
      pinned === i ? hideCard() : showCard(i)
    })
    p.addEventListener('pointerenter', () => {
      const f = core[i]
      setTickerContext(`ON THE TABLE · ${f.title.toUpperCase()} · ${fmtMoney(f.cost_real)} · <span class="tick-val">${fmtPct(f.roi)}</span>`)
    })
  })
  document.addEventListener('click', (e) => {
    if (!card.hidden && !card.contains(e.target as Node)) hideCard()
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCard() })

  /* ---- sort with a manual FLIP (year ↔ return) ---- */
  const byYear = [...core.keys()]
  const byRoi = [...core.keys()].sort((a, b) => core[b].roi - core[a].roi)
  const applySort = (mode: 'year' | 'roi') => {
    const order = mode === 'year' ? byYear : byRoi
    chart.classList.toggle('is-sorted-roi', mode === 'roi')
    gsap.set('.stack .chip', { scaleY: 1, opacity: 1, overwrite: true })
    const first = REDUCED ? null : stacks.map((p) => p.getBoundingClientRect())
    order.forEach((filmIdx, pos) => { stacks[filmIdx].style.order = String(pos) })
    if (REDUCED || !first) return
    const last = stacks.map((p) => p.getBoundingClientRect())
    stacks.forEach((p, i) => {
      const dx = first[i].left - last[i].left
      gsap.fromTo(p, { x: dx }, { x: 0, duration: 0.7, ease: 'slate' })
    })
  }
  document.querySelectorAll<HTMLButtonElement>('.wall-sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wall-sort-btn').forEach((b) => b.classList.remove('is-active'))
      btn.classList.add('is-active')
      hideCard()
      applySort(btn.dataset.sort as 'year' | 'roi')
    })
  })

  /* ---- entrance: the chips stack up under scroll ---- */
  if (!REDUCED) {
    gsap.from('.stack .chip', {
      scaleY: 0,
      opacity: 0,
      transformOrigin: 'bottom',
      stagger: { each: 0.004, from: 'start' },
      ease: 'none',
      scrollTrigger: {
        trigger: chart,
        start: 'top 88%',
        end: 'top 30%',
        scrub: 0.6,
      },
    })
  }
}
