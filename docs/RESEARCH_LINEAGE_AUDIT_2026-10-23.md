# Research lineage audit — 2026-10-23

Scope: read-only data checks against canonical TCC Supabase project `yckewtpfttvwiptmmrfq`, plus source-repository inspection. No production writes, cleanup, strategy changes, merge, or deployment were performed.

## 1. IRL migration filename reconciliation

The verified IRL runtime migration history contains:
- `20261022214807 lock_archive_document_store`
- `20261022215155 revoke_public_execute_rls_auto_enable`

The PR branch has been corrected to use `supabase/migrations/20261022214807_lock_archive_document_store.sql`; the duplicate timestamp file `20261022210000_lock_archive_document_store.sql` was removed. The corrected file content is identical to the SQL used for the already-applied IRL runtime change. The `20261022215155` file remains present. This is repository reconciliation only; do not re-apply these migrations or merge/deploy until the PR checks and final diff are reviewed.

## 2. Full repository backup — still blocked, not claimed complete

Workflow: `.github/workflows/research-lab-code-backup.yml`, production repo commit `4ae407ec2528456dc7baf210394643002a7cea1d`.
- Failed run: `39853061499`.
- Its uploader validation passed, but upload failed because `ARCHIVE_SUPABASE_URL` and `ARCHIVE_SUPABASE_SERVICE_ROLE_KEY` were empty.
- The run has no uploaded artifacts. No full repository snapshot, manifest, or latest-pointer verification exists yet.
- Uploader source enforces the exact host `https://ragdznxfozdpxetwisrd.supabase.co/`, rejects tracked secret-like paths, and records commit/tree, path, Git blob SHA, byte length, SHA-256, mode, and chunk count. Do not bypass these guards.
- Required action outside the available tool permissions: set those two GitHub Actions environment secrets under `research-lab-archive` to the verified IRL URL and its service-role key, then run the workflow manually. Never point the backup secrets at production. Do not rerun while the secrets are known empty.

## 3. Council lesson source_trade_id reconciliation

Current read-only check: 29 of 313 Council lessons have a `source_trade_id` not present in current `trades.id`; none of the 29 IDs match `trade_alerts.trade_id`. There are same-symbol trades, but no exact entry-price matches and no exact exit-price/close-reason matches. Only 2 lessons match a current trade's PnL within 0.02; that is not sufficient to relink.

Group summary:
- UNI: 7 lessons, all losses/stop-loss, total lesson PnL about -223.84.
- ARB: 4, all losses/stop-loss, about -133.61.
- INJ: 4, all wins/take-profit, about +243.25.
- ADA: 3, all losses/stop-loss, about -104.17.
- XRP: 3, all losses/stop-loss, about -95.81.
- TIA: 2, all losses/stop-loss, about -65.12.
- ZEC: 2, all losses/stop-loss, about -63.70.
- PENGU, SEI, SUI, TAO: 1 each; all losses/stop-loss.

The lesson records are tightly clustered in time (2026-10-12 through 2026-10-14) and entry_context contains entry/exit prices, side, close_reason and MTF reasoning. This looks like a legacy ID/lineage mismatch or missing historical trade source, not a safe symbol-based join. The current `cleanup_research_data` function does not delete `trades`; do not attribute these orphans to that function without separate evidence. Keep all 29 lessons; classify as `unresolved_historical_source_id` until an authoritative historical snapshot, audit log, or ID mapping is found.

## 4. Strict point-in-time validity — material blocker

Current source counts:
- `research_cases`: 8,648 at the latest query; V3 6,033 (4,923 resolved, 1,110 unresolved), V2 2,250 (all resolved), Unknown 365 (352 resolved, 13 unresolved). Counts vary slightly across snapshots while writers are active; retain query timestamp with every comparison.
- All 8,648 cases have `entry_at`, and none have an empty evidence reference list in the latest check.
- Flattened research-evidence references were previously reconciled: 8,674 refs, zero unresolved evidence IDs.
- `research_evidence`: 8,674 records. 8,283 source `strategy_variant_signals`, 365 `trades`, 36 `composite_signals`. Every row has `observed_at = available_at`; every row has `captured_at > available_at`. No fingerprints are missing.
- The current evidence builder appears to set `observed_at` and `available_at` to the same timestamp. Equal values do not independently prove availability at that time; and capture occurs later. Therefore, do not promote these rows to strict point-in-time evidence solely from those columns. Keep provenance status unverified until source event/availability timestamps are independently verified. Do not require `captured_at <= entry_at` as a blanket rule because capture is ingestion time, not necessarily feature availability.

