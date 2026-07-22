/**
 * TICKER — the persistent mono strip. The scroll IS the runtime:
 * a live timecode advances with scroll depth, alongside the current
 * act and whatever context the active scene reports.
 */

const RUNTIME_MIN = 118 // one minute per film tracked — the runtime is the slate

let tcEl: HTMLElement
let actEl: HTMLElement
let ctxEl: HTMLElement

export function initTicker() {
  tcEl = document.getElementById('tick-tc')!
  actEl = document.getElementById('tick-act')!
  ctxEl = document.getElementById('tick-context')!

  gsap.ticker.add(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? window.scrollY / max : 0
    const totalFrames = Math.round(p * RUNTIME_MIN * 60 * 24)
    const ff = totalFrames % 24
    const ss = Math.floor(totalFrames / 24) % 60
    const mm = Math.floor(totalFrames / (24 * 60)) % 60
    const hh = Math.floor(totalFrames / (24 * 3600))
    const pad = (n: number) => String(n).padStart(2, '0')
    const next = `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`
    if (tcEl.textContent !== next) tcEl.textContent = next
  })
}

export function setTickerAct(label: string) {
  actEl.textContent = label
}

export function setTickerContext(html: string) {
  ctxEl.innerHTML = html
}
