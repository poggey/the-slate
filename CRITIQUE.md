# CRITIQUE — as a harsh Awwwards judge would write it

*Self-review after the build and one full verification pass (desktop 1440, mobile 390, reduced-motion). Fixes marked ✅ were applied before shipping.*

## What earns the score

- **The concept holds.** The Reel genuinely persists — timeline, river baseline, money staircase, histogram skyline, regression line, fund curve, signature. It's one idea executed everywhere, not a stack of sections. The moment it turns vermilion and *rises* in Draw-the-Line is the site's thesis made physical.
- **The hero is a poster, not a page.** Knockout THE/SLATE with the actual portfolio rising inside the glyphs, real certificate values, one entrance timeline, leader-countdown easter egg. The reduced-motion cut is a composed static frame, not a broken animation.
- **Draw the Line is the shareable beat.** Being personally wrong on the record (most people draw it falling; it rises, p = 0.008, robust in all 13 sensitivity runs) is a data-story interaction with an emotional payoff. The skip path keeps it honest for non-drawers and keyboard users.
- **The grade arc reads.** Daylight → tungsten → midnight → golden hour actually changes the temperature of the argument, and the utility profit/loss pair stays consistent through all four.
- **Craft floor held:** every number binds from `slate.json`; charts are log-scaled where the data demands it and say so; the assumptions register is interactive and cites real sensitivity ranges; the verdict sentence is generated from the coefficients, not hard-coded.

## What a judge would ding

1. **The tail travel is austere to a fault.** The long empty stretch is the point (distance as data), but two of its 14 seconds have literally nothing but the baseline. A faint mono odometer ("+400%… +800%…") ticking along the empty bins would keep the pull without breaking the emptiness. *Would fix with more time.*
2. **The Reel's between-scene interpolations are occasionally arbitrary.** Between keyframes the line passes through mid-viewport space it doesn't "own" — mostly graceful, occasionally crossing text. Fixed the worst two (landing, verdict coda) ✅; a full fix would give every scene explicit entry/exit keys.
3. **The fund chart and its Reel echo are two curves, not one.** The Reel deliberately echoes the shape rather than tracing the chart pixel-perfectly (it's viewport-fixed; the chart scrolls). Made the in-chart line solid so the chart stands alone ✅, but a judge would still ask for the reel to land exactly on it at the snap point.
4. **The knockout SKEW plate reads muddy mid-fade.** At 0% and 100% it's beautiful; around 40% opacity the letter windows and the histogram fight. A hard two-step fade (hold, then drop fast) would be cleaner than the linear scrub.
5. **Bundle honesty:** GSAP + plugins + Lenis ≈ 31KB gz JS is fine, but the vendor files load as render-blocking scripts in `<head>`. Moving them to `defer` (order-preserved) would shave first-paint further.
6. **The river card on desktop sits at a fixed bottom-left** — fine, but a magnetic follow near its bar would feel more tactile.

## Bugs found in verification and fixed ✅

- Tail landing overlapped the pinned travel (landing split into its own section).
- Histogram bars collapsed (`--h` was scoped to the wrong element).
- Lenis swallowed programmatic/anchor scrolls (anchors now routed through Lenis; instance exposed for tooling).
- SplitText measured before fonts loaded (scene init now gated on `document.fonts.ready`).
- Draw-the-Line's fit line, ticker act label stuck on COLD OPEN, clipped fund annotation, verdict coda contrast, stale ticker context in The Cut.

## Verdict on the verdict

It looks like a title sequence, argues like a research paper, and the one interaction people will remember is the one that proves the headline. Site-of-the-Day shortlist material; the six refinements above are what would push it from shortlist to win.
