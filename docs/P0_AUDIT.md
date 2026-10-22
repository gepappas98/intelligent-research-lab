# P0 Infrastructure & Data Audit

**Project:** Intelligent Research Lab (IRL)  
**Repository:** https://github.com/gepappas98/intelligent-research-lab  
**Audit status:** Initial reconnaissance plus verified runtime project mapping; data semantics audit remains open  
**Rule:** Read-only inspection only. No database schema, data, execution logic, or deployed application has been changed.

## 1. Repository baseline

- Repository is private and accessible to the connected GitHub integration.
- Default branch: `main`.
- IRL is a separate project. Do not copy the existing application or point this repository at a production Supabase project until the architecture and isolation plan are approved.
- Project identity evidence is documented in [Supabase Project Identity Map](SUPABASE_PROJECT_MAP.md).

## 2. Source-system identity — runtime resolved; Lovable DB context remains open

The authoritative Supabase project for the Trading Command Center browser runtime and active Edge Functions is **`yckewtpfttvwiptmmrfq`** (`https://yckewtpfttvwiptmmrfq.supabase.co`).

Evidence:
- `supabase/config.toml` in `gepappas98/pixel-perfect-pixels` sets `project_id = "yckewtpfttvwiptmmrfq"`.
- `src/integrations/supabase/client.ts` explicitly pins the browser client to the canonical URL and publishable key if build-time values do not match both canonical values.
- `src/lib/mcp-diagnostic.server.ts` defines the same canonical project ref.
- Latest Lovable project commit and latest Vercel production deployment both reference `20d94cee54b48a13bf50843715de30d67aba64e7`.
- The canonical project has the expected active Edge Functions, including `trading-pipeline-orchestrator`, `trade-executor`, and `event-flow-lab`.

**Configuration drift found:** `gbbrmzstuhdizfvabjvz` appears in the tracked GitHub `.env` and Lovable project's `.env`, but it is not the canonical runtime target. The connected Supabase project-management API denied access to that ref, so its exact ownership and whether it is the Lovable attached database's ref remain unconfirmed.

**Separate Lovable database context found:** read-only queries through Lovable's attached database tool returned 21 public tables, 3,570 `composite_signals`, 641 `pipeline_runs`, 746 `strategy_variant_signals`, and zero `trades`, with latest signal/run timestamps on 2026-10-07. The canonical Supabase project returned 50 public tables, 30,537 `composite_signals`, 2,253 `pipeline_runs`, 15,164 `strategy_variant_signals`, and 344 `trades`, with latest rows on 2026-10-10. These are materially different database states.

The app's `drizzle.config.ts` reads `LOVABLE_DB_MIGRATION_URL`; the configured value was not exposed or verified. Vercel environment metadata could not be retrieved because the integration received HTTP 403 for the `gepappas-projects` scope. This does not negate the verified browser runtime mapping, but the migration target must be separately verified before running migrations.

See [the full evidence and project map](SUPABASE_PROJECT_MAP.md).

## 3. Database size and growth risk

Read-only SQL inspection of the canonical Trading Command Center Supabase project returned an earlier point-in-time database size of approximately **435 MB** (456,223,891 bytes). An earlier relation-size inspection reported:
- `pipeline_runs`: approximately **229 MB** total relation size.
- About **228 MB** associated with TOAST storage.
- 2,006 `pipeline_runs` rows had non-null `result`; average result payload about **83 KB**, p95 about **111 KB**, maximum about **116 KB**.

These are earlier measurements and not a current growth-rate forecast. Re-measure before setting a collection pause threshold. Do not delete or rewrite historical payloads as part of this audit.

## 4. Source data inventory — current read-only snapshot

Counts below were queried from the canonical project `yckewtpfttvwiptmmrfq` on 2026-10-10. They are point-in-time values and can change as collection continues.

