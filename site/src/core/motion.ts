/**
 * MOTION — GSAP (vendored, incl. Club plugins) + Lenis smooth scroll,
 * with a single reduced-motion switch the whole site respects.
 */
import Lenis from 'lenis'

// GSAP and its plugins are loaded as globals from /vendor (see index.html).
declare global {
  const gsap: any
  const ScrollTrigger: any
  const CustomEase: any
  const SplitText: any
}

/** True when the visitor asked for a calm, static cut of the film. */
export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Signature eases — snappy exits, soft landings. */
export function registerEases() {
  gsap.registerPlugin(ScrollTrigger)
  CustomEase.create('slate', 'M0,0 C0.16,1 0.3,1 1,1') // expo-style out
  CustomEase.create('snap', 'M0,0 C0.7,0 0.2,1 1,1')   // hard cut with landing
}

export let lenis: Lenis | null = null

export function initSmoothScroll() {
  if (REDUCED) return // native scroll for reduced motion
  lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time: number) => lenis!.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  // Lenis owns the scroll position, so in-page anchors must go through it
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null
    if (!a) return
    const target = document.querySelector(a.getAttribute('href')!)
    if (!target) return
    e.preventDefault()
    lenis!.scrollTo(target as HTMLElement, { duration: 1.6 })
  })
  // handy for debugging and driving the page programmatically
  ;(window as any).__lenis = lenis
}

/**
 * Reveal an element's lines one by one as it scrolls into view.
 * Under reduced motion, content is simply visible.
 */
export function revealLines(selector: string, opts: { stagger?: number; y?: number } = {}) {
  const els = gsap.utils.toArray(selector) as HTMLElement[]
  els.forEach((el) => {
    if (REDUCED) return
    const split = new SplitText(el, { type: 'lines', linesClass: 'sl-line' })
    gsap.set(split.lines, { yPercent: opts.y ?? 110, opacity: 0 })
    gsap.to(split.lines, {
      yPercent: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'slate',
      stagger: opts.stagger ?? 0.09,
      scrollTrigger: { trigger: el, start: 'top 82%' },
    })
  })
}

/** Count a number up when it enters view (mono, tabular). */
export function countUp(el: HTMLElement, to: number, format: (v: number) => string) {
  if (REDUCED) { el.textContent = format(to); return }
  const state = { v: 0 }
  gsap.to(state, {
    v: to,
    duration: 1.4,
    ease: 'power2.out',
    onUpdate: () => (el.textContent = format(state.v)),
    scrollTrigger: { trigger: el, start: 'top 85%' },
  })
}
