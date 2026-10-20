# Production Runtime Follow-up — 2026-10-20

## Scope and timestamp
Read-only production verification plus the explicitly requested execution-audit deployment. Canonical Supabase project: `yckewtpfttvwiptmmrfq`. Snapshot time: 2026-10-20 19:40–19:43 UTC. Values below are observations at that time, not a guarantee of current state.

## Runtime / RPC finding
- `get_research_archive_status(72,168)` returned `status=incomplete`, `eligible_sources=46224`, `archived_sources=0`, `missing_sources=46224`.
- The RPC JSON key set observed in production was: `status`, `eligible_sources`, `archived_sources`, `missing_sources`, `last_archive_at`, `raw_cutoff`, `derived_cutoff`, `by_table`, `delete_enabled`, `archive_enabled`.
- Candidate single-pass aggregation produced matching top-level status and totals at the comparison snapshot (46,224 / 0 / 46,224), but the draft implementation did **not** yet preserve the full JSON contract: it omitted `last_archive_at`, `raw_cutoff`, `derived_cutoff`, `delete_enabled`, and `archive_enabled`. PR #136 must be corrected and validated before merge/deploy.
- Recent production logs contained intermittent HTTP 500 / PostgreSQL SQLSTATE 57014 statement timeouts for `get_research_archive_status`, `get_system_resource_stats`, and `get_variant_performance_v3`; archive-status failures were recorded at 2026-10-20 19:05:25.855 UTC and 19:18:13.412 UTC. This is not yet a confirmed recovery.
- The database size sample was 554,806,419 bytes (~529 MiB). Largest sampled relations: `strategy_shadow_diagnostics` ~103.3 MB, `composite_signals` ~86.8 MB, `strategy_variant_signals` ~45.9 MB, `whale_alerts` ~38.1 MB, `pipeline_runs` ~38.1 MB, `market_candles` ~32.2 MB, `accumulation_shadow_observations` ~27.6 MB.

## Research knowledge lineage
- Ran `public.refresh_research_knowledge_cases(8760)` successfully at 2026-10-20 19:37:51 UTC. Function result: inserted 74 trade evidence rows, 250 V3 variant evidence rows, 14 composite-signal evidence rows; inserted/updated 98 trade cases and 250 V3 variant cases.
- Follow-up read-only check at 19:38:07 UTC found 273 trades, 273 `research_cases` with `source_table='trades'`, and 273 `research_evidence` with `source_table='trades'`.
- Validation counts: trades without case = 0; trades without evidence = 0; case entry timestamp mismatch = 0; case resolution timestamp mismatch = 0; case evidence reference missing = 0; evidence observed/available after case entry = 0.
- This validates trade lineage at that snapshot only; it does not establish full raw-source evidence coverage.

## Execution audit deployment
- PR #135, `fix(audit): count execution coverage by signal ID`, was merged to main using squash merge. Merge commit: `fc10dc7be90c2172ec696fde17865c2c4660835b`.
- Deployed canonical `trade-executor` Edge Function to version 25 with JWT verification still enabled. The runtime bundle contains `summarizeEligibleSignalAudit`; deployment needed a bundle-local import-path adjustment so the shared modules resolve inside the deployed function.
- This change only changes audit coverage accounting: eligible signal IDs are matched to audit events, and missing `confidence` on a gate event no longer falsely marks a signal as uncovered. It does not change trading gates, scores, paper/live orders, or position decisions.
- Post-deploy outcome telemetry must still be checked on the next normal pipeline execution; do not claim the metric is fixed in observed production runs until a run confirms matching eligible IDs and event counts.

## Retention / archive safety
- `research_archive_control.allow_archive=false` and `allow_source_delete=false` remain unchanged.
- `research-data-retention` job 11 remains active, scheduled `17 3 * * *`, invoking `cleanup_research_data(72,168,false)`; this function's delete guard remains in place.
- Paused `market-candle-retention` job 20 (`31 3 * * *`) because it directly deletes candles older than 30 days outside the archive-control flags. Verified `active=false` after the change.
- No database reset, source-table deletion, or archive enablement was performed. Archive must remain disabled until evidence capture and export completeness/restore verification are demonstrated.

## Follow-up actions
1. Correct PR #136 to preserve every production JSON key, exact per-table contract, function security attributes and grants; compare old and candidate outputs with identical cutoffs and run SQL CI before rollout.
2. Monitor RPC 57014/HTTP 500 counts after the optimizer is validated and deployed through reviewed migration.
3. Inspect the next ordinary `trade-executor`/pipeline audit report for `audited_eligible_signals` and `uncovered_eligible_signals` by stable `signal_id`.
4. Continue export verification before enabling archive/source deletion. Keep both archive-control flags false.