| Source table | Observed rows / state | Research implication |
|---|---:|---|
| `composite_signals` | 30,537 rows | Candidate signal source; verify identity, time semantics and immutable-at-entry fields |
| `strategy_variant_signals` | 15,164 rows | Candidate research outcomes; validate resolution and PnL semantics before reuse |
| `trades` | 344 rows | Candidate execution records; outcome/closure semantics still need verification |
| `pipeline_runs` | 2,253 rows | Large payload storage; avoid copying complete run JSON into IRL |
| `public` tables | 50 | Canonical source schema inventory |

### Preliminary signal-field coverage

From 30,537 `composite_signals` rows in the earlier read-only coverage query:

- 24,875 had a fingerprint.
- 22,974 had a recorded price-at field.
- 28,245 had an indicator snapshot link.
- 9,615 had a prediction-market snapshot link.
- 22,895 had an AI Council signal link.

Coverage varies by field. IRL must track field-level availability and question-specific eligibility. Missing historical values must not be filled from current values.

## 5. Required IRL data contract

Before building ingestion or outcome calculations, define and test:

1. **Identity:** stable source system + source record ID/version, with a documented deterministic fallback only when needed.
2. **Bitemporal timestamps:** event/valid time separately from ingestion/knowledge time.
3. **Immutable initial snapshot:** conditions available at the initial signal time are stored once and never overwritten by later outcomes.
4. **Separate subsequent records:** material observation events and outcome revisions are stored separately with provenance and version.
5. **Outcome state machine:** versioned completion rules; distinguish observing, verified closed, horizon reached, censored, invalid and review-required cases.
6. **Net outcome:** define gross PnL, fees, slippage and other costs; distinguish simulated/shadow estimates from actual execution.
7. **No look-ahead bias:** later-known conditions may explain the path but cannot be treated as known at signal time.
8. **Idempotency:** safe retry does not duplicate observations or events.
9. **Data quality:** completeness, freshness, provenance, timestamp validity and explicit exclusion reasons.
10. **Storage guardrails:** measure daily growth, include TOAST and indexes, alert/throttle noncritical ingestion before the agreed safe ceiling.

## 6. Remaining questions before schema design

- What exact Supabase project ref backs Lovable's attached database tool, and what target is configured in `LOVABLE_DB_MIGRATION_URL`?
- Is Vercel environment metadata needed after the source-level canonical guard is confirmed? If so, restore access to the correct Vercel scope before reading metadata.
- What are the actual primary keys and update behavior of each candidate source table?
- Which timestamps represent event time, source update time, ingestion time and resolution time?
- How are signal, entry, episode, shadow position and trade related?
- What exactly triggers `resolved_at`, and are outcomes recalculated after resolution?
- How are TP/SL, expiry, candle ordering, fees and slippage implemented in each existing evaluator?
- Which historical context values can be reconstructed reliably, and which are genuinely unavailable?
- What are the provider's current hard storage limits and maintenance headroom?

## 7. Next steps

1. Verify Lovable's migration connection target without exposing the secret value; do not run migrations until verified.
2. Inspect relevant DDL, indexes, constraints, foreign keys, triggers, RPCs, RLS policies, Edge Function source and schedules on the canonical source project.
3. Trace signal identity and outcome lifecycle end to end with representative records.
4. Produce a field-level data dictionary and source-to-IRL mapping.
5. Approve the data contract and storage budget.
6. Only then draft a schema migration for a separate IRL database/schema.

## Safety boundary

This document records observed facts and remaining questions, not a certification of system health or data correctness. The audit did not alter the existing Trading Command Center, execute trades, write to its tables, or apply migrations.


## 8. Addendum — wrong-repository archive state and dependency trace (2026-10-20)

This addendum supersedes earlier source-size/count snapshots only where explicitly stated. Earlier measurements above remain historical observations, not current values.

### Latest source-side archive snapshot

Read-only inspection of the canonical Trading Command Center project `yckewtpfttvwiptmmrfq` reported:

