# IRL Source Export Execution Plan

**Purpose:** executable sequence for a source-preserving export/import once an isolated IRL database is verified.
**Current state:** source project is verified; destination is not. This document does not authorize writing to either existing Supabase project.

## 1. Verified source and destination gate

- Source: `yckewtpfttvwiptmmrfq` (`trading-command-center`), read-only.
- Candidate project refs visible in the two connected Supabase account views:
  - `yckewtpfttvwiptmmrfq` — source; forbidden as target.
  - `opwkbdbpqgtgcrmqqmbq` — inactive unrelated project; forbidden as target.
- A separate IRL target has not been identified. A ref embedded in a tracked `.env` is not authoritative proof of ownership or intended destination.
- No target database should be enabled or provisioned by assuming the existing TCC app is IRL.

## 2. Migration-history evidence and historical-data caution

The connected source migration inventory includes the following relevant changes:

- `20250928120000_retention_policy` and later `20261008045644_add_research_data_retention_cleanup`: retention/cleanup behavior exists and must be inspected at function level before inferring historical completeness.
- `20261008100734_clean_invalid_sentiment_research_data` and `20261008101017_remove_zero_sentiment_rows`: historical research rows were deliberately filtered/removed by named migrations. Any transfer report must disclose these migrations.
- `20261012151912` / `20261014221222` variant cohort migrations: variant performance definitions evolved; preserve Legacy/V2/V3 separately.
- `20261019222555` through `20261019223432`: research archive, delete guard, sync batch fix and capture gate were added. Their existence does not prove the archive contains the full retention-source history.

Observed current timestamp ranges in core tables are recent. This does not prove old records were deleted, but it also does not prove they remain available. Before declaring a complete historical transfer, compare retention function definitions, cleanup cron arguments, migration SQL and any available backups/exports.

## 3. Transfer order

### Phase A — read-only source preflight
1. Record source project ref, migration inventory and UTC extraction time.
2. Read table/column definitions and foreign-key graph.
3. Identify mutable tables, append-only tables, generated columns, triggers, RLS and policies.
4. Inspect retention/cleanup routines and the historical sentiment-cleaning migrations.
5. Generate exact counts and time ranges under one consistent database snapshot. Separate statements are diagnostic only.
6. Assign cohort with source evidence; unresolved classification becomes `Unknown`, never inferred from missing fingerprints alone.

### Phase B — private source export
1. Use a client-side export process, not SQL server filesystem commands.
2. Export each table in bounded keyset batches under a consistent snapshot or documented snapshot boundary.
3. Use canonical column order and stable serialization for logical row hashes.
4. Write a manifest containing per-table counts, ID uniqueness, null/duplicate fingerprints, time ranges, schema fingerprint, byte count and SHA-256.
5. Store the export outside GitHub in private storage with restricted permissions. Do not commit source rows, credentials or secrets.
6. Do not export full `pipeline_runs.result` JSON by default; retain bounded telemetry plus hashes/pointers unless a specific experiment needs selected fields.

### Phase C — isolated IRL schema and import
1. Confirm target ref and URL from the project owner/dashboard; ensure target ref differs from source and unrelated inactive projects.
2. Capture target identity, region, current size and free capacity with read-only checks.
3. Apply only IRL-specific schema with default-deny RLS. Do not copy source archive policies that grant broad anonymous/authenticated SELECT or EXECUTE.
4. Import batches idempotently using `(source_system, source_project_ref, source_table, source_record_id, source_record_version)` as the stable logical identity.
5. Keep source IDs as text and retain original timestamps and source values.
6. Log rejected rows with reason; never silently discard invalid records.
7. Recompute counts and logical hashes after import. Do not delete or modify source records.

## 4. First-pass data tiers

**Tier 1 — strategy results:** `strategy_config`, `strategy_variant_signals`, `composite_signals`, `trades`, `council_signals`, `council_lessons`.

**Tier 2 — experiments:** `strategy_shadow_diagnostics`, `early_entry_variant_decisions`, `accumulation_shadow_observations`, `repeated_buy_research_ledger`, `event_flow_study_snapshots`.

**Tier 3 — provenance and market context:** `whale_alerts`, `whale_flow_snapshots`, `whale_flow_transitions`, `whale_flow_transition_context`, `whale_flow_shock_followups`, `asset_flow_snapshots`, `asset_price_snapshots`, `asset_sentiment_snapshots`, `asset_social_snapshots`, `asset_news_events`, `event_flow_transmissions`, `indicator_snapshots`, `market_candles`. For candles, include the full history required to reproduce evaluations only if the verified target has capacity; document any boundary rather than silently truncating.

**Tier 4 — bounded operational telemetry:** `pipeline_runs` summary fields only by default.

## 5. Completion checklist

- [ ] Actual isolated IRL project identity verified.
- [ ] Export schema and retention/cleanup behavior reviewed.
- [ ] Export manifest generated from a consistent snapshot.
- [ ] Private export encrypted/restricted and checksums verified.
- [ ] Target schema applied only to IRL.
- [ ] Every tier imported idempotently.
- [ ] Row counts, source IDs and payload hashes reconcile.
- [ ] Cohort-specific reproducibility report regenerated from imported records.
- [ ] TCC source data remains unchanged.
- [ ] No credentials or raw production rows committed to GitHub.

## 6. Latest read-only source retention-control check — 2026-10-20

The current `public.research_archive_control` row (`id=1`) was queried directly from the canonical source project. It reports `allow_archive=false`, `allow_source_delete=false`, with note “Archive and source deletion paused pending storage and evidence-value review” and `updated_at=2026-10-19 22:26:58+00`. This confirms the two explicit gates are currently off at the time of the query. The cleanup function definition also checks `allow_archive` before archive work and returns without deleting when archival is disabled; source deletes additionally require `allow_source_delete=true` and archive evidence checks. This is a current control-state observation, not proof that no older cleanup or migration ever removed rows.

The migration inventory also includes `20261008100734_clean_invalid_sentiment_research_data` and `20261008101017_remove_zero_sentiment_rows`, so historical source data has been intentionally filtered in the past. The final transfer report must distinguish (a) rows currently present and transferred, (b) rows represented only by archive evidence, and (c) historical records whose previous existence is documented by migration history but which are no longer available in source tables. Do not reconstruct or fabricate missing rows.
