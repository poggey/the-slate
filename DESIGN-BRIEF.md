# THE SLATE — Design Brief

*My reading of `the-slate-style-guide-v2.md` + `the-slate-whitepaper.md`, the assumptions I'm making, and the plan I'm building to. Written before the first line of site code.*

---

## 1. The reading

### The big idea (fixed, from the guide)
**The One-Shot.** The entire site is a single unbroken take. One continuous SVG line — **the Reel** — enters in the first frame and never leaves: it becomes the river baseline, the histogram outline, the regression line, the fund curve, and finally the signature under the verdict. Scroll is the projector motor; the reader's thumb drives the film.

### The feeling
**Kinetic, tactile, graded.** Closer to a title sequence than a document. Every section ends on a hook. Interaction is invited, never demanded — the page must read beautifully hands-off.

### Colour — the grade system (not a palette, an arc)
Four grades, cross-faded by scroll position. The colour shift *is* the narrative arc: light → dark → darkest → warm resolution.

| Grade | Act | Base | Ink | Accent |
|---|---|---|---|---|
| G1 DAYLIGHT | Prologue + Act I | `#F4F2EC` | `#141310` | `#FF4B33` vermilion |
| G2 TUNGSTEN | Act II | `#171512` | `#EFE9DC` | `#F2A93B` amber |
| G3 MIDNIGHT | Act III | `#0B0D12` | `#E8ECF4` | `#5B8CFF` blue (+ vermilion for tension) |
| G4 GOLDEN HOUR | Verdict + Credits | `#1A130E` | `#F6EBDD` | `#E8B45A` gold |

Utility pair in every grade: profit `#2FA36B`, loss `#E04E39` — data only, never decorative.

### Type
- **Display: Anton** — condensed movie-poster face, set enormous, cropped by the frame, numbers at absurd scale. Type is the imagery.
- **Mono: IBM Plex Mono** — every figure, axis, ticker, slugline, camera-report annotation. Tabular numerals always.
- Body text is scarce: max ~3 sentences before something moves. Long passages become line-by-line scroll reveals.

### Rhythm & craft floor
6vw frame margins in the hero; 1px rules from the palette; at most **two** pieces of film grammar per viewport; every number binds from `output/slate.json`; charts stay honest (true scales, zero-based bars, labelled axes); reduced-motion gets a composed static cut; mobile (390px) is a first-class edit; Lighthouse ≥ 90.

---

## 2. The story the data actually tells (this is the site's script)

The whitepaper predicted acclaim wouldn't pay (H2). **The data rejected that.** The guide says to write the verdict whichever way the numbers fell — so the site's third act is a *twist*, and the interactive centrepiece (Draw the Line) is built for it: most visitors will draw the cynical flat line, and the real line rises.

All figures from `output/slate.json` (base-case assumptions, core sample n=58, real 2025 USD):

- **The portfolio:** 118 films tracked, 58 in the core sample. **$1.62B deployed. Net profit: −$37M.** The whole studio, one rounding error from break-even.
- **H1 — confirmed, violently.** Mean ROI **+191%**, median **−10%**. Skew 4.62, excess kurtosis 23.8. Gini 0.63. **Five films — Backrooms, Hereditary, Lady Bird, Moonlight, Everything Everywhere All at Once — account for ~65% of every dollar of profit ever made.** Only 43% of films made money. This is a venture fund wearing a film studio's clothes.
- **H2 — rejected. Acclaim pays.** Metascore β = **+0.047** (robust SE 0.018, **p = 0.008**, std β 0.32): ten Metascore points ≈ +60% on the revenue multiple. Spearman ρ = **0.32** (p = 0.017). And it survives *all 13 sensitivity runs* (β 0.046–0.047, p ≤ 0.008 in every one).
- **H3 — the real villain is scale.** ln(budget) β = **−0.74, p = 0.0006** — the strongest factor in the model (std β −0.50). Budget bands: **<$5M → +579%**, $5–15M → +98%, **>$15M → −29%**. Horror over-indexes (+1.56, p = 0.047; mean ROI +291%).
- **The fund story:** the slate-year fund value peaks at **67.6×** in 2019, then the scale-up era (White Noise −$220M, Beau Is Afraid −$65M) produces a **−99.8% drawdown** to 0.15× by 2025. Sharpe-analogue 0.29 (film), 0.36 (year). Sortino 3.92. VaR(5%) −95%.
- **The verdict in one line:** **GOOD PAYS. BIG DOESN'T.** A24's crisis isn't that it makes art — art is a measurable, robust return factor. It's that it started making *expensive* art.

The quadrant epilogue: dream 18 / subsidised prestige 18 / cash cow 7 / miss 14 — art and commerce coexist more than the cynics expect, but the misses got dearer.

---

## 3. Gaps in the guide & assumptions I'm making

