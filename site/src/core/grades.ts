/**
 * ZONES — sections own their colours statically (painted in CSS via
 * .theme-* classes; the page NEVER cross-fades). This module only
 * tracks which atmosphere zone the reader is in, so the fixed
 * overlays (grain, dust, cursor light) know when to appear.
 */

export type Zone = 'dark' | 'paper' | 'golden'

const SCENE_ZONE: Record<string, Zone> = {
  hero: 'dark',
  act1: 'paper',
  wall: 'paper',
  cut: 'dark',
  tail: 'dark',
  'tail-landing': 'dark',
  drawline: 'paper', /* the reader draws on the clean ledger — no grain */
  budget: 'dark',
  fund: 'dark',
  verdict: 'paper', /* the split frame stays clean — no grain, no dust */
  credits: 'golden',
}

/** scene id → ticker act label. */
export const SCENE_ACT: Record<string, string> = {
  hero: 'COLD OPEN',
  act1: 'ACT I · THE BET',
  wall: 'ACT I · THE BET',
  cut: 'ACT II · THE HOUSE TAKES HALF',
  tail: 'ACT II · THE HOUSE TAKES HALF',
  'tail-landing': 'ACT II · THE HOUSE TAKES HALF',
  drawline: 'ACT III · DOES GOOD PAY?',
  budget: 'ACT III · DOES GOOD PAY?',
  fund: 'ACT III · DOES GOOD PAY?',
  verdict: 'THE FINAL FRAME',
  credits: 'END CREDITS',
}

let current: Zone = 'dark'
const listeners: ((z: Zone) => void)[] = []

export function onZoneChange(fn: (z: Zone) => void) {
  listeners.push(fn)
}

function setZone(z: Zone) {
  if (z === current) return
  current = z
  document.body.dataset.zone = z
  listeners.forEach((fn) => fn(z))
}

export function initZones() {
  Object.entries(SCENE_ZONE).forEach(([id, zone]) => {
    const el = document.getElementById(id)
    if (!el) return
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => setZone(zone),
      onEnterBack: () => setZone(zone),
    })
  })
}
