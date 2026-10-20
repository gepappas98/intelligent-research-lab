# Production Timeout Audit — Batch Findings

**Observed:** 2026-10-20 UTC 17:35–17:38, canonical Supabase project `yckewtpfttvwiptmmrfq`.
**Mode:** read-only production inspection. No SQL DDL, migrations, data mutations, retention changes, or deploys were performed.

## Executive result

The earlier manual `ANALYZE` corrected stale planner row estimates, but it did not resolve recurring PostgREST statement timeouts. Production logs still show `SQLSTATE 57014` (`canceling statement due to statement timeout`) and HTTP 500s on archive readiness, resource metrics, V3 performance, and a recent-variant list. Successful requests also exist, so the issue is intermittent, not a total outage.

## Recent 24-hour request counts observed

| Endpoint | HTTP 200 | HTTP 500 | Mean upstream time for 200 / 500 |
|---|---:|---:|---:|
| `get_system_resource_stats` | 101 | 66 | 2.44 s / 5.84 s |
| `get_research_archive_status` | 34 | 64 | 2.14 s / 3.49 s |
| `get_variant_performance_v3` | 234 | 41 | 1.97 s / 4.48 s |
| `strategy_variant_signals` recent-list query | not isolated as a single read class | 59 | successful writes and other reads also present |

`strategy_variant_signals` additionally had 425 successful HTTP 200 reads for a different query shape, 143 HTTP 201 inserts, and 8,340 HTTP 204 patches in the observed 24-hour aggregation. These counts are grouped by URL/path and response code, not proof every request was a dashboard read.

Postgres logs returned **388** `57014` events over the 24-hour query. Role-level settings observed: `anon=3s`, `authenticated=8s`, `authenticator=8s` (`lock_timeout=8s` also on authenticator).

## Confirmed causes / contributors

### 1. `get_research_archive_status`

The production `pg_get_functiondef` shows two near-identical `required` CTEs across nine source tables, followed by correlated `EXISTS` checks against `research_evidence(source_table, source_id)`. The function checks all eligible sources once for total/archived/missing counts and then reconstructs and rechecks the sources for per-table JSON. The source index exists, but the repeated source enumeration and existence checks cause avoidable work under concurrent calls. Existing archive gate remains fail-closed: `allow_archive=false`, `allow_source_delete=false`; do not enable deletion based on this status function.

### 2. Recent `strategy_variant_signals` query

The captured PostgREST SQL for the recent-list request selects 17 columns, orders by `created_at DESC`, limits to 250, and also runs a full `count(*)` over the relation. Production `EXPLAIN (FORMAT JSON)` for the same select shows `Gather Merge -> Sort(created_at DESC) -> Parallel Seq Scan`, rather than an index-backed top-N access path. The table is approximately 43 MB, planner estimate ~68k rows, and `pg_stat_user_tables` showed ~11k dead tuples at the observation time.

Index inventory has multiple outcome-/strategy-leading indexes but no plain `created_at DESC` index. This is a candidate for query-shape and index evaluation, not authorization to add an index without checking write overhead and a migration/review path. Prefer removing exact count from bounded UI reads when the total count is not actually required; if a total is required, separate it from the page fetch or use a clearly labelled estimate. Do not silently represent an estimate as an exact count.

### 3. `get_system_resource_stats`

The production SQL RPC reads active client connections, maximum connections, `pg_database_size`, cache-hit statistics, an exact count of all `strategy_variant_signals`, and a storage-size sample comparison. The UI component `SystemResourcesPanel.tsx` refreshes `getSystemResourceMetrics` every 120 seconds; the server function calls resource stats and cron health concurrently. Recheck whether the full relation count and repeated live database-size calculations are needed at this frequency; a cached/materialized measurement could be evaluated, but no behavior was changed.

### 4. V3 benchmark

`get_variant_performance_v3` is scoped to the last N days, `recommendation='buy'`, and `source_fingerprint LIKE 'v3|%'`, then aggregates by `strategy_name`. Production EXPLAIN shows a sequential scan of `strategy_variant_signals` with estimated ~2,088 qualifying rows and hashed aggregation. This plan can be rational for the current relation size; do not add an index solely because the plan says sequential scan. The repeated HTTP 500s still require latency measurement under concurrent workload. V2/legacy remain historical/research only.

## Useful index and relation observations

- `research_evidence_source_idx(source_table, source_id)` exists and is heavily used (reported ~7.1 million index scans since stats reset).
- `strategy_variant_signals`: ~68k estimated live rows, ~43 MB total relation size, ~11k dead tuples in `pg_stat_user_tables`; `last_analyze` 17:17 UTC and no `last_autovacuum` reported for this table in the inspected stats.
- `asset_price_snapshots`: ~39.7k rows, ~11 MB; `idx_asset_price_snapshots_asset_time` has high usage.
- `asset_flow_snapshots`: ~39.8k rows, ~13 MB; `idx_asset_flow_snapshots_asset_time` has meaningful usage.
- `asset_sentiment_snapshots`: ~32k rows, ~16 MB; ~6.95 million tuples read by sequential scans reported in stats.
- These are cumulative PostgreSQL statistics, not a 24-hour-only window. They may reset and must not be interpreted as daily totals.

## Code-level caller findings

`src/lib/research-knowledge.functions.ts` in `gepappas98/pixel-perfect-pixels` runs six table reads in `Promise.all`; each uses `.select(columns, { count: "exact" })`, `.order(...)`, and `.limit(...)`. The variant read is bounded to 250 rows but requests an exact total count. Archive status is then requested separately with an 8-second abort signal. This code shape can amplify concurrent DB work and turn a timeout into an unavailable/empty bounded sample; the UI must preserve the distinction between `unavailable` and genuinely empty data.

`src/lib/pipeline.functions.ts` invokes `get_system_resource_stats` and `get_pipeline_cron_health` in parallel. `src/components/trading/SystemResourcesPanel.tsx` refreshes at 120-second intervals.

## Next safe steps

1. Review a migration in the canonical app repository to compute the archive source set once, deduplicate archive keys if semantically valid, and produce global and per-table counts from one grouped pass. Preserve JSON keys, time cutoffs, source identity, evidence semantics, function grants, `SECURITY DEFINER`, and fail-closed archive/delete flags.
2. Change bounded Research Lab list reads so they do not force exact full-table counts unless the product genuinely needs them. Keep exact counts separate from page retrieval and visibly label approximate values.
3. Compare candidate `created_at DESC` index and query-shape options using EXPLAIN and measured read/write cost before selecting an index.
4. Recheck successful and failed endpoint counts after changes using a defined time window, including real UI requests. A log window with no calls to an endpoint is not evidence of recovery.
5. Inspect the `strategy_variant_signals` dead-tuple/autovacuum situation before treating further `ANALYZE` as the remedy; `ANALYZE` refreshes planner statistics but does not reclaim dead tuples.
6. Keep archive/delete gates false, preserve all historical trade/signal data, and do not reset the database before Intelligent Research Lab enrichment and archive completeness/restore checks.

## Change status

This file records evidence and a review plan only. No production function was replaced, no migration was applied, no index was created, no timeout was raised, no rows were deleted, and no Lovable deployment was performed.
