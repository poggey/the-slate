# THE SLATE — Design Direction v2: "THE ONE-SHOT"

*This replaces the previous style guide entirely. It is a direction, not a rulebook. Claude Code: where this document is silent, you have full creative latitude — surprise us. Where it makes a call, honour it. The bar is an Awwwards Site of the Day, not a report.*

---

## THE BIG IDEA

The whole site is **one unbroken take**.

A single continuous line — call it **the Reel** — enters the screen in the first frame and never leaves. It travels with the scroll and *becomes* everything: the timeline of A24's releases, the outline of the return histogram, the Lorenz curve, the regression line, the drawdown chart, and finally the signature on the closing verdict. One line, no cuts, start to finish. Like a film shot in a single take.

Why: the analysis is one continuous argument — every film is a bet, a few bets pay for everything, and acclaim may not pay at all. The Reel makes the reader *feel* that continuity. They're not reading sections; they're following a thread through a story about money and art.

Everything else in this document serves that one idea.

---

## THE FEELING

Scrolling should feel like being *pulled*. Every section ends on a hook — a half-revealed number, a question, the Reel disappearing off-frame — so stopping feels like pausing a film at the good bit.

Three words to build by: **kinetic. tactile. graded.**

- **Kinetic** — something is always in motion under scroll control. Not decoration: the data itself moves.
- **Tactile** — the reader *can* touch the story: drag a guess, pin a film, scrub a timeline. But interaction is always invited, never demanded — the page reads beautifully hands-off, and rewards the curious. If a paragraph can become an interaction, consider it; if an interaction gates the story, cut it.
- **Graded** — like a film, each act has its own colour grade. The site visibly changes temperature as the story darkens.

Anti-goals: no dashboard energy, no long unbroken text, no polite muted minimalism. This should feel closer to a title sequence than a document.

---

## COLOUR — THE GRADE SYSTEM

Not one palette. **Four grades, one per act** — the way a colourist grades a film differently scene by scene. Scrolling between acts smoothly cross-fades the entire grade (background, text tint, Reel colour, chart accents). The colour shift IS the narrative arc: the story literally darkens, then resolves.

| Grade | Act | World | Base | Ink/Text | Accent |
|---|---|---|---|---|---|
| **G1 · DAYLIGHT** | Prologue + Act I: The Bet | Optimism. Paper, possibility, the pitch. | `#F4F2EC` warm white | `#141310` | `#FF4B33` hot vermilion — the greenlight-button red |
| **G2 · TUNGSTEN** | Act II: The House Takes Half | The machinery. Backstage, money mechanics. | `#171512` dark warm | `#EFE9DC` | `#F2A93B` projector amber |
| **G3 · MIDNIGHT** | Act III: Does Good Pay? | The confrontation. The money chart lives here. | `#0B0D12` blue-black | `#E8ECF4` | `#5B8CFF` arc-light blue + `#FF4B33` returns for profit/loss tension |
| **G4 · GOLDEN HOUR** | The Verdict + Credits | Resolution. Dawn after the argument. | `#1A130E` → warms upward | `#F6EBDD` | `#E8B45A` gold |

Utility pair used in every grade: **profit** `#2FA36B`, **loss** `#E04E39` — data colours only, never decorative.

Claude Code: exact hex values are negotiable; the *four-grade arc from light → dark → darkest → warm resolution* is not. The cross-fade between grades should be one of the most satisfying things on the page.

---

## TYPE

Two voices with real contrast — a poster voice and a projectionist voice:

- **Display: a huge, characterful condensed face** (e.g. *Anton*, *Archivo Black*, or better if you know one) — movie-poster energy, used enormous and cropped, sometimes bleeding off-frame. Headlines can be cut by the viewport edge like a tight film frame. Numbers in headlines get set at absurd scale (a "42%" can be 40vw tall).
- **Mono: everything data** (e.g. *IBM Plex Mono* or *Space Grotesk Mono*) — figures, axes, captions, ticker lines, the running "camera report" annotations. Tabular numerals always.
- Body text exists but is scarce. Max ~3 sentences before something moves, reveals, or asks for input. If you need a long passage, break it into scroll-revealed fragments that arrive line by line.

---

## THE SET PIECES (in scroll order)

These are the moments the site is remembered by. Treat each as a scene to direct, not a section to lay out.

