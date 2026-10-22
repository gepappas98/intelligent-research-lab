# IRL Research Data Transfer Runbook

**Status:** IRL destination identity verified 2026-10-22; production export/import not yet executed; schema/privilege hardening and exact source-ID/hash reconciliation remain open  
**Source:** canonical TCC Supabase project `yckewtpfttvwiptmmrfq`  
**Target:** verified Supabase project `ragdznxfozdpxetwisrd` (`intelligent-research-lab`, `eu-west-3`); source remains `yckewtpfttvwiptmmrfq`  
**Data safety:** source is read-only; no source deletion or source schema change is part of this runbook.

## Hard gates

- [x] Identify the IRL backend project ref from the official Supabase project-management API: `ragdznxfozdpxetwisrd` (`intelligent-research-lab`, `eu-west-3`), verified 2026-10-22.
- [ ] Confirm the target is separate from `yckewtpfttvwiptmmrfq` and has sufficient free database/storage capacity.
- [ ] Confirm a private, encrypted local artifact destination with access controls.
- [ ] Freeze a consistent source snapshot boundary for the export.
- [ ] Record source schema/migration revision and extraction code/query hashes.
- [ ] Validate exact counts, source IDs, null fingerprints, duplicate fingerprints and deterministic logical row hashes before import.
- [ ] Build an idempotent target import and verify counts/hashes after import.
- [ ] Preserve all source rows; never delete source data as part of migration.

Project identity is now verified, but do not export row payloads into GitHub or write/import data until private artifact storage, a consistent source snapshot, target schema/privileges, exact ID/hash reconciliation, and an approved recovery plan are verified. Do not create paid infrastructure.

## Latest source snapshot for planning

Read-only snapshot at 2026-10-20 11:34 UTC:
- Database size: 526,126,227 bytes (~502 MB).
- Largest relations: `strategy_shadow_diagnostics` ~93 MB; `composite_signals` ~75 MB; `strategy_variant_signals` ~40 MB; `pipeline_runs` ~36 MB; `whale_alerts` ~33 MB; `market_candles` ~30 MB; `accumulation_shadow_observations` ~25 MB.
- Archive tables combined are only a few MiB; deleting them would not solve the space pressure.
- Table row counts in the snapshot came from planner statistics, not exact counts. They are for prioritization only.

## Export tiers

### Tier 1 — core strategy outcomes
Export first:
- `strategy_config` (configuration snapshots; current row observed as `conservative`, weights 1.2/1.2/1.2, prediction weight 0, auto-switch enabled, interval 1h).
- `strategy_variant_signals`
- `composite_signals`
- `trades`
- `council_signals`
- `council_lessons`

Retain source IDs, fingerprints, signal/entry context, regime/session/source tags, strategy name, scorer version when available, outcome, PnL fields, resolution time, and all foreign/source links. Do not treat `created_at` as point-in-time availability without evidence.

### Tier 2 — research-only experiment evidence
- `strategy_shadow_diagnostics`
- `early_entry_variant_decisions`
- `accumulation_shadow_observations`
- `repeated_buy_research_ledger`
- `event_flow_study_snapshots`

Keep decision reasons, variant identity, bounded metric fields, timestamp, and any trade/source ID references. Preserve the feature fields actually used by each experiment version.

### Tier 3 — market context and provenance
- `whale_alerts`
- `whale_flow_snapshots`
- `whale_flow_transitions`
- `whale_flow_transition_context`
- `whale_flow_shock_followups`
- `asset_flow_snapshots`
- `asset_price_snapshots`
- `asset_sentiment_snapshots`
- `asset_social_snapshots`
- `asset_news_events`
- `event_flow_transmissions`
- `indicator_snapshots`
- `market_candles` (only the history windows needed for reproducibility, with storage budget recorded)

### Tier 4 — bounded operational telemetry
- `pipeline_runs`: export IDs, timestamps, status, function/job name, bounded error fields, and a pointer/hash for relevant output. Do not copy full large `result` JSON payloads by default.

