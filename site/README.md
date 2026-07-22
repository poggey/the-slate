# THE SLATE — the site

A24's filmography as a venture portfolio, told in three acts.
Single-page scroll story: Vite + TypeScript + GSAP (vendored, incl. Club plugins) + Lenis. No framework.

## Run it

```bash
cd site
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

## Where the numbers come from

Every figure binds from **`../output/slate.json`** (imported via the `@data` alias in `vite.config.ts`).
Re-run the analysis notebooks → the JSON updates → the site updates. No numbers live in the code;
even the closing verdict sentence is generated from the coefficients (`src/scenes/verdict.ts`).

## Type system

- **Space Grotesk** (variable, 300–700) — the workhorse: hero, labels, body, numbers.
- **Newsreader** (variable serif) — the classy voice: scene headlines and the Final Frame sentence.
Both live in `public/fonts/` and are declared once in `src/styles/tokens.css`.

## Colour system

Sections are painted individually via `.theme-paper` / `.theme-golden` classes (defaults to the dark
theatre). There are **no page-wide colour transitions** — boundaries are hard printed edges.

## Change things

| You want to change… | Edit |
|---|---|
| **Colours, fonts, type scale, spacing, motion timing** | `src/styles/tokens.css` — the single source |
| **Which section is paper / dark / golden** | `.theme-*` class on the section in `index.html` (overlay zones: `src/core/grades.ts`) |
| **Copy** (thesis lines, headings, sluglines) | `index.html` (static copy) + the scene file that builds the section |
| **Hero image / backdrops** | drop same-named `.webp` files into `public/img/` (prompts: `../IMAGE-PROMPTS.md`) |
| **Hero stats** | `src/scenes/hero.ts` |
| **Poster wall tones / card content** | `src/scenes/act1-wall.ts` (+ `.poster` styles in `scenes.css`) |
| **Add / remove / reorder a section** | markup in `index.html`, one module in `src/scenes/`, register in `src/main.ts`, grade it in `grades.ts` |
| **Assumptions register & credits copy** | `src/scenes/credits.ts` |

## Folder map

```
site/
├─ index.html               # all section markup, in scroll order
├─ public/
│  ├─ fonts/                # Space Grotesk + Newsreader (variable woff2)
│  ├─ img/                  # generated backdrops (webp)
│  └─ vendor/               # GSAP + plugins (loaded as deferred globals)
└─ src/
   ├─ main.ts               # boot order: eases → scroll → scenes → persistent layers
   ├─ core/
   │  ├─ data.ts            # THE only module reading slate.json + formatters
   │  ├─ motion.ts          # Lenis, reduced-motion switch, reveal helpers
   │  ├─ grades.ts          # five-grade colour arc + burn/flash cues
   │  ├─ ticker.ts          # the timecode strip
   │  └─ effects.ts         # cursor light + projector dust (canvas)
   ├─ scenes/               # one file per scene, in scroll order
   │  ├─ hero.ts            # cold open: beam + title + certificate stats
   │  ├─ act1-wall.ts       # thesis fragments + the sortable poster wall
   │  ├─ act2-cut.ts        # the $100M gross sliced under scroll (pinned)
   │  ├─ act2-tail.ts       # dot histogram with axis break + FIVE landing
   │  ├─ act3-line.ts       # histogram→scatter morph + draw-the-line
   │  ├─ act3-budget.ts     # budget bands
   │  ├─ act3-fund.ts       # cumulative fund curve
   │  ├─ verdict.ts         # quadrant + the generated closing line
   │  └─ credits.ts         # interactive assumptions register
   └─ styles/
      ├─ tokens.css         # DESIGN TOKENS — single source of truth
      ├─ base.css           # reset, persistent layers, type primitives
      ├─ hero.css           # the cold open
      └─ scenes.css         # all set pieces, banner-commented per scene
```

## Accessibility & motion

- `prefers-reduced-motion` gives a composed static cut (no Lenis, no entrances, final frames).
- All interactions have a non-pointer path (Draw-the-Line has "Just show me"; posters are real buttons; the register uses `<details>`; Escape closes the film card).
- Decorative layers are `aria-hidden`; charts carry descriptive labels.

## Notes

- The GSAP files in `public/vendor/` are the ones stashed in `assets-stash/` (Club plugins — don't publish them to a public CDN).
- The scatter's opening formation intentionally mirrors the tail's dot histogram — if you change the tail's binning, update `histoPos` in `act3-line.ts` to match.
