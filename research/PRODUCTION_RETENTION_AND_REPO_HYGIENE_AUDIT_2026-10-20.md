# Production Retention, Lineage and Repository Hygiene Audit — 2026-10-20

## Scope and evidence
Read-only checks were run against the canonical production Supabase project `yckewtpfttvwiptmmrfq` on 2026-10-20. Repository hygiene changes were committed to `gepappas98/pixel-perfect-pixels`. This record distinguishes live database observations from source-code findings. It does not authorize a database reset or historical rewrite.

## Retention safety — production verified
The live row in `public.research_archive_control` has:
- `allow_archive = false`
- `allow_source_delete = false`
- note: archive and source deletion paused pending storage and evidence-value review
- `updated_at = 2026-10-19 22:26:58.047032+00`

The active `research-data-retention` cron is scheduled at `17 3 * * *`; its command is `select public.cleanup_research_data(72, 168, false)`. The latest run observed was 2026-10-20 03:17 UTC, status `succeeded`, return message `1 row`.

The live function definition confirms the non-dry-run path checks `allow_archive` before any DELETE. With the current archive flag false, it returns a paused status before archive or source deletion. Thus the latest cron success is not evidence that data was archived or deleted; the control gate is the safety mechanism. Keep both flags false until archive completeness, evidence value and restore/verification have been reviewed.

## Market candle retention — production verified
The active `market-candle-retention` cron is scheduled at `31 3 * * *`, running:
`delete from public.market_candles where close_time < now() - interval '30 days'`.
Its latest run on 2026-10-20 03:31 UTC reported `DELETE 6`.

A subsequent live count found 93,658 rows in `market_candles`, none older than 30 days at query time; oldest observed `close_time` was 2026-10-14 19:44:59.999+00. The `DELETE 6` result is therefore a past-run result, not a claim that six currently inspectable rows remain beyond the cutoff. This retention path does not consult `research_archive_control`. Before changing it, determine whether historical decision reconstruction requires candles beyond 30 days and whether a verified archive exists. Do not disable or widen retention blindly.

## Raw snapshot age counts — production verified
A read-only count using a 72-hour cutoff found:
- `asset_sentiment_snapshots`: 11,335 older than 72 hours; 20,513 within 72 hours.
- `asset_news_events`: 458 older than 72 hours; 725 within 72 hours.
- `asset_flow_snapshots`: 13,650 older than 72 hours; 25,920 within 72 hours.
- `asset_price_snapshots`: 13,650 older than 72 hours; 25,917 within 72 hours.

These are candidate age populations, not proof that every row is safe to delete. The cleanup function counts eligible rows and, if enabled, only deletes rows with a matching `research_evidence` record; the archive gate is currently closed. Preserve provenance, observed/event timestamps, source IDs, strategy/trade links, and outcome labels.

## V3 versus Legacy/V2 benchmark dependencies — repository verified
Repository search found active V3 calls in:
- `src/components/trading/VariantComparisonPanel.tsx`
- `src/lib/strategy.functions.ts`
- `supabase/functions/strategy-auto-switch/index.ts`
- `src/lib/mcp-diagnostic.server.ts`

The diagnostic documentation says the active diagnostic uses V3 only; legacy and V2 rows remain historical context. The MCP diagnostic test explicitly blocks `get_variant_performance` and `get_variant_performance_v2` through that client and allows V3. This is not a complete proof that no other SQL jobs, functions, or external consumers call legacy RPCs. Do not drop the legacy/V2 functions until a broader caller audit and deployed-app verification are complete.

## Repository hygiene change — committed
In `gepappas98/pixel-perfect-pixels`:
- Updated `.gitignore` to ignore `.env` and `.env.*`, while allowing `!.env.example`.
- Removed the tracked root `.env`. The fetched file had 7 lines, contained no service-role/secret/private-key marker, and had a Supabase project reference that differed from the canonical production project. Do not publish its values in research artifacts.
- Commits: `16270811391af34ef253a7d5e4f4188030db41dd` (ignore rules), `a732d4b75665452e86363768e5f919a943e75bb9` (remove tracked `.env`), `f5336c8233e8f71a98344a204e4966db1f56fe3d` (tidy ignore rules).