A join of all 26 linked `early_entry_variant_decisions` to current trades found all 26 decision `observed_at` values **after** the linked trade's `created_at`. This is a critical lineage/timing finding: these rows cannot be treated as pre-entry decision evidence as currently timestamped. Inspect the decision producer, upsert semantics, and trade linkage; preserve them as post-entry/ambiguous until proven otherwise. The 3,479 decisions without trades may represent valid NO_ENTRY/waiting decisions; do not call them broken links automatically.

## 5. CMC research lineage

Current `cmc_listing_research_observations`:
- 28,200 observations, 1,050 distinct CMC IDs, 2026-10-15 22:30 UTC to 2026-10-22 20:20 UTC.
- `rank_improvement` present on 27,150; `volume_multiple_vs_prior_snapshot` present on 26,257.
- All 27,150 prior timestamps present are earlier than the current observation; no reversed prior timestamps.
- 25,010 24h forward-return labels and 16,919 72h labels; no observed label timestamp is at/before its source observation; no labels fell below the checked minimum horizon thresholds.
- `cmc_listing_snapshots` also has 28,200 rows / 1,050 assets; `cmc_macro_snapshots` has 335 rows, latest at 2026-10-22 21:50 UTC.
- Forward return columns are labels/outcomes, not entry-time features. Source-code search found the forward-return columns in `CmcResearchOutcomePanel.tsx` for outcome display and the migration that derives labels from later snapshots. Do not allow forward labels to feed BUY scoring or watchlist selection. Treat repeated observations of the same asset as correlated longitudinal observations, not independent samples.

## 6. Event→Flow lineage

- `event_flow_study_snapshots`: 76,585 rows, 2026-10-11 21:40 UTC through 2026-10-22 21:55 UTC.
- `event_flow_transmissions`: 73 rows, event times 2026-10-12 18:45 UTC through 2026-10-22 21:55 UTC; ingestion/created times start 2026-10-14 15:30 UTC. Every row has `event_at`; all source_kind values are `news`.
- Current transmission classes: `flow_followed` 24, `insufficient_data` 19, `flow_diverged` 19, `no_flow_response` 11. Several latest records are `developing` or `partial`; do not treat these as mature outcomes.
- `event_flow_paper_decisions`: 42 rows, statuses `NOT_CONFIRMED` (28) and `WAITING_DATA` (14); this snapshot has no BUY/entry decisions. These are not trades or confirmed transmissions.
- The live panel queries transmissions by `event_at` and raw news by `event_at`, sentiment by `observed_at`; this is the right event-time orientation. For causal studies, require `event_at <= observation time <= outcome horizon`, preserve ingestion time separately, and exclude partial/developing cases from mature outcome metrics.

## 7. Safeguards / next actions

1. Review the corrected PR #8 diff and checks; no merge or deploy yet.
2. Set the two backup secrets in the GitHub environment and run the full-repository backup. Verify artifact manifest, tracked-file count, all file SHA-256 values, chunk counts, and IRL archive row/document-key counts before calling it complete.
3. Recover authoritative historical trade IDs for the 29 Council lessons from a private source snapshot/audit log; no fuzzy relinking.
4. Fix Early Entry provenance at the producer/upsert layer, then reclassify the 26 linked decisions only after source timing is proven.
5. For strict PIT evaluation, mark evidence timestamps as unverified where availability is inferred rather than observed; do not treat equality of observed/available timestamps as proof.
6. Keep V2, V3, Unknown, CMC labels, Event→Flow developing outcomes, and Council post-mortems in separate cohorts. Preserve all history; no deletion or retention expansion was applied.
