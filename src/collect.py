"""The Slate — build-sequence step 1 (whitepaper §11): data collection.

Assembles the raw, one-row-per-film dataset defined in whitepaper §3.2:

    seed the A24 title list  ->  resolve each title to a TMDB id
    ->  pull TMDB fields     ->  enrich with OMDb critical scores
    ->  write an inspectable CSV to data/processed/

Three rules govern everything in this file:

1.  **Cache first.** Every raw HTTP response is written verbatim to
    data/raw/ before anything is parsed from it. A rerun reads entirely
    from disk and makes zero API calls; delete a cache file to force a
    refetch of just that item.

2.  **Record gaps, never crash on them.** A film with no budget is data,
    not an error (whitepaper §3.3–3.4). Missing values become empty cells
    and the field name is listed in that row's `missing_fields` column.
    Analytical flagging (§3.4 data_flags) is deliberately NOT done here —
    that is step 2 of the build sequence.

3.  **Provenance over reconciliation.** The title list is seeded from two
    independent sources — Wikipedia's canonical filmography and TMDB's
    company tagging — and where they disagree we tag the row
    (`seed_source` = wiki / tmdb / both) rather than silently pick a
    winner. The disagreements are part of the data-quality story.
"""

import io
import json
import re
import sys
import time
from datetime import date
from pathlib import Path

import os

import pandas as pd
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_CSV = PROCESSED_DIR / "films_raw.csv"

WIKI_FILMOGRAPHY_URL = "https://en.wikipedia.org/wiki/List_of_A24_films"
TMDB_BASE = "https://api.themoviedb.org/3"
OMDB_BASE = "https://www.omdbapi.com/"

# TMDB's company id for A24. Found once via /search/company and pinned here
# so the seed is reproducible.
A24_TMDB_COMPANY_ID = 41077

# Scope (whitepaper §1.3): A24 theatrical releases from founding onward.
# We collect up to the run date; trimming to "most recent complete year"
# is a step-2 decision, made on the assembled table where it's visible.
FOUNDING_YEAR = 2013

# Politeness: a fixed pause between live requests keeps us far inside
# TMDB's rate allowance and is courteous to OMDb's 1k/day free tier.
# Cached reads skip the pause entirely, so reruns are instant.
REQUEST_PAUSE_S = 0.25
MAX_RETRIES = 4

SESSION = requests.Session()
# Wikipedia rejects the default python-requests user agent; identify ourselves.
SESSION.headers["User-Agent"] = (
    "the-slate/0.1 (personal film-finance research; padraig@zaltek.co.uk)"
)

# Counters so the run log can prove the cache is working ("0 fetched" on rerun).
FETCH_STATS = {"fetched": 0, "cached": 0}


# ---------------------------------------------------------------------------
# Stage 0 — keys and low-level fetch/cache helpers
# ---------------------------------------------------------------------------

def load_api_keys():
    """Read TMDB_API_KEY and OMDB_API_KEY from .env (or the environment).

    Fails fast with instructions rather than dying mid-run with a cryptic
    401 after the Wikipedia stage has already succeeded.
    """
    load_dotenv(PROJECT_ROOT / ".env")
    tmdb_key = os.getenv("TMDB_API_KEY")
    omdb_key = os.getenv("OMDB_API_KEY")
    missing = [name for name, val in
               [("TMDB_API_KEY", tmdb_key), ("OMDB_API_KEY", omdb_key)]
               if not val]
    if missing:
        sys.exit(
            f"Missing key(s) in {PROJECT_ROOT / '.env'}: {', '.join(missing)}\n"
            "Copy .env.example to .env and fill them in."
        )
    return tmdb_key, omdb_key


