# The Slate — Analysis Whitepaper

**A portfolio-theoretic study of A24's filmography**
*Analytical specification. Version 1.0.*

---

## 0. How to read this document

This is the **analysis blueprint** — it defines the research question, every variable you will collect or derive, the exact formulas, the statistical tests, the assumptions, and the shape of the data you hand to the front end. It is deliberately design-free; the visual system is a separate document.

It is written so that you can defend any single number in an interview. Where a choice is arguable, the whitepaper states the choice, the reason, and the alternative — because *the ability to justify an assumption* is the skill being demonstrated, more than the code.

The document is organised as a funnel: thesis → framework → data → derived metrics → models → tests → robustness → outputs → build sequence.

---

## 1. Thesis and research questions

### 1.1 The central claim

> A film studio does not "make films." It allocates capital across a portfolio of risky, illiquid bets. A24's filmography is therefore a portfolio, and every instrument of portfolio analysis — expected return, variance, skew, diversification, risk-adjusted return, factor attribution — applies to it.

### 1.2 The question the project actually answers

> **Does critical acclaim pay?** Or is prestige a consumption good that A24 funds out of the profits of a small number of commercial hits?

This is the spine. It is a *falsifiable* empirical question, which is what makes the project research rather than commentary. It resolves into three testable hypotheses:

- **H1 (Skew).** Film-level returns are heavily right-skewed: a minority of titles generate the majority of profit. *(Expected: strongly supported.)*
- **H2 (Acclaim–profit divergence).** Critical score has a weak and statistically insignificant relationship with financial return, once budget and genre are controlled for. *(This is the headline hypothesis.)*
- **H3 (Genre/format factors dominate).** Financial return is driven more by structural factors — genre (esp. horror), budget discipline, originality — than by critical quality. *(Expected: horror over-indexes on ROI.)*

Each hypothesis maps to a specific test in §6. Report the result whichever way it falls — a *rejected* H2 (acclaim does pay) is an equally strong finding and an equally good story.

### 1.3 Scope

- **Subject:** A24 theatrical releases, 2013 (founding) to the most recent complete year at time of analysis.
- **Unit of analysis:** the individual film (cross-sectional) and the release-year slate (time-series). Both levels are used — see §5.
- **Currency:** USD throughout (global box office is reported in USD).
- **Out of scope for v1:** TV/streaming original series, acquired-for-distribution-only titles where A24 took no production risk (flag these; optionally include as a separate "distribution-only" cohort).

---

## 2. Conceptual framework — the finance mapping

Every concept below is a recognisable finance primitive. This table is the Rosetta Stone of the project; the analysis is just its rows made quantitative.

| Film-world object | Finance analogue | What you compute |
|---|---|---|
| A single film | A position / a single investment | Capital in, revenue out, return |
| Production budget + marketing | Invested capital (cost basis) | See §4.2 |
| Box office + downstream | Realised revenue | See §4.3 |
| One year's releases | A vintage / annual fund cohort | Capital-weighted annual return |
| Whole filmography | The portfolio / the fund | Distribution, Sharpe-analogue, drawdown |
| Genre / format / budget band | Factors | Regression loadings (§6.3) |
| A runaway hit | The tail / the power-law winner | Skew, Gini, tail index (§6.1) |
| A flop | A total loss position | VaR, downside deviation (§6.4) |

**The one framing that makes a recruiter lean in:** a film slate has the same return structure as a **venture-capital fund** — most bets return little or lose money, a handful of outliers carry the entire vehicle. Stating and *measuring* this parallel (via skew and the Gini/concentration metrics) is the intellectual centre of the piece.

---

## 3. Data

### 3.1 Sources

| Source | Role | Access | Fields used |
|---|---|---|---|
| **TMDB API** | Primary spine | Free API key, generous limits | budget, revenue, genres, release date, runtime, original vs. based-on, production companies, cast/crew |
| **OMDb API** | Critical scores | Free tier (1k/day) | IMDb rating, Metascore, Rotten Tomatoes, awards string |
| **The Numbers** / **Box Office Mojo** | Box-office cross-check | Web (scrape/manual) | domestic vs. international split, more authoritative grosses |
| **Wikipedia / A24 filmography** | Canonical title list & seed | Web | the master list of what to include, festival premiere info |

**Collection order:** seed the master film list from A24's documented filmography → resolve each title to a TMDB ID → pull TMDB fields → enrich with OMDb by IMDb ID → cross-check the largest grosses against The Numbers to catch TMDB errors on the titles that matter most.

### 3.2 The raw schema (one row per film)

