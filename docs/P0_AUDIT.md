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

### Current decision

Continue documentation and read-only source tracing only. No production export has yet been created or verified; no IRL writable database has been positively identified; no data has been copied; no source rows, archive tables, functions, policies, cron jobs, trading logic or deployments have been changed by this audit. The next safe phase remains destination identity verification and a secure, checksum-verified export plan before any rollback is considered.


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
4. A destination database is still unverified. Therefore no production data has been exported/imported into IRL yet and no target migration is applied.


## Live recheck — 2026-10-22 (read-only; supersedes destination identity blocker only)

### Destination identity

The official Supabase project-management API now independently verifies the IRL target as `ragdznxfozdpxetwisrd` (`intelligent-research-lab`, `eu-west-3`, `ACTIVE_HEALTHY`). Production remains `yckewtpfttvwiptmmrfq` (`trading-command-center`, `eu-west-2`). The unrelated `opwkbdbpqgtgcrmqqmbq` project is `polymarket-quant-bot-lite` and inactive. This resolves the **project identity** gate; it does not authorize data transfer.

### Current archive completeness and access posture

- Target database: ~15 MiB total; `public.research_archive_documents` is ~4.52 MiB with 194 documents.
- Target has RLS enabled but no policies. This currently denies row access through ordinary API roles, but `anon` and `authenticated` still hold table-level privileges. The new migration on branch `ops/verified-irl-destination-and-archive-lockdown-2026-10-22` records the existing schema and revokes those privileges. It is not applied to the target.
- The archive currently contains distinct source IDs for 7,276 cases, 7,311 evidence records, and 3,073 Early Entry decisions. The current source counts are 8,548, 8,584, and 3,472. This establishes net row-count gaps of at least 1,272, 1,273, and 399, but the exact missing source IDs and payload hashes remain unverified.
- Existing repository code archive is partial: the previous archive index covers 400 tracked paths, but only 32 critical files were copied as 70 chunks. The full-repository backup workflow is still open in PR [#140](https://github.com/gepappas98/pixel-perfect-pixels/pull/140); its latest branch commit adds an explicit archive-project URL allowlist. No successful full backup has been confirmed.

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
- The live migration history also lists applied sentiment-cleanup migrations `20261008100734` (`20261008123000_clean_invalid_sentiment_research_data`) and `20261008101017` (`20261008123001_remove_zero_sentiment_rows`), but corresponding SQL files were not found in the current `main` tree's `supabase/migrations` directory. Exact historical predicates and deleted-row counts therefore remain unverified; recover the migration SQL from Git history/other branches or trusted backup artifacts before asserting historical completeness.


The next audit should recover the two missing sentiment-cleanup migration files and determine the historical deleted-row scope. Do not infer that all pre-2026-10-16 context is absent solely from current minimum timestamps, and do not claim full historical coverage until older snapshots/backups and event-vs-ingestion timestamps are reconciled.