## Snapshot manifest requirements

For every table:
- exact count within the same consistent snapshot;
- primary-key count and duplicate count;
- distinct source-ID count;
- null fingerprint count and duplicate non-null fingerprint count where applicable;
- minimum/maximum event/observed/created/resolved timestamps, each labelled by actual column semantics;
- schema fingerprint;
- deterministic logical row-set SHA-256 using a canonical field order and stable null/number/timestamp encoding;
- export file byte size and SHA-256;
- rejected row count and explicit reason;
- extraction query/code revision and snapshot boundary.

A digest over IDs alone is not enough to prove payload integrity. Include all selected normalized field values in the logical row hash, while preserving original source values separately where needed.

## Temporal and cohort rules

- Preserve Legacy, V2, V3 and Unknown as separate cohorts.
- Record scorer and evaluator versions and the exact query/window definition.
- Never merge legacy and V2 function results without resolving their different fingerprint filters and `created_at` lookback semantics.
- Entry evidence is admissible only when the measurement's observed and available timestamps are defensibly known and satisfy `observed_at <= available_at <= entry_at`.
- If source availability time is unknown, retain the row as unverified context but exclude it from strict point-in-time backtests.
- Store initial entry snapshots immutably. Store outcomes, corrections and resolution events separately.
- An open/immature/unresolved sample is not a loss.
- Record fees, slippage, benchmark exit rules and maturity logic per evaluator version.

## Target import rules

- Import to a verified, isolated IRL project only.
- Use stable identity `(source_system, source_project_ref, source_table, source_record_id, source_record_version)`.
- Use idempotent batches with checkpoints and explicit rejected-row logs.
- Keep original source IDs as text.
- Keep RLS default-deny; do not copy the source archive's permissive SELECT policies or broad SECURITY DEFINER grants.
- Verify imported counts and hashes against the manifest after each tier.
- No cron-based automatic import until manual dry-run and reconciliation pass.
- Do not merge any branch or apply any migration to TCC as part of the transfer.

## Completion definition

The transfer is complete only when:
1. The strategy/knowledge docs are in IRL.
2. A private source export exists with verified per-table counts and hashes.
3. The actual IRL destination is proven separate from TCC.
4. The target schema is applied only to IRL and import is idempotent.
5. Counts, IDs and hashes reconcile after import.
6. A reproducible cohort report can be regenerated from imported data.
7. Source records remain intact.


## Exact-count preflight observations (separate read-only statements, not a consistent export snapshot)

The following exact-count queries were run against the canonical source on 2026-10-20. They are diagnostic preflight observations only; because they were separate statements while collectors may continue running, they are **not** a single MVCC snapshot and must not be used as the final import manifest.

| Table | Exact rows in its query | Distinct IDs | Fingerprints |
|---|---:|---:|---|
| `composite_signals` | 16,139 | 16,139 | 16,139 non-null / 16,139 distinct |
| `strategy_variant_signals` | 67,587 | 67,587 | 67,587 non-null / 67,587 distinct |
| `trades` | 230 | 230 | not applicable |
| `council_signals` | 4,429 | 4,429 | not applicable |
| `council_lessons` | 224 | 224 | not applicable |
| `strategy_shadow_diagnostics` | 111,517 | 111,517 | not applicable |
| `accumulation_shadow_observations` | 55,409 | 55,409 | not applicable |
| `early_entry_variant_decisions` | 2,450 | 2,450 | not applicable |
| `repeated_buy_research_ledger` | 2,632 | 2,632 | not applicable |
| `asset_sentiment_snapshots` | 30,480 | 30,480 | not applicable |
| `asset_social_snapshots` | 24,900 | 24,900 | not applicable |
| `asset_flow_snapshots` | 37,560 | 37,560 | not applicable |
| `asset_price_snapshots` | 37,560 | 37,560 | not applicable |
| `market_candles` | 89,258 | 89,258 | not applicable |
| `whale_alerts` | 57,223 | 57,223 | not applicable |
| `whale_flow_snapshots` | 10,866 | 10,866 | not applicable |
| `whale_flow_transitions` | 4,510 | 4,510 | not applicable |
| `whale_flow_transition_context` | 4,510 | 4,510 | not applicable |
| `whale_flow_shock_followups` | 4,478 | 4,478 | not applicable |
| `event_flow_study_snapshots` | 55,615 | 55,615 | not applicable |
| `research_evidence` | 3,019 | 3,019 | 3,019 non-null / 3,019 distinct |
| `research_cases` | 3,000 | 3,000 | 2,801 non-null / 2,801 distinct; 199 null |