- Database size: **504,605,843 bytes (~481 MB)**.
- `research_evidence`: 3,019 rows; `research_cases`: 3,000 rows; `research_findings`: 0 rows; `research_archive_control`: 1 row.
- Archive capture and source deletion are both disabled.
- Retention preflight: 29,790 eligible source rows, 0 archived and 29,790 missing evidence. Coverage is incomplete; do not enable retention or delete source rows.
- Permissive `SELECT USING (true)` policies for `anon` and `authenticated` were observed on the archive tables. No policy changes have been made.
- The archive-specific applied migration history and cron dependencies are documented in [the containment plan](WRONG_REPO_CONTAINMENT_AND_ROLLBACK.md) and [dependency inventory](WRONG_REPO_DEPENDENCY_INVENTORY.md).

### Confirmed source application dependency paths

Read-only GitHub inspection of the current source `main` found:

1. `src/lib/pipeline.server.ts` calls `refresh_research_knowledge_cases({ p_lookback_hours: 72 })` after post-mortem generation, with an 8-second timeout and fail-open handling. A failure is logged/recorded; the code says the trading flow continues unchanged.
2. `src/lib/research-knowledge.functions.ts` reads `research_evidence`, `research_cases` and `research_findings`, and calls `get_research_archive_status(72,168)`.
3. `src/components/trading/ResearchKnowledgePanel.tsx` imports the server reader and displays the bounded research snapshot; the component is mounted from `src/routes/index.tsx` and `src/pages/AIReport.tsx`.
4. `src/lib/_tests_/research-knowledge.test.ts` covers pure temporal eligibility, cohort isolation, outcome maturity, evidence linkage and fail-closed archival contracts. Retain these tests where useful even if the wrong-repository persistence integration is later decoupled.
5. The archive-specific SQL functions are not isolated from the app yet. Dropping tables/functions before a separately reviewed caller-decoupling change would leave the current reader dependent on missing tables and the pipeline attempting a missing RPC.

### Material semantic limitation

The deployed refresh function uses source `created_at` as both `observed_at` and `available_at` for trades, composite signals and variant signals. Current source inspection does not establish that this is the actual event time or earliest strategy-availability time. The function also does not independently compute the 72-hour maturity boundary from entry time. Treat these generated archive timestamps/maturity labels as unverified; do not import them as authoritative IRL point-in-time facts.

### Decision as of 2026-10-20

At the time of this 2026-10-20 snapshot, no production export had been created or verified and the IRL destination identity was not yet confirmed. No source rows, archive tables, functions, policies, cron jobs, trading logic or deployments were changed by that audit. The 2026-10-22 live recheck below supersedes the destination-identity statement; transfer remains blocked pending schema/access review, a secure checksum-verified export plan and exact source-ID reconciliation.


## 9. Fresh live snapshot — 2026-10-20 05:31 UTC

A further read-only SQL check supersedes the earlier size and retention counts above:

- Database size: **505,736,339 bytes = 505.74 MB (decimal) / 482.31 MiB (binary)**.
- Archive rows unchanged: `research_evidence` 3,019; `research_cases` 3,000; `research_findings` 0; `research_archive_control` 1.
- `get_research_archive_status(72,168)`: `incomplete`; **30,084 eligible, 0 archived, 30,084 missing evidence**. Source capture and source deletion remain disabled.
- Latest missing-by-source counts: `asset_news_events` 363; `asset_flow_snapshots` 9,450; `whale_flow_snapshots` 1,416; `asset_price_snapshots` 9,450; `whale_flow_transitions` 545; `event_flow_transmissions` 1; `asset_sentiment_snapshots` 7,773; `whale_flow_shock_followups` 541; `whale_flow_transition_context` 545.
- Current total relation sizes (including indexes/TOAST) for archive tables: evidence 2,039,808 bytes; cases 1,548,288; findings 40,960; control 32,768. Combined: 3,661,824 bytes (~3.49 MiB). Dropping these tables would not solve the database-size problem by itself.
- The query was read-only; no cleanup function was invoked and no data, policy, schema, cron or trading behavior was changed.