```
film_id            TMDB id (primary key)
imdb_id            for OMDb join
title
release_date
release_year
runtime_min
genres             list (TMDB) → later reduced to a primary genre
is_original        bool: original screenplay vs. adaptation/sequel/remake
festival_premiere  bool + name (Sundance/Cannes/Venice/TIFF) where known
budget_usd         production budget (negative cost)
domestic_gross_usd
intl_gross_usd
worldwide_gross_usd
imdb_rating        0–10
metascore          0–100
rt_critics         0–100 (if available)
awards_raw         OMDb awards string (parse later)
distribution_only  bool: A24 distributed but did not fund production
data_flags         list of quality flags (see §3.4)
```

### 3.3 Data-quality reality (write this into the paper, don't hide it)

Two structural gaps define the modelling work:

1. **Marketing spend (P&A) is essentially never disclosed.** You cannot look it up. You *model* it (§4.2). This is not a flaw — estimating undisclosed cost inputs under stated assumptions is exactly what an analyst does.
2. **Box office gross is not studio revenue.** Cinemas keep roughly half of domestic ticket money. Converting gross → studio revenue requires the rental-rate model (§4.3).

Plus the ordinary caveats: TMDB budget/revenue is crowd-sourced and least reliable for small platform releases; some A24 titles are distribution-only; a few very recent films will have incomplete grosses.

### 3.4 Data flags

Tag every film with quality flags rather than silently dropping rows. Suggested flags: `no_budget`, `no_revenue`, `low_confidence_budget`, `still_in_release`, `distribution_only`, `limited_release`. The analysis then runs on a clean core sample and you report how conclusions change if flagged rows are included. Transparency about the sample *is* the rigour.

---

## 4. Variable definitions and the cost/revenue model

This section is the heart of the "I understand the mechanics" claim. Every derived figure is defined here.

### 4.1 Inflation adjustment

Deflate all absolute dollar figures to constant (real) USD of a chosen base year using US CPI, so budgets and grosses are comparable across 2013–present.

Note that **ROI and revenue multiple are within-film ratios**, so first-order inflation cancels and they need no deflation. Deflation matters for (a) comparing *absolute* budgets across years and (b) any time-series of dollar profit. State this explicitly — it shows you understand when adjustment is and isn't needed.

### 4.2 Invested capital (cost basis)

```
cost = production_budget + P&A
```

Production budget comes from data. **P&A (Prints & Advertising, i.e. marketing) is modelled**, because it is not disclosed. Use a release-scaled multiplier of budget:

```
P&A = k × production_budget
```

with `k` depending on release width:

- **Wide release:** k = 1.0 (base case), i.e. marketing ≈ production budget — the standard industry rule of thumb.
- **Platform / limited release** (typical A24 prestige title): k = 0.5, reflecting cheaper targeted campaigns.

Every P&A figure is therefore an **assumption, logged in the assumptions register (§7)** and stress-tested in the sensitivity analysis (§8). Do not present a single "true" profit; present profit *under stated assumptions*.

### 4.3 Realised revenue (studio's share)

Box office gross overstates what the studio receives. Convert via **theatrical rental rates**:

```
theatrical_studio_revenue
    = domestic_gross × r_dom
    + intl_gross     × r_intl
```

Base-case rental rates:

- **r_dom = 0.50** (US exhibitors retain roughly half over a run).
- **r_intl = 0.40** (international splits are less favourable to the distributor).

Theatrical is not the whole story — home entertainment, TV and streaming licensing add a **downstream / ancillary** layer that is even harder to observe. Model it as a multiplier on theatrical revenue:

```
total_studio_revenue = theatrical_studio_revenue × (1 + a)
```

with ancillary factor `a` as a base-case assumption (e.g. a = 0.5, i.e. downstream adds ~50% on top of theatrical). This too goes in the assumptions register and is stress-tested. A conservative alternative is a **theatrical-only** model (a = 0), which you should also report — it is the most defensible lower bound and avoids over-claiming.

### 4.4 Return metrics (per film)

```
profit          = total_studio_revenue − cost
roi             = profit / cost                      # e.g. +1.5 = +150%
revenue_multiple= total_studio_revenue / cost        # VC-style "x" multiple
log_multiple    = ln(revenue_multiple)               # for distribution/regression
```

`roi` is the primary return variable. `log_multiple` is preferred as the regression dependent variable because it is more symmetric and tames the extreme right tail (see §6.3). Note the natural floor: a film can lose at most its cost, so `roi ≥ −1` (−100%). This bounded-downside / unbounded-upside shape is *exactly* the payoff asymmetry that produces the venture-style distribution.