This repository change does not alter Lovable runtime environment variables, canonical Supabase configuration, migrations, or deployed functions. A tracked-file removal does not invalidate any historical Git copies; if a real secret is ever found, rotate it separately. No service-role key was found in the inspected root `.env`.

## Next research checks
1. Verify the deployed Lovable app and CI after the repository commits; do not infer deploy status from a Git commit.
2. Map all cron commands and all Edge Function source references to `get_variant_performance`, `get_variant_performance_v2`, and V3 before proposing removal.
3. Audit whether `market_candles` older than the useful research horizon are archived or reconstructible before changing the 30-day cleanup.
4. Review archive coverage and storage impact with `allow_archive=false` and `allow_source_delete=false` still enforced.
5. Preserve legacy/V2 observations as distinct cohorts; only V3 aligned-MTF results may inform current variant comparisons or auto-switch.


## Runtime errors and disabled cron jobs — production logs verified
The production cron inventory on 2026-10-20 showed:
- `trading-pipeline-orchestrator` active, latest cron record succeeded at 17:10 UTC.
- `trade-position-watchdog` active, latest cron record succeeded at 17:14 UTC.
- `storage-capacity-watchdog` inactive; its latest recorded run was 2026-10-11 05:33 UTC.
- Legacy `trading-pipeline-every-15-min` inactive; latest recorded run was 2026-09-29 19:15 UTC.
Do not reactivate either inactive job without checking its intended replacement and why it was disabled. The active orchestrator is the apparent current pipeline entry point; verify its internal run and downstream stages rather than equating a successful HTTP cron invocation with a successful research cycle.

A read-only scan of production edge logs for the last 24-hour window found repeated HTTP 500 responses with PostgREST error `57014` (query cancellation/statement timeout):
- `/rest/v1/rpc/get_research_archive_status`: 61 failures; latest 16:53:15 UTC.
- `/rest/v1/rpc/get_system_resource_stats`: 61 failures; latest 17:14:34 UTC.
- `/rest/v1/strategy_variant_signals`: 55 failures; latest 16:52:41 UTC.
- `/rest/v1/rpc/get_variant_performance_v3`: 37 failures; latest 17:14:34 UTC.
- `/rest/v1/asset_sentiment_snapshots`: 29 failures; latest 17:14:34 UTC.
- `/rest/v1/cmc_listing_research_observations`: 3 failures; latest 16:46:35 UTC.
Other individual timeout failures appeared for whale-flow/accumulation RPCs and tables.

The upstream service times and 57014 codes support timeout/cancellation as the common observed failure mode, but do not yet identify whether the root cause is an expensive query plan, lock contention, resource saturation, or a client retry storm. The 61 failures on archive-status/resource-stat RPCs are especially relevant because they can make the dashboard appear broken while the archive safety controls themselves remain closed. Next diagnostic step: inspect the definitions and query plans of these read-only RPCs, their indexes and table sizes; correlate Postgres logs for lock/statement-timeout details. Avoid changing timeouts or dropping indexes/data as a first response.

The trade-position-watchdog function logs in the inspected window reported `status=ok`, `open_positions=37` at 17:14 UTC, `price_unavailable=0`, `errors=[]`, and `auto_close_live=false`. One preceding invocation logged one paper take-profit close. This supports that the watchdog itself was operating at those instants; it does not establish overall pipeline health.


## Planner statistics, timeout cause and archive gap — production verified
Postgres logs explicitly report `canceling statement due to statement timeout` with SQLSTATE `57014`. Role/database settings show `statement_timeout=8s` for `authenticator` and `authenticated` (and 3s for `anon`); the global `pg_settings` value of 120s does not override those role-specific settings. This explains the repeated REST 500s. Do not raise role timeouts as a first fix: expensive reads and query shape should be corrected first.