## 7. Fresh canonical source snapshot — 2026-10-20 11:34 UTC

A new read-only SQL snapshot was taken from the verified canonical TCC project `yckewtpfttvwiptmmrfq`. Database size was **526,126,227 bytes (~502 MB)**. This is a newer and larger measurement than the earlier 481 MiB / 504,605,843-byte snapshot; the different query/measurement times explain the difference. Treat this as a new baseline, not a deletion trigger.

### Largest observed relations

| Table | Estimated live rows | Total relation size |
|---|---:|---:|
| `strategy_shadow_diagnostics` | 111,517 | 93 MB |
| `composite_signals` | 16,139 | 75 MB |
| `strategy_variant_signals` | 67,587 | 40 MB |
| `pipeline_runs` | 858 | 36 MB |
| `whale_alerts` | 57,223 | 33 MB |
| `market_candles` | 89,258 | 30 MB |
| `accumulation_shadow_observations` | 55,409 | 25 MB |
| `asset_sentiment_snapshots` | 30,457 | 16 MB |
| `asset_social_snapshots` | 24,900 | 15 MB |
| `asset_flow_snapshots` | 37,530 | 12 MB |
| `event_flow_study_snapshots` | 55,585 | 12 MB |
| `asset_price_snapshots` | 37,530 | 11 MB |

Sizes include indexes/TOAST where applicable. Row counts are PostgreSQL planner statistics, not exact counts. The largest measured relation is now `strategy_shadow_diagnostics`, not `pipeline_runs`; both should be investigated by retention/value policy, but neither should be deleted as part of this transfer. This is a storage triage observation, not permission to clean up data.

Archive tables in this same snapshot:
- `research_evidence`: estimated 3,019 rows; ~1.95 MiB.
- `research_cases`: estimated 3,000 rows; ~1.48 MiB.
- `research_findings`: 0 estimated rows; 40 KiB.
- `research_archive_control`: one row; 32 KiB.

The archive tables are only a few MiB together; dropping them would not solve the main storage pressure. Do not roll them back blindly.

### Current strategy_config row — distinct from code defaults

The live row with `id=1` returned:
- `preset_name = conservative`
- whale / technicals / council weights = 1.2 / 1.2 / 1.2
- prediction weight = 0
- `auto_switch_enabled = true`
- `auto_switch_interval_hours = 1`
- updated at `2026-10-17T13:30:04.845Z`
- last auto-switch reasoning references a sample of only two resolved observations, 4.00% average PnL and 100% win rate.

This is a source configuration snapshot, not a change made by IRL. It differs from code defaults and from the historical policy description requiring at least 25 resolved observations. The 2-sample result is statistically weak; investigate the exact current auto-switch implementation and its eligibility gate before interpreting it. IRL itself must not change the source configuration or switch presets.

### Fresh core row-count estimates

The same snapshot estimated `trades` 230, `composite_signals` 16,139, `strategy_variant_signals` 67,587, `council_signals` 4,429, `council_lessons` 224, `indicator_snapshots` 691, `pipeline_runs` 858, `whale_alerts` 57,223, `asset_sentiment_snapshots` 30,457, `asset_flow_snapshots` 37,530, `asset_price_snapshots` 37,530, `whale_flow_snapshots` 10,866, `whale_flow_transitions` 4,510, `whale_flow_transition_context` 4,426, `whale_flow_shock_followups` 4,475, `accumulation_shadow_observations` 55,409, `early_entry_variant_decisions` 2,450, `repeated_buy_research_ledger` 2,632, and `strategy_shadow_diagnostics` 111,517. These are planner estimates and must be replaced with exact counts from a consistent MVCC export before import.

### Immediate implications

