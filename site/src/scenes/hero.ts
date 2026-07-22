/**
 * SCENE 0 — COLD OPEN: THE DARK THEATRE
 * The red projector beam holds the frame; the title arrives once,
 * cleanly. No stats, no tricks — one image, one line, one name.
 */
import { REDUCED } from '../core/motion'

export function initHero() {
  if (REDUCED) return // composed static frame

  const title = new SplitText('.hero-title', { type: 'chars', charsClass: 'hero-char' })
  gsap.set('.hero-title', { overflow: 'hidden' })
  const tl = gsap.timeline({ defaults: { ease: 'slate' } })
  tl.from('.hero-media-img', { opacity: 0, scale: 1.06, duration: 1.6, ease: 'power2.out' })
    .from('.hero-billing', { opacity: 0, y: -12, duration: 0.6 }, '-=1.0')
    .from('.hero-kicker', { opacity: 0, y: 16, duration: 0.6 }, '-=0.6')
    .from(title.chars, { yPercent: 110, opacity: 0, stagger: 0.028, duration: 0.8 }, '-=0.4')
    .from('.hero-sub', { opacity: 0, y: 18, duration: 0.6 }, '-=0.4')
    .from('.hero-foot', { opacity: 0, duration: 0.5 }, '-=0.3')

  /* ambient: the beam breathes; parallax under scroll */
  gsap.to('.hero-media-img', {
    scale: 1.045, duration: 16, ease: 'sine.inOut', repeat: -1, yoyo: true,
  })
  gsap.to('.hero-media-img', {
    yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to('.hero-center', {
    opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: '60% top', end: 'bottom top', scrub: true },
  })
}
