/**
 * THE SLATE — main. One unbroken take, conducted from here.
 * Order matters: eases → scroll → scenes (they create the ScrollTriggers
 * and register Reel keyframes) → the persistent layers → final refresh.
 */
import './styles/tokens.css'
import './styles/base.css'
import './styles/hero.css'
import './styles/scenes.css'

import { registerEases, initSmoothScroll, REDUCED } from './core/motion'
import { initTicker, setTickerAct, setTickerContext } from './core/ticker'
import { initZones, onZoneChange, SCENE_ACT } from './core/grades'
import { initDust } from './core/effects'

import { initHero } from './scenes/hero'
import { initStakes } from './scenes/act1-stakes'
import { initCut } from './scenes/act2-cut'
import { initTail } from './scenes/act2-tail'
import { initDrawLine } from './scenes/act3-line'
import { initBudget } from './scenes/act3-budget'
import { initFund } from './scenes/act3-fund'
import { initVerdict } from './scenes/verdict'
import { initCredits } from './scenes/credits'

registerEases()
initSmoothScroll()
initTicker()

// Wait (briefly) for the display face before measuring type-driven layout —
// SplitText and the ScrollTriggers need real glyph metrics.
const fontsReady = Promise.race([
  document.fonts?.ready ?? Promise.resolve(),
  new Promise((r) => setTimeout(r, 1500)),
])

fontsReady.then(() => {
  // Scenes, in scroll order (each registers its own triggers)
  initHero()
  initStakes()
  initCut()
  initTail()
  initDrawLine()
  initBudget()
  initFund()
  initVerdict()
  initCredits()

  // Persistent layers
  initZones()
  const dust = initDust()
  onZoneChange((z) => {
    if (dust) z === 'dark' ? dust.show() : dust.hide()
  })
  if (dust) dust.show() // the cold open begins in the dark

  // The chapter rail (right edge, desktop)
  const rail = document.getElementById('rail')!
  const CHAPTERS: [string, string][] = [
    ['hero', 'Open'], ['act1', 'Act I'], ['cut', 'Act II'],
    ['drawline', 'Act III'], ['fund', 'The fund'],
    ['verdict', 'Final frame'], ['credits', 'Credits'],
  ]
  rail.innerHTML = CHAPTERS.map(([id, label]) => `<a href="#${id}" data-for="${id}">${label}</a>`).join('')
  const railLinks = new Map(
    [...rail.querySelectorAll<HTMLAnchorElement>('a')].map((a) => [a.dataset.for!, a]),
  )
  const RANGES: [string, string][] = [
    ['hero', 'hero'], ['act1', 'wall'], ['cut', 'tail-landing'],
    ['drawline', 'budget'], ['fund', 'fund'], ['verdict', 'verdict'], ['credits', 'credits'],
  ]
  RANGES.forEach(([startId, endId]) => {
    ScrollTrigger.create({
      trigger: `#${startId}`,
      endTrigger: `#${endId}`,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self: any) => railLinks.get(startId)!.classList.toggle('is-active', self.isActive),
    })
  })

  // The ticker's act label follows the scenes, not the lighting
  Object.entries(SCENE_ACT).forEach(([id, label]) => {
    const el = document.getElementById(id)
    if (!el) return
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => setTickerAct(label),
      onEnterBack: () => setTickerAct(label),
    })
  })

  // Act dividers: a reel change — a beat of true black with the act
  // title, and the projectionist's cue dot flashing in the corner
  document.querySelectorAll<HTMLElement>('.act-divider').forEach((d) => {
    d.innerHTML =
      `<span class="ad-label mono-label">${d.dataset.label ?? ''}</span>` +
      `<i class="ad-burn"></i>`
    if (!REDUCED) {
      const burn = d.querySelector('.ad-burn')!
      const flash = () => gsap.timeline()
        .set(burn, { opacity: 1 })
        .to(burn, { opacity: 0, duration: 0.07 }, 0.12)
        .set(burn, { opacity: 1 }, 0.22)
        .to(burn, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.34)
      ScrollTrigger.create({
        trigger: d, start: 'top 70%',
        onEnter: flash, onEnterBack: flash,
      })
    }
  })

  // Corner chrome: every scripted scene is a composed frame — slugline
  // top-left, frame index top-right, like the Final Frame's corners
  const framed = [...document.querySelectorAll<HTMLElement>('section[data-scene]')]
    .filter((s) => s.querySelector('.slugline'))
  const frameCount = framed.length + 1 // the Final Frame closes the count
  framed.forEach((s, i) => {
    const host = s.querySelector<HTMLElement>('.cut-viewport') ?? s
    const t = document.createElement('span')
    t.className = 'frame-tag micro num'
    t.textContent = `FRAME ${String(i + 1).padStart(2, '0')} / ${String(frameCount).padStart(2, '0')}`
    host.appendChild(t)
  })

  // Scene context lines for the ticker (scenes may override with live data)
  const CONTEXT: [string, string][] = [
    ['tail', 'EVERY DOT IS A FILM'],
    ['tail-landing', 'FIVE FILMS PAID FOR EVERYTHING'],
    ['drawline', 'DRAW THE RELATIONSHIP YOU EXPECT'],
    ['budget', 'THE VILLAIN IS SCALE'],
    ['fund', 'THE TRACK RECORD'],
    ['verdict', 'THE VERDICT'],
  ]
  CONTEXT.forEach(([id, label]) => {
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: 'top 60%',
      onEnter: () => setTickerContext(label),
      onEnterBack: () => setTickerContext(label),
    })
  })

  ScrollTrigger.refresh()
})

window.addEventListener('load', () => ScrollTrigger.refresh())