Timestamp ranges in the core tables are recent in the current source snapshot: `composite_signals` spans 2026-10-14 12:40 UTC to 2026-10-20 11:30 UTC; `strategy_variant_signals` spans 2026-10-14 15:30 UTC to 2026-10-20 11:30 UTC; `strategy_shadow_diagnostics` spans 2026-10-11 19:50 UTC to 2026-10-20 11:30 UTC. This may reflect retention, a reset, or current table scope; the query alone does not establish why. Before claiming all historical knowledge is preserved, inspect source migration/retention history and determine whether older cohorts exist in another table, backup, branch or export. Do not infer that older rows never existed.

Final export manifest must be recomputed in one consistent snapshot, using exact counts and canonical rowset hashes; these preflight figures are not substitutes for that step.


## Destination and live source recheck — 2026-10-22

- Target identity was verified via the official Supabase project-management API: `ragdznxfozdpxetwisrd`, project name `intelligent-research-lab`, region `eu-west-3`, status `ACTIVE_HEALTHY`. Production source `yckewtpfttvwiptmmrfq` is a separate active project.
- Target currently has one public table, `research_archive_documents`, 194 rows, ~4.52 MiB table size, and ~15 MiB total database size. The table's schema was not represented in the repository's migration history; a migration has been added to the current review branch to make it reproducible and revoke table privileges from `anon` and `authenticated`. It has not been applied.
- Existing JSON archive batches contain 7,276 distinct cases, 7,311 distinct evidence records, and 3,073 Early Entry decisions. Current source counts are 8,548, 8,584, and 3,472; exact missing IDs must be computed before transfer completion can be claimed.
- Source database size was 724,896,915 bytes (~691 MiB) at 2026-10-22 20:05:57 UTC, up from 526,126,227 bytes (~502 MiB) in the 2026-10-20 snapshot. This indicates material growth between two snapshots, not a guaranteed growth forecast.
- Retention control is fail-closed: `allow_archive=false`, `allow_source_delete=false`. The active daily job runs at 03:17 UTC, but while archive capture is disabled it exits before writes/deletes. Keep both controls disabled.


### Historical retention evidence — 2026-10-22 read-only review