### 4.5 Success classification (for the quadrant analysis)

Two binary axes, each split at a defensible threshold:

- **Commercially successful:** `revenue_multiple ≥ 1` (broke even or better) — or a stricter `≥ 2` bar, reported both ways.
- **Critically acclaimed:** `metascore ≥ 70` (a conventional "generally favourable" cut) — report sensitivity to 65/75 too.

The 2×2 gives the four archetypes that become a centrepiece of the narrative:

| | Profitable | Unprofitable |
|---|---|---|
| **Acclaimed** | *The dream* (art + commerce) | *The subsidised prestige* |
| **Not acclaimed** | *The cash cow* | *The miss* |

If H2 holds, the "subsidised prestige" and "cash cow" cells will be well-populated — visual proof that acclaim and profit are decoupled.

---

## 5. Two levels of analysis

A subtle but important rigour point that elevates the project:

**Cross-sectional (film-level).** N ≈ 100 films, each an observation. Used for: the return distribution (§6.1), the factor regression (§6.3), the quadrant analysis, film-level VaR. This is where H2 and H3 are tested.

**Time-series (slate-year-level).** ~12 annual observations (2013→present). For each year compute the **capital-weighted slate return**:

```
slate_return_year = Σ_i (profit_i) / Σ_i (cost_i)     for films i released in that year
```

