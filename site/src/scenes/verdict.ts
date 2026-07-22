/**
 * THE FINAL FRAME
 * One full-viewport composition, split black/cream on the diagonal.
 * Every core film starts as a dot at the exact centre and radiates out
 * to its true place — x: profit multiple (log), y: acclaim — while the
 * quadrant names take their corners. Only when the field has settled
 * does the closing sentence appear, set in the site's one serif moment.
 * The sentence is generated from the coefficients, whichever way they fell.
 */
import {
  quadrantCounts, acclaimPays, budgetTerm, metascoreTerm,
  scatterFilms, sensitivity, fmtNum,
} from '../core/data'
import { REDUCED } from '../core/motion'
import { setTickerContext } from '../core/ticker'

/* domains — x: revenue multiple (log), y: metascore.
   Both are symmetric about their thresholds (break-even ×1, Metascore 70)
   so the axes cross at the exact centre — where the dots are born. */
const LX0 = -3.5
const LX1 = 3.5
const Y0 = 38
const Y1 = 102

/* quadrant colours: gold dream, bone prestige, brick miss, green cash cow */
const QUAD_COLOR: Record<string, string> = {
  dream: '#e8b45a',
  subsidised: '#e9e2d4',
  miss: '#c74a30',
  cashcow: '#1d7a4f',
}

const pxX = (mult: number) =>
  6 + ((Math.min(Math.max(Math.log(Math.max(mult, 0.001)), LX0 + 0.2), LX1 - 0.2) - LX0) / (LX1 - LX0)) * 88
const pxY = (meta: number) =>
  8 + (1 - (Math.min(Math.max(meta, Y0 + 2), Y1 - 2) - Y0) / (Y1 - Y0)) * 84

export function initVerdict() {
  const stage = document.getElementById('ff-stage')!
  const dotsWrap = document.getElementById('ff-dots')!

  /* axes cross dead centre — the point every dot is born from */
  const axV = stage.querySelector<HTMLElement>('.ff-ax-v')!
  const axH = stage.querySelector<HTMLElement>('.ff-ax-h')!
  axV.style.left = '50%'
  axH.style.top = '50%'

  /* corners */
  const corners: [string, string, string][] = [
    ['ff-tl', 'THE SUBSIDISED PRESTIGE', String(quadrantCounts.subsidised)],
    ['ff-tr', 'THE DREAM', String(quadrantCounts.dream)],
    ['ff-bl', 'THE MISS', String(quadrantCounts.miss)],
    ['ff-br', 'THE CASH COW', String(quadrantCounts.cashcow)],
  ]
  corners.forEach(([id, name, n]) => {
    document.getElementById(id)!.textContent = `${name} · ${n}`
  })

  /* the dots — born in the centre */
  const dots = scatterFilms.map((f) => {
    const d = document.createElement('span')
    d.className = 'ff-dot'
    d.style.background = QUAD_COLOR[f.quadrant ?? 'miss']
    d.title = `${f.title} (${f.year})`
    d.dataset.x = String(pxX(f.revenue_multiple))
    d.dataset.y = String(pxY(f.metascore as number))
    dotsWrap.appendChild(d)
    return d
  })

  /* the closing line — written from the data */
  const line = document.getElementById('verdict-line')!
  const budgetHurts = budgetTerm.coef < 0 && budgetTerm.p_value < 0.05
  let text: string
  if (acclaimPays && budgetHurts) text = 'Good films pay. Cheap good films pay for everything else.'
  else if (acclaimPays) text = 'Good films pay. The data signs off on taste.'
  else if (budgetHurts) text = 'Acclaim is free. Scale is what costs.'
  else text = 'The hits pay for everything. Everything else is the price of finding them.'
  line.textContent = text

  /* the split-colour trick: an identical copy of the sentence, clipped
     to the black triangle, renders white — dark over cream, white over black */
  const clip = document.createElement('div')
  clip.className = 'ff-line-clip'
  clip.setAttribute('aria-hidden', 'true')
  const lineWhite = line.cloneNode(true) as HTMLElement
  lineWhite.removeAttribute('id')
  clip.appendChild(lineWhite)
  stage.appendChild(clip)
  const lines = [line, lineWhite]

  document.getElementById('ff-caption')!.innerHTML =
    `β<sub>2</sub> = ${metascoreTerm.coef > 0 ? '+' : '−'}${fmtNum(Math.abs(metascoreTerm.coef), 3)} per Metascore point · ` +
    `p = ${fmtNum(metascoreTerm.p_value, 3).replace('0.', '.')} · unchanged in all ${sensitivity.length} assumption scenarios`

  ScrollTrigger.create({
    trigger: '#verdict',
    start: 'top 60%',
    onEnter: () => setTickerContext('THE FINAL FRAME'),
    onEnterBack: () => setTickerContext('THE FINAL FRAME'),
  })

  if (REDUCED) {
    // composed final frame, no motion
    dots.forEach((d) => {
      d.style.left = `${d.dataset.x}%`
      d.style.top = `${d.dataset.y}%`
    })
    return
  }

  /* the sequence, pinned and scroll-driven:
     dots radiate from the centre → corners claim their names →
     the sentence appears last */
  dots.forEach((d) => {
    d.style.left = '50%'
    d.style.top = '50%'
  })
  gsap.set(dots, { opacity: 0, scale: 0.4 })
  gsap.set('.ff-corner', { opacity: 0, y: 8 })
  gsap.set('.ff-ax', { opacity: 0 })
  // GSAP replaces the CSS translate(-50%,-50%) the moment it touches y,
  // so restate the centring as percents it will preserve through the tween
  gsap.set(lines, { x: 0, y: 14, xPercent: -50, yPercent: -50, opacity: 0 })
  gsap.set('#ff-caption', { opacity: 0 })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#verdict',
      start: 'top top',
      end: '+=170%',
      pin: '#ff-stage',
      scrub: 0.7,
      anticipatePin: 1,
    },
  })

  tl.to(dots, { opacity: 1, scale: 1, duration: 0.12, stagger: 0.004 }, 0)
  dots.forEach((d, i) => {
    tl.to(d, {
      left: `${d.dataset.x}%`,
      top: `${d.dataset.y}%`,
      duration: 1.1,
      ease: 'power2.inOut',
    }, 0.05 + (i % 14) * 0.028)
  })
  tl.to('.ff-ax', { opacity: 1, duration: 0.4 }, 0.9)
    .to('.ff-corner', { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, 1.05)
    .to(lines, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 1.55)
    .to('#ff-caption', { opacity: 1, duration: 0.4 }, 1.95)
}