def polite_get(url, params=None):
    """GET with a fixed pause and bounded exponential backoff on 429/5xx.

    Retrying only throttle/server errors means a transient rate limit slows
    the run down instead of killing it, while a real client error (bad key,
    bad id) still surfaces immediately.
    """
    backoff = 1.0
    for attempt in range(MAX_RETRIES):
        time.sleep(REQUEST_PAUSE_S)
        resp = SESSION.get(url, params=params, timeout=30)
        if resp.status_code == 429 or resp.status_code >= 500:
            if attempt == MAX_RETRIES - 1:
                resp.raise_for_status()
            time.sleep(backoff)
            backoff *= 2
            continue
        resp.raise_for_status()
        return resp
    raise RuntimeError("unreachable")


def fetch_cached_text(cache_path: Path, fetch):
    """Return cached text if present, else call fetch() and cache the result."""
    if cache_path.exists():
        FETCH_STATS["cached"] += 1
        return cache_path.read_text()
    text = fetch()
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(text)
    FETCH_STATS["fetched"] += 1
    return text


def fetch_cached_json(cache_path: Path, fetch):
    """JSON twin of fetch_cached_text. The response is stored verbatim so the
    cache doubles as the permanent raw-data record for the whole project."""
    if cache_path.exists():
        FETCH_STATS["cached"] += 1
        return json.loads(cache_path.read_text())
    data = fetch()
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    FETCH_STATS["fetched"] += 1
    return data