1. **Stack.** Your default is Next.js, but the guide implies otherwise: a single-page continuous-scroll film built around one morphing SVG path, GSAP + ScrollTrigger — and `assets-stash/vendor/` already contains GSAP with the Club plugins (DrawSVG, SplitText, CustomEase) as plain JS files. I'm building **Vite + TypeScript, no framework**: GSAP owns the scroll timeline without fighting a virtual DOM, the vendor files drop straight in, and a static single page is the fastest possible Lighthouse. Design tokens live as CSS custom properties in one file (`src/styles/tokens.css`) — the single source the whole UI reads.
2. **Fonts.** The stash has Space Grotesk + Newsreader, which don't match the guide's "condensed poster display + mono" call. I'm self-hosting **Anton + IBM Plex Mono** (both open, downloadable) per the guide's explicit examples. Space Grotesk stays unused.
3. **Hero certificate numbers.** The guide's examples (`104`, `$1.9B`, `FIVE`) were illustrative. Real values bind from the JSON: `FILMS WAGERED ··· 118`, `CORE SAMPLE ··· 58`, `CAPITAL DEPLOYED ··· $1.6B`, `PAID FOR EVERYTHING ··· FIVE` (that one held).
4. **Sound** is listed optional — I'm cutting it. Silence is cheaper than a mediocre projector click.
5. **Atmosphere assets.** Guide briefs four Higgsfield assets. I'll generate the two *stills* (35mm film-edge macro; empty cinema at golden hour) and build the dust motes, grain, and light-leak flash **in code** (canvas/CSS) — lighter than video loops, seamless by construction, and honours the guide's "code for the precise system" rule. All four (and every other asset) get full standalone prompts in `IMAGE-PROMPTS.md`.
6. **The river's unit.** Guide says bar height = budget, colour = profit/loss. I'll use core-sample films ordered by release date so the river *is* the timeline, with flagged films (distribution-only etc.) rendered as ghost bars — honest about the sample without cluttering the story.
7. **Timeseries start.** The fund curve starts 2016 (earliest core film with financials; A24's 2013–15 slate was largely distribution-only). Stated plainly in the credits, not hidden.

Nothing here is unclear enough to stop for; direction is obvious from the guide.

---

## 4. Sitemap — one page, seven scenes

| # | Scene | Grade | Set piece |
|---|---|---|---|
| 0 | **FIRST FRAME — The One-Sheet** | G1 | Poster-grid hero. THE / SLATE knockout title, portfolio bars rising inside the glyphs, certificate block, orchestrated entrance. |
| 1 | **INT. THE MARKET — DAY** (Act I: The Bet) | G1 | The thesis in three revealed lines + **The Slate River**: 58 films as a pinned horizontal river of budget bars, ticker readout, tap-to-pin cards. |
| 2 | **INT. THE ACCOUNTS — NIGHT** (Act II) | G2 | **The Cut**: a $100M gross bar sliced under scroll — exhibitors' half falls away, marketing burns, the sliver remains. Camera-report cards cite the real formula + assumption IDs. |
| 3 | **EXT. THE LONG TAIL — LATER** (Act II→III bridge) | G2→G3 | **The Tail**: Reel rises into the ROI histogram; the page travels an uncomfortably long distance to the outlier. Knockout word: **SKEW**. Landing stat: five films paid for everything. |
| 4 | **INT. THE VERDICT ROOM — MIDNIGHT** (Act III) | G3 | **Draw the Line** — the centrepiece. Reader draws their expected acclaim→profit line; the real vermilion regression rises against their ghost. β, band, robustness. Then the counter-punch: **the budget chart** (+579% / +98% / −29%). |
| 5 | **THE VERDICT** | G4 | 2×2 quadrant assembles from the four corners; films drift home. The Reel signs the enormous closing line: **GOOD PAYS. BIG DOESN'T.** 2.39:1 letterbox moment. |
| 6 | **CREDITS** | G4 | Rolling credits: interactive assumptions register A1–A7 (each row expands to its tested range + "conclusion survived"), limitations, sources, repo card. "No numbers were harmed." |

**Persistent layer:** the Reel (one SVG path, morphed via GSAP); the timecode ticker strip (`TC 00:01:42:18` · act · running portfolio value); cigarette-burn cue dots at act breaks; grain + vignette on dark grades; grade cross-fade driven by scroll.

---

## 5. Planned image assets (full prompts in `IMAGE-PROMPTS.md`)

| Asset | Slot | Spec | Source |
|---|---|---|---|
| `film-edge-macro` | Hero masthead texture, heavily darkened | 16:9, 4K still | Higgsfield |
| `empty-cinema-golden` | Verdict backdrop, low opacity | 16:9, 4K still | Higgsfield |
| Dust motes in projector beam | Midnight act background | — | Canvas particles (code) |
| Film-burn act-break flash | 300ms between grades | — | CSS/SVG (code) |
| Grain + vignette | All dark grades | — | SVG turbulence + CSS (code) |
| Film one-sheets (per-film mini posters) | River cards / poster wall | 3:4 | Generated typographic SVG (code) |

---

## 6. Build order

1. Tokens + fonts + grade system + Lenis/GSAP scaffold.
2. The Reel plumbing (one path, per-scene morph targets) + ticker + act transitions.
3. Scenes in scroll order, motion and mobile built in from the start.
4. Higgsfield stills as scenes need them; `IMAGE-PROMPTS.md` kept current.
5. `CRITIQUE.md` — harsh Awwwards-judge pass — then apply the top fixes.
6. `README.md` with run instructions and edit map.