### 1. FIRST FRAME — THE ONE-SHEET (the hook)
The hero is a **poster, not a page** — one strict grid composition where every element is aligned and only one thing is expressive: the type itself is alive. Structure, top to bottom: a heavy top rule with a justified billing row (`A PORTFOLIO STUDY · Nº A24 · IN THREE ACTS`); the title **THE / SLATE** stacked in two lines, each stretched *exactly* full-width (SVG `textLength`, Anton), the letterforms acting as knockout windows onto a burning red-graded field — inside the glyphs, the portfolio itself rises as bars (mostly small, three towers), a heat spot drifts, a faint scan line pulls through like a projector; then a **certificate block** — label / dot-leader hairline / value rows (`FILMS WAGERED ··· 104`, `CAPITAL DEPLOYED ··· $1.9B`, `PAID FOR EVERYTHING ··· FIVE` in vermilion); then a light bottom rule with `DIRECTED BY THE DATA` and the scroll cue.
Entrance is one orchestrated timeline: rule draws → billing sets → title wipes up from its baseline → bars rise inside the letters → certificate rows and leaders draw in. After that, all motion is ambient and slow (heat drift, bar breathing, scan pull) with a gentle field parallax on scroll.
**The rules that keep it designed:** identical margins everywhere (6vw); every rule 1px from one palette; two type sizes total outside the title; red appears exactly twice (the Nº and FIVE) plus inside the glyphs; nothing positioned arbitrarily — if an element isn't on the grid, it doesn't exist. The Bass lineage survives in the knockout-type-over-burning-field idea; the discipline is what separates homage from costume.

**The knockout variant (reusable section device):** the same cutout logic pointed at the data mid-page — a single enormous word (SKEW, HALF, β) as an SVG mask with the *living chart* visible only through the letterforms. Use at the emotional peak of an act, two or three times total.

### 2. THE SLATE RIVER (Act I)
All ~100 films flow past as the reader scrolls — a horizontal river of thin vertical bars (height = budget, colour = eventual profit/loss), the Reel running through them as the baseline. Films light up as they cross centre-frame with a mono ticker readout (title · year · budget · return). Tap/hover any bar to pin its card. The river visibly has a rhythm: mostly small bars, occasional monsters. The reader is *feeling* the distribution before being told about it.

### 3. THE CUT — WHERE THE MONEY GOES (Act II)
The house-takes-half mechanics as a physical animation: a dollar (or a £100M gross bar) enters frame and gets *sliced* under scroll — exhibitor's cut falls away, marketing burns off, the studio's sliver remains. Each slice is a scrub-controlled cut with a hard snap. Camera-report mono cards annotate each cut with the real formula and assumption ID. This is the "quick cuts" energy — the edit as violence to the gross number.

### 4. THE TAIL (Act II → III bridge)
The Reel rises into the return histogram outline, drawn bar by bar under scroll... and then the page keeps scrolling *sideways or down* far longer than expected to reach the last outlier bar — the reader physically travels the long tail. Distance as data. When they finally reach it, the stat lands: "**X films paid for all the rest.**" with the top-5 profit share counter.

### 5. DRAW THE LINE (Act III — the centrepiece interaction)
The acclaim-vs-profit scatter appears in MIDNIGHT grade — but with no trend line. A prompt: **"Draw the relationship you expect."** The reader drags a line across the chart with finger/cursor. Release → their line ghosts in blue, and the *real* regression line draws in vermilion beside it, with β, its confidence band, and the verdict. Nothing communicates "acclaim doesn't pay" (or "does!") like being personally wrong on the record. This is the moment people share.

### 6. THE VERDICT (Golden Hour)
Full-frame. The 2×2 quadrant (dream / subsidised prestige / cash cow / miss) assembles as the four corners of the screen, films drifting home to their quadrants like end-of-film character cards. The Reel draws the final one-line verdict as if hand-signed. One enormous sentence answers the thesis — written from the real numbers, whichever way they fell.

### 7. CREDITS THAT EARN THE SCROLL
Methodology, assumptions register, sensitivity results, limitations, data sources — rolled as end credits, but *interactive*: each assumption row expands on tap to show its tested range and whether the conclusion survived. A final mono line: "No numbers were harmed. All of them are reproducible — [repo link]."

---

## FILM GRAMMAR & EASTER EGGS

The cinema feeling comes from *film's own visual language*, used precisely and sparingly — grammar, not costume. All original, no copyrighted material:

- **Screenplay sluglines** introduce every section in Courier-style mono caps: `INT. THE MARKET — DAY`, `INT. THE ACCOUNTS — NIGHT`, `EXT. THE LONG TAIL — LATER`. The site reads as a shooting script for the analysis. This is the workhorse device — cheap, constant, unmistakably cinematic.
- **The rating card** cold open (see First Frame) — the single biggest "this is a film" signal on the page.
- **Cigarette burns:** the small reel-change cue dot flashes in the top-right corner for ~400ms at every act transition. Blink and you miss it; those who catch it grin.
- **Timecode ticker:** the persistent strip runs a live timecode (`TC 00:01:42:18`) advancing with scroll depth, alongside act and running portfolio value. The scroll *is* the runtime.
- **2.39:1 letterbox mattes** on the premiere frame and the Verdict — the two "widescreen moments."
- **Film grain + vignette** breathe over all dark grades (subtle, stepped like print, off under reduced-motion).
- **One-sheets:** films appear as generated typographic mini-posters — solid grade-colour tiles, the title set huge in the display face, the return figure as the "billing block" at the foot. A swipeable poster wall gives the imagery and tactility of a movie site with zero rights issues. The billing-block micro-type at each poster's foot is real data (budget · gross · ROI) set in authentic tiny-condensed poster style.
- **Credits grammar everywhere it fits:** "DIRECTED BY THE DATA", assumption IDs styled as certificate numbers, the repo link as the studio card.
- Optional deep cut: the film count in the hero ticks up like a **leader countdown** (8… 7… 6…) before resolving to the true number.

Rule of taste: any single viewport shows at most **two** pieces of film grammar at once. Grandeur comes from restraint plus scale — one enormous confident thing per frame, lit well.

---

## INTERACTION INVENTORY (sprinkle throughout)

- **The Reel is scrubbed, never timed.** The reader's thumb is the projector motor. Fast scroll = fast film.
- **Cursor/touch as light** in dark grades: a soft pool of light follows the pointer; charts brighten locally under it.
- **Magnetic numbers:** key stats subtly lean toward the cursor; on tap they "develop" from blurred to sharp like a print in a darkroom.
- **The ticker:** a persistent thin mono strip (top or bottom edge) that live-updates with context as you scroll — current act, current film in frame, running portfolio value. Feels like a trading terminal wearing a tuxedo.
- **Micro-haptics of motion:** hard snap points at every act break (scroll-snap), elastic overshoot on chart builds, 60–120ms stagger on any group entrance.
- **Sound (optional, off by default):** a single toggle. If on: room tone per grade, a soft projector click at act breaks. Never music.

---

## GRAPHICS & GENERATED ASSETS

The site's graphics are mostly *the data made physical* (the river, the cut, the tail). Supplement with generated atmosphere — briefs for Higgsfield / image gen:

1. **Loop, 4–6s:** dust motes drifting through a single beam of projector light on pure black — background for MIDNIGHT act. Subtle, slow, seamless loop.
2. **Loop, 2–3s:** film burn / light-leak transition texture on black (amber-orange), used only at act breaks as a 300ms flash-frame between grades.
3. **Still or slow loop:** extreme macro of 35mm film edge with sprocket holes catching warm light — masthead texture behind the title, heavily darkened.
4. **Still:** empty cinema in golden-hour light, shot from the screen's POV looking at the seats — Verdict-act backdrop at low opacity.

All atmosphere sits *behind* data at low contrast. No real film stills, posters, or identifiable actors — generated abstractions only. No verbatim film quotes; write original lines with trailer cadence.

---

## CRAFT FLOOR (non-negotiable, but quiet)

- Every number on the page binds from `output/slate.json` — the copy templates interpolate real results, whichever direction the findings fell.
- Charts stay honest under all the theatre: true scales, zero-based bars, labelled axes on every analytical chart (set pieces may show the *expressive* version first, but the honest version must follow or coexist).
- Mobile is a first-class cut of the film, not a fallback: the river becomes vertical, Draw-the-Line works with a thumb, the cold-open game is thumb-native. Test everything at 390px.
- `prefers-reduced-motion`: every set piece has a composed static final frame. The story must fully work without motion.
- Keyboard path through all interactions; visible focus; Lighthouse ≥ 90.
- Performance: the Reel is one SVG path morphed via GSAP (MorphSVG or flubber), not canvas soup. Video loops ≤ 2MB, lazy, paused off-screen.

---

## HANDOFF NOTE TO CLAUDE CODE

You are directing a short film about a portfolio. The script is `output/slate.json` and the whitepaper's argument; this document is the storyboard. The Reel, the four-grade arc, the title-sequence first frame, and Draw-the-Line are the fixed points. Everything else — layout, easing, secondary micro-interactions, how bold to push the type — is yours. Make choices a template never would. If a section feels like a report, re-shoot it.