- Production migration history lists the destructive original cleanup implementation as applied, and the live cron history shows one successful `research-data-retention` run daily from 2026-10-09 through 2026-10-20. The guard/capture-gate migrations were recorded on 2026-10-19 around 22:25–22:34 UTC, after that day's 03:17 UTC run.
- The original migration `20261008050000_research_data_retention_cleanup.sql` deletes raw rows older than 72 hours and derived rows older than 168 hours when called with `p_dry_run=false`. The scheduled command used exactly `cleanup_research_data(72, 168, false)`.
- Current minimum timestamps align with the last pre-gate cleanup boundary for several tables: price, flow and sentiment snapshots begin at 2026-10-16 03:20 UTC (about three minutes after the 2026-10-19 03:17 UTC run's 72-hour cutoff); whale-flow shock follow-ups begin at 2026-10-12 03:18 UTC (about one minute after its 168-hour cutoff). This is strong evidence consistent with retention deletion, but without a pre-cleanup snapshot it cannot quantify every deleted row.
- The current `allow_archive=false` and `allow_source_delete=false` gates prevent future archive writes/deletes through the current function. They do not restore any rows removed by earlier cleanup runs.
- The live migration history also lists applied sentiment-cleanup migrations `20261008100734` (`20261008123000_clean_invalid_sentiment_research_data`) and `20261008101017` (`20261008123001_remove_zero_sentiment_rows`), but corresponding SQL files were not found in the current `main` tree or eight examined relevant branches' `supabase/migrations` directories. Exact historical predicates and deleted-row counts therefore remain unverified; recover the migration SQL from Git history/other branches or trusted backup artifacts before asserting historical completeness.


## Current strategy/outcome snapshot — 2026-10-22 (raw counts; not a performance conclusion)

The following is a read-only point-in-time view of the canonical source. Keep raw variant rows, research-case rows, and actual paper trades as separate populations.

### Actual paper trades

- `trades`: 365 rows total; 352 closed and 13 open.
- Closed by `entry_source` using the source `net_pnl` field: `cmc_paper` 217 closed / -$137.82 (5 open); `standard` 72 / -$122.33 (1 open); `event_flow_paper` 39 / -$162.51 (5 open); `early_entry_regime` 24 / +$225.16 (2 open).
- The sum of these closed-trade `net_pnl` values is -$197.50. Do not mix open trades into realized PnL; confirm fees/exit semantics before using this as a dashboard headline.

### Raw strategy variant rows and derived research cases

- `strategy_variant_signals`, cohort inferred from `source_fingerprint`: V2 65,735 rows, all currently resolved; V3 5,945 rows, 4,699 resolved and 1,246 unresolved. These are raw variant rows, not unique symbol-cycle observations.
- `research_cases`: 8,548 rows. V2 has 2,250 resolved cases (419 win, 1,422 loss, 409 expired). V3 has 5,933 cases (2,447 win, 2,206 loss, 14 expired, 1,266 open). The Unknown cohort contains 365 trade-derived cases (352 closed, 13 open).
- There is an unresolved parity difference between the V3 source and derived-case counts: `strategy_variant_signals` has 4,699 resolved / 1,246 unresolved, while `research_cases` has 4,667 resolved / 1,266 open and 5,933 total cases. The totals differ by 12 and the resolved counts by 32. Do not treat the derived cases as a complete mirror until the refresh function's inclusion, maturity and upsert rules are reconciled.
- `research_evidence`: 8,584 rows, all currently tagged `entry_context`; none has a null `available_at` or `available_at < observed_at`. This is a structural check only: the live refresh function uses source `created_at` for both times in several paths, so the timestamps are not independently proven to represent true feature availability.

These figures are useful for Observatory ingestion planning but are not a substitute for deduplication by the correct symbol-cycle identity, V3 cohort parity, chronological out-of-sample evaluation, or an exact source-to-archive ID/hash reconciliation.


## Exact source/archive reconciliation — SHA-256, 2026-10-22

A fresh read-only pass compared the full source ID sets with IDs extracted from all archived JSON batches. Hashes use PostgreSQL `pgcrypto.digest(..., 'sha256')`; archive batches were checked for duplicate IDs and unexpected IDs.

| Dataset | Current source rows | Archived distinct IDs | Missing source IDs | Unexpected archive IDs | Full-row SHA-256 mismatches among overlapping IDs |
|---|---:|---:|---:|---:|---:|
| `research_cases` | 8,585 | 7,276 | 1,309 | 0 | 2,859 |
| `research_evidence` | 8,621 | 7,311 | 1,310 | 0 | 0 |
| `early_entry_variant_decisions` | 3,487 | 3,073 | 414 | 0 | 0 |

No duplicate IDs were found within the archived batches for these datasets. The live counts differ from earlier snapshots because source data continues to change; use the count/hash snapshot from this pass as the current reconciliation baseline.

### What the row hashes prove

- `research_evidence`: all 7,311 overlapping rows match the full-row SHA-256.
- `early_entry_variant_decisions`: all 3,073 overlapping rows match the full-row SHA-256.
- `research_cases`: all 7,276 archived IDs exist in the source, but 2,859 full-row hashes differ. A field-by-field comparison found that every difference is confined to mutable outcome/lifecycle fields: `net_pnl`, `outcome`, `updated_at`, `maturity_at`, `resolved_at`, and `close_reason`. The immutable identity/strategy/context projection matched for all 7,276 overlapping cases. This is stale outcome state in the archive, not evidence of mismatched source identity.

Therefore the archive is not ready to serve as the Observatory's canonical outcomes store. The next bounded idempotent refresh should upsert the 1,309 missing cases, 1,310 missing evidence records and 414 missing Early Entry decisions, then refresh the 2,859 stale case outcome rows. Re-run the same SHA-256 reconciliation afterward and require zero missing IDs, zero extra IDs, zero duplicates, and zero hash mismatches before marking these datasets complete. Do not enable source deletion.

### Historical sentiment-cleanup SQL recovery

The two migration records exist in the production migration history, but their SQL files were not found in the current `main` tree, eight examined relevant branches, GitHub file/commit searches, or the existing archive's repository-file path index. Their exact DELETE predicates cannot be safely reconstructed from migration names alone. Keep this as an unresolved forensic item; do not recreate guessed SQL or claim exact historical deletion scope without a trusted commit, backup, or audit log.


## Post-transfer verification — 2026-10-22 (supersedes the earlier pre-transfer gap counts)

A bounded, append-only reconciliation was completed against the verified archive project `ragdznxfozdpxetwisrd`. It copied only missing source rows and appended newer versions for changed `research_cases` outcome states. The canonical source `yckewtpfttvwiptmmrfq` was not modified; no source deletes, schema changes, or retention-flag changes occurred.

| Dataset | Source rows at final verification | Latest archive distinct IDs | Missing IDs | Extra IDs | Full-row SHA-256 mismatches |
|---|---:|---:|---:|---:|---:|
| `research_cases` | 8,592 | 8,592 | 0 | 0 | 0 |
| `research_evidence` | 8,628 | 8,628 | 0 | 0 | 0 |
| `early_entry_variant_decisions` | 3,490 | 3,490 | 0 | 0 | 0 |

The final verification compared full-row SHA-256 hashes using PostgreSQL `pgcrypto.digest`. For `research_cases`, earlier archived versions are retained; consumers must select the latest version per `id` by `updated_at` (then archive `generated_at` as a tie-breaker) before treating the archive as the current-state mirror. The new append-only batches carry per-row SHA-256 hashes in `payload.record_hashes`.

The archive now contains 436 documents and occupies about 17 MB. The three reconciled datasets are complete **as of this verification snapshot**; new source writes can create future deltas, so rerun reconciliation before any source retention or deletion is enabled.

This is not a full production transfer and does not prove the full repository code backup succeeded. PR [#140](https://github.com/gepappas98/pixel-perfect-pixels/pull/140) is merged at `4ae407ec2528456dc7baf210394643002a7cea1d`, but the archive still contains no `code-backup-latest` pointer or `code-snapshot-manifest-*` document. The full-repository backup is therefore **not yet verified**. The available GitHub connection cannot list GitHub Actions secret names or dispatch/inspect the push-triggered workflow run; confirm the two secrets in the `research-lab-archive` environment and run [the backup workflow](https://github.com/gepappas98/pixel-perfect-pixels/actions/workflows/research-lab-code-backup.yml). Accept success only when the run summary explicitly reports `all_tracked_files_included: true`.

The archive table privilege-hardening migration remains in open PR #8 and has not been applied. Keep `allow_archive=false` and `allow_source_delete=false`; no source cleanup is authorized by this reconciliation.