1. The immediate space problem is not solved by moving only the archive tables; they are too small.
2. The knowledge transfer should prioritize strategy outcomes, shadow diagnostics, Early Entry decisions, whale transitions/follow-ups, price/flow/sentiment context and their source IDs, while preserving full source history.
3. High-volume raw snapshot data should be transferred as bounded, versioned observations with provenance; large JSON blobs should not be copied indiscriminately.
4. At this 2026-10-20 snapshot, the destination was still unverified. The 2026-10-22 recheck below now verifies project identity, but no production data has been exported/imported into IRL and no target migration has been applied.


## Live recheck — 2026-10-22 (read-only; supersedes destination identity blocker only)

### Destination identity

The official Supabase project-management API now independently verifies the IRL target as `ragdznxfozdpxetwisrd` (`intelligent-research-lab`, `eu-west-3`, `ACTIVE_HEALTHY`). Production remains `yckewtpfttvwiptmmrfq` (`trading-command-center`, `eu-west-2`). The unrelated `opwkbdbpqgtgcrmqqmbq` project is `polymarket-quant-bot-lite` and inactive. This resolves the **project identity** gate; it does not authorize data transfer.

### Current archive completeness and access posture

- Target database: ~15 MiB total; `public.research_archive_documents` is ~4.52 MiB with 194 documents.
- Target has RLS enabled but no policies. This currently denies row access through ordinary API roles, but `anon` and `authenticated` still hold table-level privileges. The new migration on branch `ops/verified-irl-destination-and-archive-lockdown-2026-10-22` records the existing schema and revokes those privileges. It is not applied to the target.
- The archive currently contains distinct source IDs for 7,276 cases, 7,311 evidence records, and 3,073 Early Entry decisions. The current source counts are 8,548, 8,584, and 3,472. This establishes net row-count gaps of at least 1,272, 1,273, and 399, but the exact missing source IDs and payload hashes remain unverified.
- Existing repository code archive is partial: the previous archive index covers 400 tracked paths, but only 32 critical files were copied as 70 chunks. The full-repository backup workflow was merged from PR [#140](https://github.com/gepappas98/pixel-perfect-pixels/pull/140) at commit `4ae407ec2528456dc7baf210394643002a7cea1d`. The uploader has an explicit archive-project URL allowlist and the summary now includes `all_tracked_files_included`; no successful workflow run has yet been confirmed, so the code archive is not yet a verified recovery point.

### Current production retention/storage status

At 2026-10-22 20:05:57 UTC, the canonical production database measured 724,896,915 bytes (~691 MiB), versus 526,126,227 bytes (~502 MiB) in the 2026-10-20 snapshot. This is approximately 199 MB growth across two observations about 56.5 hours apart; do not extrapolate it as a guaranteed growth rate.

The largest current relations are `strategy_shadow_diagnostics` (~132 MB), `composite_signals` (~112 MB including ~87 MB TOAST), `strategy_variant_signals` (~47 MB), `whale_alerts` (~46 MB), `market_candles` (~45 MB), and `pipeline_runs` (~38 MB, almost entirely TOAST).

Live `research_archive_control` flags are `allow_archive=false` and `allow_source_delete=false`. The daily 03:17 UTC retention job is active and reports successful execution, but the current function exits before archive writes or deletes while archive capture is disabled. The job's success is not proof of a completed archive. Both flags must remain disabled until transfer completeness and evidence retention are reviewed.

### Next safe gates

1. Review/merge the IRL migration PR, then apply it only to the verified IRL target after approval; do not touch production schema.
2. Reconcile exact IDs and deterministic logical row hashes for all archived batches; refresh only missing/new rows in bounded idempotent batches.
3. Finish source retention/cleanup history review and confirm no historical periods are assumed complete without evidence.
4. Verify a complete repository backup workflow run before treating the code archive as a recovery point.


### Historical retention evidence — 2026-10-22 read-only review

- Production migration history lists the destructive original cleanup implementation as applied, and the live cron history shows one successful `research-data-retention` run daily from 2026-10-09 through 2026-10-20. The guard/capture-gate migrations were recorded on 2026-10-19 around 22:25–22:34 UTC, after that day's 03:17 UTC run.
- The original migration `20261008050000_research_data_retention_cleanup.sql` deletes raw rows older than 72 hours and derived rows older than 168 hours when called with `p_dry_run=false`. The scheduled command used exactly `cleanup_research_data(72, 168, false)`.
- Current minimum timestamps align with the last pre-gate cleanup boundary for several tables: price, flow and sentiment snapshots begin at 2026-10-16 03:20 UTC (about three minutes after the 2026-10-19 03:17 UTC run's 72-hour cutoff); whale-flow shock follow-ups begin at 2026-10-12 03:18 UTC (about one minute after its 168-hour cutoff). This is strong evidence consistent with retention deletion, but without a pre-cleanup snapshot it cannot quantify every deleted row.
- The current `allow_archive=false` and `allow_source_delete=false` gates prevent future archive writes/deletes through the current function. They do not restore any rows removed by earlier cleanup runs.
- The live migration history also lists applied sentiment-cleanup migrations `20261008100734` (`20261008123000_clean_invalid_sentiment_research_data`) and `20261008101017` (`20261008123001_remove_zero_sentiment_rows`), but corresponding SQL files were not found in the current `main` tree or eight examined relevant branches' `supabase/migrations` directories. Exact historical predicates and deleted-row counts therefore remain unverified; recover the migration SQL from Git history/other branches or trusted backup artifacts before asserting historical completeness.


The next audit should recover the two missing sentiment-cleanup migration files and determine the historical deleted-row scope. Do not infer that all pre-2026-10-16 context is absent solely from current minimum timestamps, and do not claim full historical coverage until older snapshots/backups and event-vs-ingestion timestamps are reconciled.


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


## Batch research inventory — live snapshot 2026-10-22 21:25 UTC

Read-only counts from the canonical production Supabase. These are current observations, not immutable baselines; new rows appeared after the append-only archive verification at approximately 21:02 UTC.

### Current core datasets

| Dataset | Current rows | First/latest observed timestamp where available | Archive state |
|---|---:|---|---|
| `research_cases` | 8,609 | Derived outcome cases | Last verified archive: 8,592; current delta +17 |
| `research_evidence` | 8,645 | Evidence rows | Last verified archive: 8,628; current delta +17 |
| `early_entry_variant_decisions` | 3,496 | Decision rows | Last verified archive: 3,490; current delta +6 |
| `strategy_variant_signals` | 71,739 | 2026-10-14 through 2026-10-22 21:20 UTC | Not included in the three-table reconciliation |
| `strategy_shadow_diagnostics` | 161,413 | High-volume diagnostic history | Not yet reconciled/transferred |
| `council_signals` | 6,233 | Council source/sync timestamps | Not yet reconciled/transferred |
| `council_lessons` | 313 | 2026-10-12 through 2026-10-21 21:10 UTC | Not yet reconciled/transferred |
| `cmc_listing_snapshots` | 28,200 | 2026-10-15 through 2026-10-22 20:20 UTC; 1,037 symbols | Not yet reconciled/transferred |
| `cmc_macro_snapshots` | 334 | 2026-10-15 through 2026-10-22 21:20 UTC | Not yet reconciled/transferred |
| `event_flow_transmissions` | 72 | 2026-10-12 through 2026-10-22 20:30 UTC; 12 assets | Not yet reconciled/transferred |
| `event_flow_paper_decisions` | 42 | 2026-10-14 through 2026-10-22 21:25 UTC | Not yet reconciled/transferred |
| `trades` | 365 | Paper-trade outcomes and open positions | Not yet reconciled/transferred |

### Trade outcome snapshot

| Entry source | Total | Closed | Open | Closed `net_pnl` sum |
|---|---:|---:|---:|---:|
| CMC Paper | 222 | 217 | 5 | -$137.82 |
| Early Entry Regime | 26 | 24 | 2 | +$225.16 |
| Event Flow Paper | 44 | 39 | 5 | -$162.51 |
| Standard | 73 | 72 | 1 | -$122.33 |
| **Total** | **365** | **352** | **13** | **-$197.50** |

These sums are from the current `trades.net_pnl` field filtered to closed trades. Preserve gross PnL, fees, net PnL, close reason, entry metadata, and the open/closed status as separate facts in the Observatory; never infer realized PnL from open positions.

### Strategy variant population

- V2: 65,735 raw rows; all resolved; mean stored `pnl_pct` -0.7018%.
- V3: 6,004 raw rows; 4,880 resolved and 1,124 unresolved; mean stored `pnl_pct` +0.5748% among resolved rows.
- These are raw variant rows and are **not** unique symbol-cycle samples. Do not compare V2 to V3 as if they were deduplicated independent observations. V2 is historical/reference only; V3 must be deduplicated and aligned to the live MTF scoring contract before inference.

### Council learning quality

- `council_lessons`: 313 lessons across 66 symbols.
- All 313 have a `source_trade_id` and non-null `realized_pnl`; no lesson is shorter than 20 characters.
- Lesson counts are concentrated in GTC (45), OSMO (31), and AMP (31), which is a coverage/skew signal, not evidence that those symbols have the most predictive lessons.
- Observatory should retain up to five **distinct, evidence-linked** lessons per symbol, with source trade, entry context, verdict/conviction, realized outcome and created timestamp. Keep rejected, contradicted and superseded lessons in the audit trail; do not let duplicate wording consume the five slots.

### Event→Flow and CMC data quality

- `cmc_listing_snapshots`: 28,200 rows / 1,037 symbols, no missing `price_usd` in this snapshot. `cmc_macro_snapshots`: 334 rows. CMC remains discovery/context and a label source, never a standalone BUY voter.
- `event_flow_transmissions`: 72 rows / 12 assets; 27 rows have `data_quality` outside the accepted labels `ok`, `good`, or `complete`. Review actual label values before treating that count as unusable records.
- `event_flow_paper_decisions`: 42 rows, 14 missing `sentiment_score`. Preserve them as incomplete decisions rather than dropping them; investigate source freshness and gate eligibility.

### Immediate incremental work

1. Reconcile the +17 cases, +17 evidence rows and +6 Early Entry decisions that appeared after the last verified archive snapshot. Re-run latest-state SHA-256 checks after append-only sync; keep source deletion disabled.
2. Inspect the full repository backup workflow status. The archive still has no `code-backup-latest` pointer or `code-snapshot-manifest-*` document, so the full code backup is **not verified**. The connector cannot inspect GitHub environment secrets or dispatch a workflow; a maintainer must confirm the two archive-only secrets and run the workflow from GitHub Actions.
3. Expand the transfer manifest to the unverified tables above, starting with `trades`, `council_lessons`, `council_signals`, V3 variant signals, Early Entry regime observations, CMC macro/listing snapshots, and Event→Flow decisions/transmissions. Record exact source table, source ID, content hash, source timestamps and transfer snapshot time.
4. Profile `strategy_shadow_diagnostics` (161,413 rows / ~133 MiB) before copying every raw row. Preserve raw data in a bounded archive if needed, but derive compact, versioned rollups for the Observatory instead of duplicating large JSON payloads into dashboard queries.

### Review state

PR [#8](https://github.com/gepappas98/intelligent-research-lab/pull/8) remains open and has no submitted reviews. The migration is not applied. Its least-privilege intent is to revoke all table privileges from `public`, `anon`, `authenticated`, and `service_role`, then grant only `SELECT`, `INSERT`, and `UPDATE` to `service_role` for the idempotent uploader; it deliberately grants no `DELETE` or `TRUNCATE`. Review/approval is still required before merging or applying it to the verified IRL project.
