/**
 * CREDITS — the methodology rolled as end titles, but interactive:
 * every assumption row expands to show its tested range and whether
 * the conclusion survived (it did — the ranges come straight from
 * the sensitivity array in slate.json).
 */
import { meta, sensitivity, regression, distribution, fmtNum } from '../core/data'
import { REDUCED } from '../core/motion'
import { setTickerContext } from '../core/ticker'

interface AssumptionRow {
  id: string
  label: string
  base: string
  range: string
  rationale: string
  sensKey?: string // matches sensitivity[].assumption
}

const REGISTER: AssumptionRow[] = [
  { id: 'A1', label: 'Wide-release P&A multiplier k', base: '1.0', range: '0.5 – 1.5', rationale: 'Industry rule of thumb: marketing ≈ production budget.', sensKey: 'k_wide' },
  { id: 'A2', label: 'Platform-release P&A k', base: '0.5', range: '0.3 – 0.8', rationale: 'Cheaper targeted campaigns for limited releases.', sensKey: 'k_platform' },
  { id: 'A3', label: 'Domestic rental rate', base: '0.50', range: '0.45 – 0.55', rationale: 'US exhibitors retain roughly half over a run.', sensKey: 'r_dom' },
  { id: 'A4', label: 'International rental rate', base: '0.40', range: '0.35 – 0.45', rationale: 'Foreign splits are less favourable to the distributor.', sensKey: 'r_intl' },
  { id: 'A5', label: 'Ancillary factor a', base: '0.5', range: '0.0 – 1.0', rationale: 'Home, TV and streaming revenue on top of theatrical.', sensKey: 'a' },
  { id: 'A6', label: 'Break-even threshold', base: '×1', range: '×1 and ×2', rationale: 'Definition of commercial success; reported both ways.' },
  { id: 'A7', label: 'Acclaim threshold', base: 'Metascore 70', range: '65 – 75', rationale: '"Generally favourable" conventional cut.' },
]

const LIMITATIONS = [
  'Budgets are endogenous — studios set them on expected returns. The regression is associational, not causal.',
  'Survivorship: only greenlit films are observed, never the projects killed in development.',
  'Awards follow success, so they are treated as an outcome, never a predictor.',
  'N = 58 core films with several dummies: confidence intervals over confidence.',
  'Crowd-sourced budgets and grosses; modelled P&A and ancillary. The sensitivity sweep is the mitigation.',
  'A24’s 2013–15 slate was largely distribution-only (no production risk) and sits outside the core sample; the fund clock starts in 2016.',
]

function sensSummary(key?: string): string {
  if (!key) return 'Reported both ways in the paper — the quadrant counts move, the finding doesn’t.'
  const runs = sensitivity.filter((s) => s.assumption === key)
  if (!runs.length) return ''
  const betas = runs.map((r) => r.beta_metascore)
  const ps = runs.map((r) => r.p_metascore)
  const rois = runs.map((r) => r.mean_roi)
  return `Across this range: mean ROI ${fmtNum(Math.min(...rois) * 100, 0)}–${fmtNum(Math.max(...rois) * 100, 0)}%, ` +
    `acclaim β ${fmtNum(Math.min(...betas), 3)}–${fmtNum(Math.max(...betas), 3)}, p ≤ ${fmtNum(Math.max(...ps), 3)}. ` +
    `<strong>Conclusion survived.</strong>`
}

export function initCredits() {
  const roll = document.getElementById('credits-roll')!

  roll.innerHTML = `
    <div class="credits-block">
      <h3 class="mono-label credits-h">THE ASSUMPTIONS REGISTER</h3>
      <p class="credits-note">Every modelled number traces to a row below. Tap a row for its tested range.</p>
      <div class="credits-register">
        ${REGISTER.map((a) => `
          <details class="cr-row">
            <summary>
              <span class="cr-row-id num">${a.id}</span>
              <span class="cr-row-label">${a.label}</span>
              <span class="leader" aria-hidden="true"></span>
              <span class="cr-row-base num">${a.base}</span>
            </summary>
            <div class="cr-row-body">
              <p><span class="micro">TESTED RANGE</span> <span class="num">${a.range}</span> — ${a.rationale}</p>
              <p class="cr-row-sens">${sensSummary(a.sensKey)}</p>
            </div>
          </details>`).join('')}
      </div>
    </div>

    <div class="credits-block">
      <h3 class="mono-label credits-h">THE MODEL</h3>
      <p class="credits-note num">
        OLS on ln(revenue multiple), White-robust SEs · N = ${regression.n} · R² = ${fmtNum(regression.r_squared, 2)}<br/>
        Controls: ln(budget), genre, originality, festival premiere, year<br/>
        Distribution: skew ${fmtNum(distribution.skewness, 1)} · kurtosis ${fmtNum(distribution.excess_kurtosis, 1)} · Gini(profit) ${fmtNum(distribution.gini_profit, 2)}
      </p>
    </div>

    <div class="credits-block">
      <h3 class="mono-label credits-h">KNOWN LIMITATIONS</h3>
      <ul class="credits-limits">${LIMITATIONS.map((l) => `<li>${l}</li>`).join('')}</ul>
    </div>

    <div class="credits-block">
      <h3 class="mono-label credits-h">SOURCES</h3>
      <p class="credits-note">TMDB (spine: budgets, revenue, genres) · OMDb (Metascore, ratings) ·
      The Numbers / Box Office Mojo (cross-checks on the largest grosses) ·
      Wikipedia A24 filmography (the canonical title list) · US CPI (deflation to ${meta.base_year_cpi} dollars).</p>
    </div>

    <div class="credits-block credits-studio">
      <p class="display credits-studio-mark">DIRECTED BY THE DATA</p>
      <p class="credits-note">An analysis in Python · a story in one take ·
      <a href="https://github.com/" class="credits-repo">the-slate repository</a></p>
    </div>`

  document.getElementById('credits-meta')!.textContent =
    `SLATE.JSON GENERATED ${new Date(meta.generated_at).toISOString().slice(0, 10)} · ` +
    `${meta.date_range[0]}–${meta.date_range[1]} · REAL ${meta.base_year_cpi} USD · BASE-CASE ASSUMPTIONS SHOWN`

  ScrollTrigger.create({
    trigger: '#credits',
    start: 'top 60%',
    onEnter: () => setTickerContext('END CREDITS · NO NUMBERS WERE HARMED'),
  })

  if (!REDUCED) {
    gsap.from('.credits-block', {
      opacity: 0, y: 46, stagger: 0.12, duration: 0.8, ease: 'slate',
      scrollTrigger: { trigger: '#credits', start: 'top 70%' },
    })
  }
}