Used for: a genuine time-series Sharpe, cumulative "fund value" curve, maximum drawdown, and the closing "if A24 were a fund, here is its track record" synthesis. This matters because a Sharpe ratio computed across a *cross-section* of films is only an analogue (the films aren't sequential returns); computed across *annual slate returns* it is a proper time-series Sharpe. Be explicit about which is which — conflating them is a classic error and distinguishing them signals real understanding.

---

## 6. The models

### 6.1 Return distribution (tests H1)

Compute on film-level `roi` and `log_multiple`:

- **Moments:** mean, median, standard deviation, **skewness**, **excess kurtosis**. Expect mean ≫ median and large positive skew.
- **Concentration / Gini:** what share of total portfolio profit comes from the top-decile films. Report the Lorenz curve and Gini coefficient of profit. This is the "hits carry the fund" claim, quantified.
- **Tail behaviour:** fit a **log-normal** and test whether the upper tail follows a **power law (Pareto)**. This connects to the established finding (De Vany & Walls) that box-office outcomes are heavy-tailed / near-Lévy-stable. Even a qualitative log-log tail plot is enough to make the point credibly at this level.
- **Deliverable statistic:** "the top X% of A24 films by profit account for Y% of total portfolio profit."

### 6.2 Portfolio risk–return (the Sharpe-analogue)

- **Expected return:** mean `roi` (film-level) and mean `slate_return` (year-level).
- **Risk:** standard deviation of the same.
- **Sharpe-analogue:**
  ```
  Sharpe = (mean_return − r_f) / std_return
  ```
  Use `r_f ≈ 0` for the film-level cross-sectional version (and *label it a Sharpe-analogue*), and a real short-term T-bill average for the year-level time-series version. Interpret: is A24's "many small prestige bets" a high-Sharpe strategy, or a low-return one wearing good taste?
- **Diversification view:** split the portfolio by genre and by budget band; show return and risk per sub-portfolio. Does A24 diversify effectively, or is it concentrated in low-return prestige drama subsidised by occasional horror?

### 6.3 Factor regression (tests H2 and H3)

The core inferential model. OLS with heteroskedasticity-robust (White) standard errors:

```
log_multiple_i = β0
               + β1 · ln(budget_i)
               + β2 · metascore_i            # THE acclaim coefficient
               + β3 · is_original_i
               + β4 · festival_premiere_i
               + Σ  γ_g · genre_dummy_{g,i}   # horror, drama, comedy, thriller, ...
               + Σ  δ_t · year_dummy_{t,i}    # controls for time trend / cohort
               + ε_i
```

- **Dependent variable:** `log_multiple` (symmetric, tames the tail). Report a robustness run with `roi` as DV.
- **The money coefficient is β2 (metascore).** H2 predicts β2 is small and statistically insignificant. Report its point estimate, robust SE, p-value, and the standardised (beta) coefficient so its magnitude is comparable to the others.
- **H3 read-off:** the genre dummies (esp. horror) and `ln(budget)`. Expect horror positive and significant; expect large budgets to *reduce* the multiple (harder to earn back).
- **Diagnostics:** report R², check multicollinearity (VIF — budget and genre may correlate), residual plots. With N≈100 and several dummies, keep the model parsimonious; note the small-sample caveat.

**Complementary non-parametric check (don't rely on OLS alone):**
- **Spearman rank correlation** between `metascore` and `roi` — robust to the non-normal return distribution and the natural choice for the headline "does acclaim track profit?" number.
- Report Pearson too, but lead with Spearman and explain why.

### 6.4 Downside risk

Returns are skewed, so symmetric variance understates what matters. Add:

- **Empirical VaR:** the 5th-percentile `roi` — "5% of A24 films return worse than −Z%." Bounded below by −100%.
- **Downside deviation** and a **Sortino-analogue** (return per unit of *downside* risk) — more honest than Sharpe for skewed payoffs.
- **Maximum drawdown** on the cumulative year-level "fund value" curve — the worst peak-to-trough run of slate performance.

### 6.5 Optional extension — the Blumhouse contrast

Once the A24 pipeline works, re-run the *entire* metric set on Blumhouse (the low-budget horror studio) as a second portfolio. The comparison — high-variance prestige generalist vs. disciplined-budget horror specialist — turns a single-portfolio study into a comparative one and sharpens every finding. Keep it strictly as v2; ship one clean portfolio first.

---

## 7. Assumptions register

Maintain this as a literal table in the repo and in the paper. Every modelled number traces to a row here. This register *is* the analytical maturity of the project.

| ID | Assumption | Base case | Range tested (§8) | Rationale |
|----|-----------|-----------|-------------------|-----------|
| A1 | Wide-release P&A multiplier `k` | 1.0 | 0.5 – 1.5 | Industry rule of thumb: marketing ≈ budget |
| A2 | Platform-release P&A `k` | 0.5 | 0.3 – 0.8 | Cheaper targeted campaigns |
| A3 | Domestic rental rate `r_dom` | 0.50 | 0.45 – 0.55 | Exhibitors retain ~half over a run |
| A4 | Intl rental rate `r_intl` | 0.40 | 0.35 – 0.45 | Less favourable foreign splits |
| A5 | Ancillary factor `a` | 0.5 | 0.0 – 1.0 | Downstream (home/TV/SVOD) revenue |
| A6 | Break-even threshold | multiple ≥ 1 | ≥1 and ≥2 | Definition of "commercial success" |
| A7 | Acclaim threshold | metascore ≥ 70 | 65 – 75 | "Generally favourable" cut |

---

## 8. Sensitivity and robustness

The single most important methodological move: **show your conclusions survive your assumptions.**

- **One-at-a-time sweeps:** vary each of A1–A5 across its range, holding others at base; record how the headline numbers move (mean ROI, Sharpe, the β2 acclaim coefficient, the top-decile profit share).
- **Corner scenarios:** run the full analysis under (i) **theatrical-only, conservative** (a=0, low k, low rentals) and (ii) **generous** (high a, high rentals). If H2 (acclaim–profit decoupling) holds in *both*, the finding is robust and you say so plainly.
- **Sample robustness:** rerun excluding `low_confidence_budget` and `still_in_release` films; rerun including/excluding `distribution_only`.
- **Specification robustness:** regression with `roi` vs. `log_multiple` DV; with and without year dummies; primary-genre vs. multi-genre coding.

Deliver a compact **tornado-style table** of "how much does the headline conclusion move when each assumption flexes." That table is what separates this from a hobby project.

---

## 9. Known limitations (state them, don't bury them)

- **Endogeneity of budget:** studios set budgets on expected returns, so `budget` is not exogenous; the regression is descriptive/associational, not causal. Say so.
- **Survivorship:** you only observe greenlit films, not the projects killed in development — the realised distribution is conditional on being made.
- **Reverse causality with awards:** awards follow release and success, so treat `awards_raw` as an outcome, not a predictor (hence it is not in the regression).
- **Small n, thin genre cells:** ~100 films across many genres limits statistical power; report confidence intervals, resist over-fitting.
- **Data provenance:** crowd-sourced budgets/grosses, modelled P&A and ancillary. The sensitivity analysis is the mitigation.

A reader who sees these listed trusts the numbers *more*, not less.

---

## 10. Output contract — the JSON the front end consumes

The analysis layer's only job is to emit clean, documented JSON. The front end (separate design doc) reads exactly this. Freeze this schema before writing front-end code.

```jsonc
{
  "meta": {
    "generated_at": "ISO-8601",
    "n_films": 0,
    "date_range": ["2013", "20XX"],
    "base_year_cpi": 2025,
    "assumptions": { "k_wide": 1.0, "k_platform": 0.5,
                     "r_dom": 0.5, "r_intl": 0.4, "a": 0.5 }
  },

  "films": [
    {
      "title": "", "year": 0, "primary_genre": "",
      "is_original": true, "festival_premiere": "Sundance|null",
      "budget_real": 0, "cost_real": 0,
      "studio_revenue_real": 0, "profit_real": 0,
      "roi": 0.0, "revenue_multiple": 0.0,
      "metascore": 0, "rt_critics": 0, "imdb_rating": 0.0,
      "quadrant": "dream|subsidised|cashcow|miss",
      "flags": []
    }
  ],

  "distribution": {
    "mean_roi": 0.0, "median_roi": 0.0, "std_roi": 0.0,
    "skewness": 0.0, "excess_kurtosis": 0.0,
    "gini_profit": 0.0,
    "top_decile_profit_share": 0.0,
    "lorenz": [[0,0], [0.1, 0.0], "..."]
  },

  "portfolio": {
    "sharpe_analogue_film": 0.0,
    "sharpe_timeseries_year": 0.0,
    "sortino": 0.0,
    "var_5pct_roi": 0.0,
    "max_drawdown": 0.0,
    "by_genre":  [{ "genre": "", "mean_roi": 0.0, "std_roi": 0.0, "n": 0 }],
    "by_budget_band": [{ "band": "", "mean_roi": 0.0, "std_roi": 0.0, "n": 0 }]
  },

  "slate_timeseries": [
    { "year": 0, "n": 0, "capital": 0, "profit": 0,
      "slate_return": 0.0, "cumulative_fund_value": 0.0 }
  ],

  "regression": {
    "dependent": "log_multiple",
    "n": 0, "r_squared": 0.0,
    "terms": [
      { "name": "metascore", "coef": 0.0, "robust_se": 0.0,
        "p_value": 0.0, "std_beta": 0.0 }
    ],
    "spearman_acclaim_roi": { "rho": 0.0, "p_value": 0.0 },
    "pearson_acclaim_roi":  { "r": 0.0, "p_value": 0.0 }
  },

  "sensitivity": [
    { "assumption": "a", "value": 0.0,
      "mean_roi": 0.0, "sharpe": 0.0, "beta_metascore": 0.0 }
  ]
}
```

---

## 11. Build sequence (analysis layer only)

Mirror Escape Velocity's split: **Python does the thinking, emits JSON; the front end only renders.** Keep every step readable and commented so you can narrate it in an interview.

1. **Collect.** Seed the A24 title list → resolve TMDB IDs → pull TMDB fields → enrich via OMDb → cross-check top grosses against The Numbers. Cache raw pulls to disk so you never re-hit the APIs. `pandas` for the table, `requests` for the calls.
2. **Clean & flag.** Normalise genres to a single primary genre, code `is_original` and `festival_premiere`, attach `data_flags`. Do *not* drop flagged rows — mark them.
3. **Deflate.** Apply CPI to absolute dollar fields; add `_real` columns.
4. **Model cost & revenue.** Implement §4.2–4.3 as pure functions of the assumption dict, so a single dict swap re-runs everything under new assumptions (this makes §8 trivial).
5. **Derive returns.** `profit`, `roi`, `revenue_multiple`, `log_multiple`, `quadrant`.
6. **Distribution stats.** Moments, Gini, Lorenz, top-decile share, tail plot. (`numpy`, `scipy.stats`.)
7. **Portfolio & risk.** Film-level and year-level Sharpe, Sortino, VaR, max drawdown, by-genre / by-budget breakdowns.
8. **Regression.** `statsmodels` OLS with robust SEs; Spearman/Pearson; VIF diagnostics.
9. **Sensitivity loop.** Re-run steps 4–8 across the assumption ranges; collect the `sensitivity` array.
10. **Emit JSON.** Validate against the §10 contract. This file is the single handoff to the design build.

**Suggested stack:** Python 3, `pandas`, `numpy`, `scipy`, `statsmodels`, `requests`. Prototype charts in `matplotlib`/`plotly` only to sanity-check — the real visuals come later from the JSON.

---

## 12. What "done" looks like for the analysis

You can state, with a number and a confidence interval behind each:

1. The share of A24's total profit generated by its top handful of films (H1).
2. The Spearman correlation and the regression coefficient linking acclaim to return, with significance (H2) — the headline.
3. Which factors actually drive returns, horror and budget foremost (H3).
4. A24's risk-adjusted return as a "fund," with its worst drawdown year.
5. A one-line, defensible answer to *"does making good films pay?"* — and a sensitivity table proving that answer doesn't flip when your assumptions do.

That is the finding. Everything the design layer does afterwards is in service of telling it beautifully.
