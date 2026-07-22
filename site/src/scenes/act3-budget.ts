/**
 * ACT III — THE COUNTER-PUNCH: SCALE
 * The style guide's knockout device, pointed at the villain. The word
 * SCALE is cut out of the frame as a mask; inside the letterforms all
 * 58 core films rise as budget bars, cheapest to dearest, the greens
 * thinning out and the reds taking over as the bets grow. The word is
 * the chart. Beneath it, the honest ledger: the three budget bands as
 * dot-leader certificate rows, and the model's strongest coefficient.
 */
import { core, portfolio, budgetTerm, horrorTerm, fmtNum, fmtPct } from '../core/data'
import { REDUCED } from '../core/motion'

const NS = 'http://www.w3.org/2000/svg'
const mk = (tag: string, attrs: Record<string, string | number> = {}, text?: string) => {
  const n = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  if (text != null) n.textContent = text
  return n as SVGElement
}

const VB = { w: 1000, h: 290 }

export function initBudget() {
  const chart = document.getElementById('budget-chart')!
  const films = [...core].sort((a, b) => a.budget_real - b.budget_real)
  const maxBudget = films[films.length - 1].budget_real

  const svg = mk('svg', {
    viewBox: `0 0 ${VB.w} ${VB.h + 30}`,
    role: 'img',
    'aria-label': `The word SCALE with all ${films.length} core films' budgets rising inside the letterforms, ` +
      'cheapest to dearest — profitable films in green, losses in red. The red takes over as budgets grow.',
  }) as unknown as SVGSVGElement
  chart.appendChild(svg)

  // the word as a window: white text inside the mask reveals the bars
  const TEXT_ATTRS = {
    x: VB.w / 2, y: VB.h - 12,
    'text-anchor': 'middle',
    'font-family': "'Space Grotesk', sans-serif",
    'font-weight': 700,
    'font-size': 330,
    textLength: VB.w,
    lengthAdjust: 'spacingAndGlyphs',
  }
  const defs = mk('defs')
  const mask = mk('mask', { id: 'scale-knockout' })
  mask.appendChild(mk('rect', { width: VB.w, height: VB.h, fill: '#000' }))
  mask.appendChild(mk('text', { ...TEXT_ATTRS, fill: '#fff' }, 'SCALE'))
  defs.appendChild(mask)
  svg.appendChild(defs)

  // the word's ghost outline — legible before a single bar has risen
  svg.appendChild(mk('text', { ...TEXT_ATTRS, class: 'sp-ghost' }, 'SCALE'))

  // the slate, smallest bet to biggest, visible only through the word
  const barsG = mk('g', { mask: 'url(#scale-knockout)' })
  const slotW = VB.w / films.length
  const bars = films.map((f, i) => {
    const h = Math.max(8, Math.sqrt(f.budget_real / maxBudget) * VB.h)
    const bar = mk('rect', {
      class: `sp-bar ${f.profit_real >= 0 ? 'is-profit' : 'is-loss'}`,
      x: i * slotW, y: VB.h - h,
      width: Math.max(slotW - 1.4, 2), height: h,
    })
    const tip = mk('title')
    tip.textContent = `${f.title} (${f.year}) — budget ${fmtNum(f.budget_real / 1e6, 0)}M, ROI ${fmtPct(f.roi)}`
    bar.appendChild(tip)
    barsG.appendChild(bar)
    return bar
  })
  svg.appendChild(barsG)

  svg.appendChild(mk('text', {
    class: 'sp-caption', x: 0, y: VB.h + 24,
  }, `EVERY BAR IS A FILM · HEIGHT = BUDGET · CHEAPEST →  DEAREST`))
  svg.appendChild(mk('text', {
    class: 'sp-caption', x: VB.w, y: VB.h + 24, 'text-anchor': 'end',
  }, 'THE RED ARRIVES WITH THE MONEY'))

  /* the honest ledger: three budget bands, certificate rows */
  const cert = document.getElementById('budget-cert')!
  cert.innerHTML = portfolio.by_budget_band.map((b) => `
    <div class="cert-row">
      <span>${b.band} <span class="num">· ${b.n} FILMS</span></span>
      <span class="leader" aria-hidden="true"></span>
      <span class="value num ${b.mean_roi >= 0 ? 'is-profit' : 'is-loss'}">${fmtPct(b.mean_roi)} MEAN ROI</span>
    </div>`).join('')

  const note = document.getElementById('budget-note')!
  note.innerHTML =
    `Every log-dollar of budget cuts the expected multiple: β = <strong class="num">${fmtNum(budgetTerm.coef, 2)}</strong> ` +
    `(p = ${fmtNum(budgetTerm.p_value, 4)}) — the strongest coefficient in the model.` +
    (horrorTerm && horrorTerm.p_value < 0.05
      ? ` The quiet engine paying for it all: horror (β = +${fmtNum(horrorTerm.coef, 2)}, p = ${fmtNum(horrorTerm.p_value, 3)}).`
      : '')

  if (REDUCED) return

  // the money floods the word under the reader's thumb, left to right
  gsap.set(bars, { scaleY: 0, transformOrigin: '50% 100%' })
  gsap.to(bars, {
    scaleY: 1,
    ease: 'power1.out',
    stagger: 0.014,
    scrollTrigger: { trigger: '#budget', start: 'top 70%', end: 'center 35%', scrub: 0.7 },
  })
  gsap.from('.budget-cert .cert-row', {
    opacity: 0, y: 18, stagger: 0.1, duration: 0.6, ease: 'slate',
    scrollTrigger: { trigger: cert, start: 'top 85%' },
  })
  gsap.from(note, {
    opacity: 0, y: 20, duration: 0.6, ease: 'slate',
    scrollTrigger: { trigger: note, start: 'top 88%' },
  })
}
