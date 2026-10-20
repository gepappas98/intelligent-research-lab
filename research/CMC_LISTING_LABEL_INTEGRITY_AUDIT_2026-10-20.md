# CMC Listing Research Observation Audit

**Observed:** 2026-10-20 UTC, approximately 17:38 UTC, canonical Supabase `yckewtpfttvwiptmmrfq`.
**Scope:** read-only validation of `public.cmc_listing_research_observations`, its source snapshot timing, and forward labels. No data was changed.

## Current snapshot

- View rows: **19,200**.
- Distinct CMC IDs: **1,038**.
- Distinct observation timestamps: **20**.
- Oldest observation: `2026-10-15 22:30:02.751+00`.
- Newest observation: `2026-10-20 13:20:03.214+00` — approximately 4h18m old at the inspection time; compare against the expected multi-hour collection cadence before declaring a collector outage.
- `batch_version=2`, source `cmc-keyless-listings`: 19,000 rows, 19 snapshots, 1,038 distinct CMC IDs. Version 1 contributes 200 rows from one earlier snapshot.
- No duplicate `(cmc_id, observed_at)` keys were found in the view.

## Label integrity checks

| Check | Result |
|---|---:|
| Non-null 24h forward-return labels | 16,086 |
| Non-null 72h forward-return labels | 8,067 |
| 24h labels outside the documented 18–30h window | 0 |
| 72h labels outside the documented 66–78h window | 0 |
| Invalid/non-earlier prior snapshot timestamps | 0 |
| `rank_improvement` formula mismatches | 0 |
| Rows with volume multiple | 17,541 |
| Volume multiples without valid prior volume inputs | 0 |
| Volume multiple formula mismatches | 0 |
| Missing multiple despite valid prior inputs | 0 |

Observed actual label horizons were 18.164–24.666 hours for the 24h labels and 67.168–73.663 hours for the 72h labels. These are consistent with the view's documented nearest-observation windows. The rank formula is `prior_rank - current_rank`. Volume multiple matches `current_volume_24h / prior_volume_24h` for every row with valid inputs.

## Research-use boundary

The view definition in `supabase/migrations/20261016104011_cmc_listing_research_observations.sql` is explicitly research-only. Forward returns are labels, not entry features; do not feed `forward_price_*`, `forward_observed_at_*`, `forward_return_pct_*`, or `forward_actual_hours_*` into candidate selection/scoring. Keep CMC as context/discovery, never a standalone BUY voter. The repository search found the view referenced by the CMC research outcome panel and its migration; no active scorer use was found in the search results, which is useful evidence but not a proof that no external consumer exists.

## Interpretation and next steps

1. The observed rank/volume/forward-label calculations pass these checks. Preserve the view's point-in-time separation between prior observations and future outcome labels.
2. Track freshness by `max(observed_at)` and compare it with the intended multi-hour collection cadence; a 4h18m gap alone does not prove a failed collector.
3. Investigate repeated assets across snapshots as time-series observations, not independent IID samples. Split evaluations by snapshot time and asset identity where needed; avoid leaking the same asset's future labels into its own feature cohort.
4. Persist a versioned summary/finding only after a reproducible test specifies asset deduplication, cohort boundaries, label maturity, and any fees/slippage assumptions relevant to downstream use.
5. Do not delete older snapshots to reduce storage until the evidence/archive mapping and restore test demonstrate they can be reconstructed.

## Change status

Read-only production checks and documentation only. No migration, view replacement, cron change, retention change, scoring change, or deployment occurred.
