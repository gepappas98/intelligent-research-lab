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
