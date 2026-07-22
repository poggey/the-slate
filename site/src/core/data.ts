/**
 * DATA — the only module that touches slate.json.
 * Everything numeric on the page flows through here, so every figure
 * is traceable to output/slate.json (which the notebooks regenerate).
 */
import slate from '@data/slate.json'

export interface Film {
  title: string
  year: number
  primary_genre: string
  is_original: boolean
  festival_premiere: string | null
  budget_real: number
  cost_real: number
  studio_revenue_real: number
  profit_real: number
  roi: number
  revenue_multiple: number
  metascore: number | null
  rt_critics: number | null
  imdb_rating: number | null
  quadrant: 'dream' | 'subsidised' | 'cashcow' | 'miss' | null
  in_core: boolean
  flags: string[]
}

export interface SlateYear {
  year: number
  n: number
  capital: number
  profit: number
  slate_return: number
  cumulative_fund_value: number
}

export interface RegressionTerm {
  name: string
  coef: number
  robust_se: number
  p_value: number
  std_beta: number | null
}

export interface SensitivityRun {
  assumption: string
  value: number | null
  mean_roi: number
  sharpe: number
  beta_metascore: number
  p_metascore: number
  top_decile_share: number
}

const data = slate as unknown as {
  meta: {
    generated_at: string
    n_films: number
    date_range: [string, string]
    base_year_cpi: number
    assumptions: { k_wide: number; k_platform: number; r_dom: number; r_intl: number; a: number }
  }
  films: Film[]
  distribution: {
    mean_roi: number; median_roi: number; std_roi: number
    skewness: number; excess_kurtosis: number
    gini_profit: number; top_decile_profit_share: number
    lorenz: [number, number][]
  }
  portfolio: {
    sharpe_analogue_film: number; sharpe_timeseries_year: number
    sortino: number; var_5pct_roi: number; max_drawdown: number
    by_genre: { genre: string; mean_roi: number; std_roi: number | null; n: number }[]
    by_budget_band: { band: string; mean_roi: number; std_roi: number | null; n: number }[]
  }
  slate_timeseries: SlateYear[]
  regression: {
    dependent: string; n: number; r_squared: number
    terms: RegressionTerm[]
    spearman_acclaim_roi: { rho: number; p_value: number }
    pearson_acclaim_roi: { r: number; p_value: number }
  }
  sensitivity: SensitivityRun[]
}

export const meta = data.meta
export const distribution = data.distribution
export const portfolio = data.portfolio
export const timeseries = data.slate_timeseries
export const regression = data.regression
export const sensitivity = data.sensitivity

/** All films, and the clean core sample the stats are computed on. */
export const films: Film[] = data.films
export const core: Film[] = films
  .filter((f) => f.in_core)
  .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title))

/* ---------- Derived headline figures ---------- */

export const capitalCore = core.reduce((s, f) => s + f.cost_real, 0)
export const profitCore = core.reduce((s, f) => s + f.profit_real, 0)
export const grossPositiveProfit = core.reduce((s, f) => s + Math.max(0, f.profit_real), 0)

export const topByProfit = [...core].sort((a, b) => b.profit_real - a.profit_real)
export const topFive = topByProfit.slice(0, 5)
export const topFiveShare = topFive.reduce((s, f) => s + f.profit_real, 0) / grossPositiveProfit

export const pctProfitable = core.filter((f) => f.profit_real > 0).length / core.length

export const metascoreTerm = regression.terms.find((t) => t.name === 'metascore')!
export const budgetTerm = regression.terms.find((t) => t.name === 'ln_budget')!
export const horrorTerm = regression.terms.find((t) => t.name === 'g_Horror')

/** Is the headline finding "acclaim pays"? (copy templates branch on this) */
export const acclaimPays = metascoreTerm.coef > 0 && metascoreTerm.p_value < 0.05
/** e^(10·β): the multiple uplift per +10 Metascore points */
export const upliftPerTenMeta = Math.exp(10 * metascoreTerm.coef)

/** β_metascore stability across every sensitivity run — the robustness claim */
export const betaRange: [number, number] = [
  Math.min(...sensitivity.map((s) => s.beta_metascore)),
  Math.max(...sensitivity.map((s) => s.beta_metascore)),
]
export const pMax = Math.max(...sensitivity.map((s) => s.p_metascore))

/** Scatter sample: core films with a metascore and a positive multiple (log-safe). */
export const scatterFilms = core.filter(
  (f) => f.metascore != null && f.revenue_multiple > 0,
)

/** Simple bivariate OLS of ln(multiple) on metascore — the honest raw
 *  relationship shown in Draw-the-Line (full-model β cited alongside). */
export function fitAcclaimLine() {
  const pts = scatterFilms.map((f) => [f.metascore as number, Math.log(f.revenue_multiple)])
  const n = pts.length
  const mx = pts.reduce((s, p) => s + p[0], 0) / n
  const my = pts.reduce((s, p) => s + p[1], 0) / n
  let sxx = 0, sxy = 0
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my) }
  const slope = sxy / sxx
  const intercept = my - slope * mx
  // residual SE for a simple confidence band
  let sse = 0
  for (const [x, y] of pts) sse += (y - (intercept + slope * x)) ** 2
  const sigma = Math.sqrt(sse / (n - 2))
  const seAt = (x: number) => sigma * Math.sqrt(1 / n + ((x - mx) ** 2) / sxx)
  return { slope, intercept, seAt, n, mx }
}

/** ROI histogram for The Tail (unit-width bins from -1 upward). */
export function roiHistogram() {
  const rois = core.map((f) => f.roi)
  const max = Math.max(...rois)
  const bins: { x0: number; x1: number; n: number; films: Film[] }[] = []
  for (let x = -1; x < Math.ceil(max); x += 1) {
    const inBin = core.filter((f) => f.roi >= x && f.roi < x + 1)
    bins.push({ x0: x, x1: x + 1, n: inBin.length, films: inBin })
  }
  return bins
}

export const quadrantCounts = {
  dream: core.filter((f) => f.quadrant === 'dream').length,
  subsidised: core.filter((f) => f.quadrant === 'subsidised').length,
  cashcow: core.filter((f) => f.quadrant === 'cashcow').length,
  miss: core.filter((f) => f.quadrant === 'miss').length,
}

export const peakFund = timeseries.reduce((a, b) =>
  b.cumulative_fund_value > a.cumulative_fund_value ? b : a,
)
export const lastFund = timeseries[timeseries.length - 1]

/* ---------- Formatters ---------- */

export const fmtMoney = (v: number): string => {
  const a = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B`
  if (a >= 1e6) return `${sign}$${Math.round(a / 1e6)}M`
  return `${sign}$${Math.round(a / 1e3)}K`
}
export const fmtPct = (v: number, dp = 0): string =>
  `${v < 0 ? '−' : '+'}${Math.abs(v * 100).toFixed(dp)}%`
export const fmtMult = (v: number, dp = 1): string => `${v.toFixed(dp)}×`
export const fmtNum = (v: number, dp = 2): string => v.toFixed(dp)

/** Fill every [data-bind] span with its value. */
export function bindAll(root: ParentNode = document) {
  const values: Record<string, string> = {
    nFilms: String(films.length),
    nCore: String(core.length),
    capital: fmtMoney(capitalCore),
    netProfit: fmtMoney(profitCore),
  }
  root.querySelectorAll<HTMLElement>('[data-bind]').forEach((el) => {
    const key = el.dataset.bind!
    if (values[key] != null) el.textContent = values[key]
  })
}