Before maintenance, planner statistics were materially stale: for example `strategy_variant_signals` was estimated at 415 live rows despite a 43 MB total relation size and 2,140 modifications since analyze; snapshot tables were estimated at roughly 1,000 rows despite tens of thousands of actual rows. A read-only `pg_stat_user_tables` check showed no previous analyze/autoanalyze for several frequently queried tables. A non-destructive manual `ANALYZE` was then run on `strategy_variant_signals`, `research_evidence`, the four raw snapshot/news tables, and the whale-flow/event-flow tables. Verification immediately afterwards showed corrected estimates: `strategy_variant_signals` 68,082 rows, `asset_sentiment_snapshots` 31,868, `asset_price_snapshots` 39,597, `asset_flow_snapshots` 39,600, `whale_flow_snapshots` 11,198, and `research_evidence` 3,019. `n_mod_since_analyze` was reset to zero for these analyzed tables. This is a statistics refresh only; no research rows were inserted, updated, or deleted.

A privileged, read-only invocation of `get_system_resource_stats()` and `get_research_archive_status(72,168)` completed after the statistics refresh. Current returned resource snapshot:
- Database size: 541,543,571 bytes (516 MB).
- Reported 24-hour growth: 76.57 MB.
- Connections: 20 of max 60; cache hit: 99.96%.
- V3 benchmark source rows: 68,082.

The archive-status RPC returned `incomplete`, with 43,558 eligible source rows and 0 archived matches across its nine configured retention source tables. The 3,019 rows in `research_evidence` are currently only for `strategy_variant_signals` (2,801), `trades` (199), and `composite_signals` (19); none are evidence records for the raw snapshot/news and whale/event-flow tables required by that retention check. This is a material gap, not permission to turn on archiving or source deletion. Keep both control flags false.

The database is above the earlier 480 MB warning threshold, while `storage-capacity-watchdog` is inactive. Its guard function and intended effect must be reviewed before any reactivation; do not run it blindly. The 76.57 MB/day figure is a single returned 24-hour comparison, so recheck after the next storage sample rather than extrapolating indefinitely.

## Follow-up after ANALYZE
The 8-second role timeout and stale planner statistics are now confirmed, and statistics have been refreshed. The log window immediately after ANALYZE still contained two 500s for archive-status and V3 benchmark at 17:17:08/17:17:04 UTC; those requests may have started before ANALYZE. Recheck new REST failures after the browser has made fresh requests. If timeouts persist, prioritize:
1. Rewrite `get_research_archive_status` to aggregate source counts once and avoid repeating the full required-source union, while preserving exact archive matching and safe controls.
2. Add/review suitable time-leading indexes for the retention predicates and a V3-oriented index only after examining `EXPLAIN` plans.
3. Replace broad `SELECT *` / exact count requests for `strategy_variant_signals` and snapshot tables with narrow projections and bounded pagination in the frontend.
4. Investigate why autovacuum/analyze had not kept statistics current, and why the capacity watchdog is inactive.
Do not enable archive/delete flags, drop historical tables, or reset production while this remains unresolved.


## V3 query plan and immediate post-maintenance observation
A non-executing `EXPLAIN (COSTS TRUE)` of the V3 aggregation now estimates a sequential scan of `strategy_variant_signals` (68,082 live rows) with an estimated 2,063 qualifying rows, followed by hash aggregation. No `created_at`-leading index dedicated to the V3 filter exists in the inspected index list. Consider a V3 partial index only after measuring the post-ANALYZE request latency and checking write overhead; no index or schema migration was applied in this audit.

A follow-up edge-log query for 2026-10-20 17:17:15–17:20:00 UTC found no new HTTP 500 rows for that interval after ANALYZE completed at approximately 17:17:12 UTC. This is a short observation window, not proof of permanent resolution; the two preceding failures at 17:17:04 and 17:17:08 may have started before ANALYZE. Recheck after fresh app traffic before closing the timeout finding.