def slugify(text):
    """Filesystem-safe cache filename from a film title."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "untitled"


def normalise_title(title):
    """Reduce a title to a comparison key: lowercase, alphanumerics only.

    Wikipedia and TMDB disagree on punctuation and diacritics constantly
    ("mother!" vs "Mother!", "Marcel the Shell with Shoes On"), so exact
    string equality would produce false 'wiki-only' films. Case/punctuation
    folding removes the noise while leaving genuinely different titles apart.
    """
    return re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()


# ---------------------------------------------------------------------------
# Stage 1a — seed from Wikipedia (the canonical list, whitepaper §3.1)
# ---------------------------------------------------------------------------

def seed_from_wikipedia():
    """Parse the 'List of A24 films' page into [{title, year}].

    Wikipedia is the *editorially curated* record of what counts as an A24
    film, which is why the whitepaper makes it the canonical seed. The cost
    is that we're parsing HTML tables meant for humans, so this function is
    deliberately defensive: any table it can't make sense of is skipped and
    reported, never fatal.
    """
    html = fetch_cached_text(
        RAW_DIR / "wikipedia" / "a24_filmography.html",
        lambda: polite_get(WIKI_FILMOGRAPHY_URL).text,
    )
    tables = pd.read_html(io.StringIO(html))

    films = []
    tables_used = 0
    for table in tables:
        # Flatten possible multi-level headers into plain strings.
        table.columns = [
            " ".join(str(level) for level in col) if isinstance(col, tuple) else str(col)
            for col in table.columns
        ]
        cols = {c.lower(): c for c in table.columns}
        title_col = next((cols[c] for c in cols if "title" in c), None)
        date_col = next((cols[c] for c in cols if "release" in c or "premiere" in c), None)
        # A table without both a title and a release-date column isn't a
        # filmography table (could be awards, TV, navboxes) — skip it.
        if title_col is None or date_col is None:
            continue
        tables_used += 1
        for _, row in table.iterrows():
            raw_title = str(row[title_col])
            if raw_title in ("nan", ""):
                continue
            # Strip footnote markers like [a] / [12] and daggers that
            # Wikipedia appends to titles.
            title = re.sub(r"\[[^\]]*\]", "", raw_title).replace("†", "").strip()
            if not title:
                continue
            # The release-date cell may be "July 21, 2017", "2024", or "TBA".
            # We only need the year, and only as a search hint later.
            year_match = re.search(r"(19|20)\d{2}", str(row[date_col]))
            year = int(year_match.group()) if year_match else None
            films.append({"title": title, "year": year})

    # The same film can appear in more than one table (e.g. released +
    # accolades); dedupe on the normalised title.
    seen = set()
    deduped = []
    for film in films:
        key = normalise_title(film["title"])
        if key not in seen:
            seen.add(key)
            deduped.append(film)

    print(f"[wiki]     {len(deduped)} unique titles from {tables_used} tables")
    return deduped


# ---------------------------------------------------------------------------
# Stage 1b — seed from TMDB discover (the machine-tagged list)
# ---------------------------------------------------------------------------

def seed_from_tmdb_discover(tmdb_key):
    """Every film TMDB tags with production company A24 -> [{tmdb_id, title, year}].

    This seed's virtue is that TMDB ids come for free (no fuzzy title
    resolution). Its weakness is that the tagging is crowd-sourced: it
    includes international-only pickups and distribution deals, and can
    miss real A24 titles. That's why it is unioned with Wikipedia rather
    than trusted alone.

    Note the pagination is cached page-by-page: a rerun months later will
    NOT see newly released films until data/raw/tmdb/discover/ is deleted.
    That's intentional — the cache is a snapshot, and reproducibility beats
    freshness for an analysis project.
    """
    results = []
    page = 1
    while True:
        data = fetch_cached_json(
            RAW_DIR / "tmdb" / "discover" / f"page_{page:03d}.json",
            lambda p=page: polite_get(
                f"{TMDB_BASE}/discover/movie",
                params={
                    "api_key": tmdb_key,
                    "with_companies": A24_TMDB_COMPANY_ID,
                    "include_adult": "false",
                    "sort_by": "primary_release_date.asc",
                    "page": p,
                },
            ).json(),
        )
        results.extend(data.get("results", []))
        if page >= data.get("total_pages", 1):
            break
        page += 1

    films = []
    for r in results:
        release = r.get("release_date") or ""
        films.append({
            "tmdb_id": r["id"],
            "title": r.get("title", ""),
            "year": int(release[:4]) if release[:4].isdigit() else None,
        })
    print(f"[tmdb]     {len(films)} films tagged with company id {A24_TMDB_COMPANY_ID}")
    return films


# ---------------------------------------------------------------------------
# Stage 2 — resolve titles to TMDB ids and union the two seeds
# ---------------------------------------------------------------------------

def resolve_title_to_tmdb(title, year, tmdb_key):
    """Resolve one Wikipedia title to a TMDB id via /search/movie.

    The search is deliberately NOT constrained by year. Wikipedia records
    the US theatrical year while TMDB's primary date is often the
    festival-premiere year, so a year-filtered search can exclude the right
    film entirely and leave only junk (e.g. "Climax" 2019 -> a wrestling
    event, because Noé's Climax is 2018 on TMDB). Instead we search open,
    then prefer an exact title whose year is within ±1 — the same tolerance
    the discover matching uses.

    Returns (tmdb_id, confidence) where confidence records HOW the match was
    made, because search resolution is the least trustworthy link in the
    chain (remakes and common titles can silently match the wrong film):

      search_exact             title matches exactly, year within ±1
      search_exact_other_year  title matches but the year doesn't — either
                               a re-release or a same-named different film
      search_top_result        no title match; took TMDB's top hit on faith —
                               check these by hand
      unresolved               nothing came back
    """
    hits = fetch_cached_json(
        RAW_DIR / "tmdb" / "search" / f"{slugify(title)}_any.json",
        lambda: polite_get(
            f"{TMDB_BASE}/search/movie",
            params={"api_key": tmdb_key, "query": title,
                    "include_adult": "false"},
        ).json(),
    ).get("results", [])
    if not hits:
        return None, "unresolved"

    def hit_year(hit):
        d = hit.get("release_date") or ""
        return int(d[:4]) if d[:4].isdigit() else None

    wanted = normalise_title(title)
    exact = [h for h in hits if normalise_title(h.get("title", "")) == wanted]
    if year:
        near = [h for h in exact
                if hit_year(h) is not None and abs(hit_year(h) - year) <= 1]
        if near:
            return near[0]["id"], "search_exact"
    if exact:
        return exact[0]["id"], ("search_exact_other_year" if year else "search_exact")
    return hits[0]["id"], "search_top_result"


def build_seed_list(wiki_films, discover_films, tmdb_key):
    """Union the two seeds into one master list with provenance tags.

    Matching order matters for API economy: a Wikipedia title that already
    appears in the discover list (matched on normalised title + year ±1)
    costs zero extra calls. Only genuinely wiki-only titles go through
    /search/movie. The ±1 year tolerance absorbs the festival-premiere vs
    theatrical-release discrepancy between the two sources.
    """
    discover_by_id = {f["tmdb_id"]: f for f in discover_films}
    discover_by_title = {}
    for f in discover_films:
        discover_by_title.setdefault(normalise_title(f["title"]), []).append(f)

    seeds = []
    matched_discover_ids = set()

    for wf in wiki_films:
        candidates = discover_by_title.get(normalise_title(wf["title"]), [])
        match = next(
            (c for c in candidates
             if wf["year"] is None or c["year"] is None
             or abs(c["year"] - wf["year"]) <= 1),
            None,
        )
        if match:
            matched_discover_ids.add(match["tmdb_id"])
            seeds.append({**wf, "tmdb_id": match["tmdb_id"],
                          "seed_source": "both",
                          "resolution_confidence": "discover_title_match"})
            continue

        tmdb_id, confidence = resolve_title_to_tmdb(wf["title"], wf["year"], tmdb_key)
        # Search can land on a film the discover list already had under a
        # different title variant — that's still agreement between sources.
        if tmdb_id in discover_by_id:
            matched_discover_ids.add(tmdb_id)
            source = "both"
        else:
            source = "wiki"
        seeds.append({**wf, "tmdb_id": tmdb_id, "seed_source": source,
                      "resolution_confidence": confidence})

    for f in discover_films:
        if f["tmdb_id"] not in matched_discover_ids:
            seeds.append({**f, "seed_source": "tmdb",
                          "resolution_confidence": "discover_only"})

    counts = pd.Series([s["seed_source"] for s in seeds]).value_counts().to_dict()
    print(f"[seed]     {len(seeds)} films after union — provenance: {counts}")
    return seeds


def filter_scope(seeds):
    """Apply the §1.3 scope on seed-level years BEFORE pulling details.

    Filtering here (on the cheap seed year) rather than after the detail
    pull saves an API call per out-of-scope film: TMDB's A24 tag includes
    pre-2013 back-catalogue and not-yet-released titles. A second, stricter
    date check runs after the detail pull using TMDB's authoritative date.
    Titles with no year at all (Wikipedia 'TBA') are unreleased — excluded.
    """
    current_year = date.today().year
    in_scope, excluded = [], []
    for s in seeds:
        if s["year"] is not None and FOUNDING_YEAR <= s["year"] <= current_year:
            in_scope.append(s)
        else:
            excluded.append(s)
    if excluded:
        print(f"[scope]    excluded {len(excluded)} seeds outside "
              f"{FOUNDING_YEAR}–{current_year} (pre-founding tags, "
              f"unreleased/TBA titles):")
        for s in excluded:
            print(f"             - {s['title']} ({s['year']}, {s['seed_source']})")
    return in_scope


# ---------------------------------------------------------------------------
# Stage 3 — pull TMDB details per film
# ---------------------------------------------------------------------------

def pull_tmdb_details(tmdb_id, tmdb_key):
    """Full TMDB record for one film, including its IMDb id.

    append_to_response=external_ids folds the IMDb id (needed for the OMDb
    join) into the same call — one request per film instead of two.
    """
    return fetch_cached_json(
        RAW_DIR / "tmdb" / "movie" / f"{tmdb_id}.json",
        lambda: polite_get(
            f"{TMDB_BASE}/movie/{tmdb_id}",
            params={"api_key": tmdb_key, "append_to_response": "external_ids"},
        ).json(),
    )


# ---------------------------------------------------------------------------
# Stage 4 — enrich with OMDb critical scores
# ---------------------------------------------------------------------------

def enrich_omdb(imdb_id, omdb_key):
    """OMDb record by IMDb id, or {} when OMDb has nothing.

    OMDb is joined on IMDb id rather than title precisely so we don't do a
    second round of fuzzy title matching — the id came from TMDB, so the
    two sources are guaranteed to be describing the same film.
    """
    data = fetch_cached_json(
        RAW_DIR / "omdb" / f"{imdb_id}.json",
        lambda: polite_get(
            OMDB_BASE, params={"apikey": omdb_key, "i": imdb_id}
        ).json(),
    )
    # OMDb signals "not found" inside a 200 response.
    return data if data.get("Response") == "True" else {}


def parse_omdb_number(value):
    """OMDb encodes missing data as the literal string 'N/A'."""
    if value in (None, "", "N/A"):
        return None
    try:
        return float(value)
    except ValueError:
        return None


def parse_money(value):
    """'$1,234,567' -> 1234567; 'N/A'/absent -> None."""
    if value in (None, "", "N/A"):
        return None
    digits = re.sub(r"[^0-9]", "", value)
    return int(digits) if digits else None


def rt_score_from_ratings(ratings):
    """Pull the Rotten Tomatoes percentage out of OMDb's Ratings list.

    RT doesn't license its data directly; OMDb carries it only for some
    films, which is why §3.2 marks rt_critics 'if available'.
    """
    for entry in ratings or []:
        if entry.get("Source") == "Rotten Tomatoes":
            return parse_omdb_number(entry.get("Value", "").rstrip("%"))
    return None


# ---------------------------------------------------------------------------
# Stage 5 — assemble one row per film, then the table
# ---------------------------------------------------------------------------

# The §3.2 fields whose absence is worth recording per row. Bookkeeping only —
# the analytical data_flags of §3.4 are assigned by hand in step 2.
TRACKED_FIELDS = [
    "imdb_id", "release_date", "runtime_min", "genres", "budget_usd",
    "domestic_gross_usd", "worldwide_gross_usd",
    "imdb_rating", "metascore", "rt_critics", "awards_raw",
]


def assemble_row(seed, tmdb, omdb):
    """Map one film's raw TMDB + OMDb records onto the §3.2 schema."""
    # TMDB stores unknown money as 0. Treating that 0 as a real value would
    # silently turn "we don't know the budget" into "the film was free" —
    # the single most dangerous error in this dataset. Unknown -> None.
    budget = tmdb.get("budget") or None
    worldwide = tmdb.get("revenue") or None

    # The only per-territory number the APIs give us: OMDb's BoxOffice is
    # the DOMESTIC (US/Canada) gross. International is then derived by
    # subtraction, which mixes two crowd-sourced sources — it can even go
    # negative when they disagree. Recorded as-is; judging it is step 2.
    domestic = parse_money(omdb.get("BoxOffice"))
    intl = (worldwide - domestic) if (worldwide is not None and domestic is not None) else None

    release_date = tmdb.get("release_date") or None
    row = {
        "film_id": seed.get("tmdb_id"),
        "imdb_id": (tmdb.get("external_ids") or {}).get("imdb_id"),
        "title": tmdb.get("title") or seed["title"],
        "release_date": release_date,
        "release_year": int(release_date[:4]) if release_date else seed.get("year"),
        "runtime_min": tmdb.get("runtime") or None,
        "genres": "|".join(g["name"] for g in tmdb.get("genres", [])) or None,
        "budget_usd": budget,
        "domestic_gross_usd": domestic,
        "intl_gross_usd": intl,
        "worldwide_gross_usd": worldwide,
        "imdb_rating": parse_omdb_number(omdb.get("imdbRating")),
        "metascore": parse_omdb_number(omdb.get("Metascore")),
        "rt_critics": rt_score_from_ratings(omdb.get("Ratings")),
        "awards_raw": omdb.get("Awards") if omdb.get("Awards") != "N/A" else None,
        # Raw company list, kept so step 2 can judge distribution_only
        # (A24 absent from production companies = likely distribution deal).
        "production_companies": "|".join(
            c["name"] for c in tmdb.get("production_companies", [])
        ) or None,
        "seed_source": seed["seed_source"],
        "resolution_confidence": seed["resolution_confidence"],
    }
    row["missing_fields"] = ",".join(
        f for f in TRACKED_FIELDS if row.get(f) is None
    ) or None
    return row


def collect_film(seed, tmdb_key, omdb_key):
    """Run stages 3–5 for one film. Any per-film failure degrades to a
    partial row instead of aborting the whole run."""
    tmdb, omdb = {}, {}
    if seed.get("tmdb_id"):
        try:
            tmdb = pull_tmdb_details(seed["tmdb_id"], tmdb_key)
        except requests.RequestException as e:
            print(f"  ! TMDB details failed for {seed['title']}: {e}")
    imdb_id = (tmdb.get("external_ids") or {}).get("imdb_id")
    if imdb_id:
        try:
            omdb = enrich_omdb(imdb_id, omdb_key)
        except requests.RequestException as e:
            print(f"  ! OMDb enrich failed for {seed['title']}: {e}")
    return assemble_row(seed, tmdb, omdb)


def assemble_table(rows):
    """Build the raw DataFrame, apply the authoritative date filter, and
    print the collection summary that doubles as the data-quality report."""
    df = pd.DataFrame(rows)

    # Second scope pass, now on TMDB's authoritative release_date: the seed
    # filter only saw approximate years. Films dated after today are still
    # unreleased; films before 2013 are mis-tagged back-catalogue.
    today = date.today().isoformat()
    dated = df["release_date"].notna()
    out = dated & (
        (df["release_date"] > today)
        | (df["release_year"] < FOUNDING_YEAR)
    )
    if out.any():
        print(f"[scope]    excluded {int(out.sum())} films after date check: "
              f"{', '.join(df.loc[out, 'title'])}")
        df = df[~out]

    df = df.sort_values("release_date", na_position="last").reset_index(drop=True)

    print("\n--- collection summary -------------------------------------------")
    print(f"films collected : {len(df)}")
    print(f"api calls       : {FETCH_STATS['fetched']} fetched, "
          f"{FETCH_STATS['cached']} served from cache")
    print(f"seed provenance : {df['seed_source'].value_counts().to_dict()}")
    print(f"resolution      : {df['resolution_confidence'].value_counts().to_dict()}")
    print("\nmissing values per field:")
    for field in TRACKED_FIELDS:
        n = int(df[field].isna().sum())
        if n:
            print(f"  {field:<22} {n:>4} missing")
    unresolved = df[df["film_id"].isna()]
    if len(unresolved):
        print(f"\nunresolved titles (kept as rows, empty TMDB fields):")
        for t in unresolved["title"]:
            print(f"  - {t}")
    return df


def main():
    tmdb_key, omdb_key = load_api_keys()

    wiki_films = seed_from_wikipedia()
    discover_films = seed_from_tmdb_discover(tmdb_key)
    seeds = filter_scope(build_seed_list(wiki_films, discover_films, tmdb_key))

    print(f"[collect]  pulling TMDB details + OMDb scores for {len(seeds)} films...")
    rows = []
    for i, seed in enumerate(seeds, 1):
        rows.append(collect_film(seed, tmdb_key, omdb_key))
        if i % 25 == 0:
            print(f"           ...{i}/{len(seeds)}")

    df = assemble_table(rows)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"\nwrote {OUTPUT_CSV.relative_to(PROJECT_ROOT)} "
          f"({len(df)} rows x {len(df.columns)} cols)")


if __name__ == "__main__":
    main()
