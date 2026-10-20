# Research Knowledge Transfer — P0

**Destination:** `gepappas98/intelligent-research-lab`  
**Branch:** `research/knowledge-transfer-p0`  
**Status:** Documentation transfer only; no database connection, migration, ingestion, deployment, or source-row mutation performed by this change.

## 1. Purpose and boundaries

This document transfers accumulated research context from the Trading Command Center work into the independent Intelligent Research Lab (IRL). It is a research specification and source map, not a claim that any historical dataset has already been imported or independently validated.

IRL must remain isolated from execution:
- Read-only access to source systems during the forensic phase.
- No trade execution and no writes to Trading Command Center execution tables.
- No automatic strategy switching.
- No destructive cleanup or source-history rewriting.
- Do not point IRL at either the canonical production database or the unidentified Lovable migration database as its writable backend.
- Do not apply schema migrations until IRL's own isolated database identity, credentials, and storage budget are confirmed.

## 2. Transfer status and incident containment

Research Knowledge/archive implementation work was mistakenly made in `gepappas98/pixel-perfect-pixels` rather than this repository. The unmerged candidate PR #133 was closed so it cannot be merged accidentally:
- Wrong-repository PR: https://github.com/gepappas98/pixel-perfect-pixels/pull/133
- Its branch is `feat/research-candidate-findings`; it is retained temporarily for auditability, not approved for deployment.
- Earlier archive/schema work was merged into the wrong repository and some migrations were applied to the canonical Trading Command Center Supabase project. This was not the intended destination.
- Do **not** attempt a blind rollback/drop: first inventory migration history, current table contents, dependencies, RLS/policies, functions, cron jobs, and application callers. Any rollback must be a separately reviewed, data-preserving plan.
- No production source rows should be deleted as part of transferring knowledge to IRL.

This repository is the only intended destination for future IRL implementation. The prior SQL schema is not copied blindly: its concepts must be reconciled with IRL's contract, isolation and evidence requirements first.

## 3. Research-domain knowledge to preserve

### 3.1 Signal and strategy cohorts
- Treat legacy, V2 and V3 as distinct cohorts. Never pool results without a declared cohort definition and compatible scorer/evaluator versions.
- V3 observations are identifiable in the source system by a fingerprint convention such as `source_fingerprint LIKE 'v3|%'`; verify the exact field and current convention against source DDL before relying on it.
- V3 benchmark assumptions recorded in prior project work: take-profit +4%, stop-loss −3%, expiry 72 hours, nominal entry size $1,000, entry at historical candle close. These are benchmark assumptions, not a claim of realized executable performance.
- Auto-switch rules previously required at least 25 resolved observations and positive average PnL; that rule belongs to the source application's strategy-selection behavior and must not be implemented as an IRL execution feature.
- Unresolved or immature samples must not be labelled as losses. Distinguish open, matured, censored, invalid, review-required and verified-resolved states.

### 3.2 Signal-time context and microstructure
Research questions include:
- Multi-timeframe alignment across 5m, 15m, 1h, 4h and 1d, with explicit scorer version and field availability.
- Whale-flow accumulation/distribution transitions and regime waves.
- Technical breadth changes over short windows, BTC market regime, OHLCV and taker-buy data when historically available.
- AI Council signals/lessons, asset-specific sentiment snapshots, news events and whale-flow transition context.
- Event/news → whale-flow → price lead/lag relationships.
- Dynamic watchlist and accumulation status, recorded as time-stamped context rather than reconstructed from today's watchlist.
- Early Entry should be evaluated as a transition hypothesis (bear → neutral → accumulation), not as a rule that waits for a fully established bullish regime.
- News/RSS mention counts can be weak corroborating context; repetition is not proof of causal or predictive value. Reddit was not considered a useful per-asset source in prior research. Do not treat any sentiment source as ground truth.

These are candidate hypotheses, not validated alpha claims. Store feature provenance, source timestamp, knowledge/availability timestamp, freshness, missingness and version.

### 3.3 Paper benchmark and outcome semantics
Prior source-app benchmark settings recorded:
- Binance Spot, long-only paper mode; live orders disabled.
- Nominal paper entry size $1,000.
- Benchmark TP +4%, SL −3%, expiry 72h.
- A separate Flow Lab paper path used a 6h cooldown.
- A displayed $20,000 reference equity was not a cash balance or position cap.
- SELL signals could be skipped under the source application's `LONG_ONLY` behavior.

These settings must be represented as versioned evaluation configuration, not silently assumed for every source record. Distinguish simulated/shadow outcomes from executed trades, and record fees, slippage, candle ordering, TP/SL collision policy, expiry, entry/exit prices and evaluator version. Never infer net PnL from direction labels alone.

### 3.4 Evidence and AI knowledge
The target should support a traceable chain:
1. **Source record**: source system, table, stable ID and source version if available.
2. **Immutable initial observation**: only information available at signal time.
3. **Subsequent events**: later observations and revisions, separately timestamped.
4. **Outcome evaluation**: reproducible rule/version, cohort, maturity/censoring state and cost assumptions.
5. **Finding**: explicit claim, evidence IDs, sample size, uncertainty, exclusions, limitations and reproduction recipe.
6. **Knowledge summary**: bounded, compressed and regenerated from linked evidence, never an unsupported LLM narrative.

Deduplicate by stable source identity and deterministic fingerprint. Retries must be idempotent. Missing history remains missing; never backfill it from current conditions.

## 4. Source-system map and known caveats

The existing Trading Command Center source repo is `gepappas98/pixel-perfect-pixels`. Its canonical runtime Supabase project was verified in source as `yckewtpfttvwiptmmrfq` (`https://yckewtpfttvwiptmmrfq.supabase.co`). This is a **source system only**, not an approved writable IRL backend.

A separate Lovable-attached database context returned materially different schema and row counts. Its exact project ref and the target of `LOVABLE_DB_MIGRATION_URL` were not verified. Do not run migrations through that context.

Point-in-time source inventory from the forensic audit on 2026-10-10 (not current counts):
- `composite_signals`: 30,537 rows.
- `strategy_variant_signals`: 15,164 rows.
- `trades`: 344 rows.
- `pipeline_runs`: 2,253 rows.
- Canonical public tables: 50.
- In an earlier field-coverage query, 24,875 composite signals had a fingerprint; 22,974 had a price-at field; 28,245 had an indicator-snapshot link; 9,615 had a prediction-market snapshot link; 22,895 had an AI Council signal link.

These counts are historical observations. Re-query read-only before sizing an import. Avoid copying full `pipeline_runs.result` JSON; it was previously measured as a major storage consumer (about 229 MB relation size, mostly TOAST, in an earlier snapshot). Store bounded summaries and pointers.

Source identity evidence and unresolved caveats are documented in:
- [P0 audit](P0_AUDIT.md)
- [Supabase project identity map](SUPABASE_PROJECT_MAP.md)

## 5. Candidate source inventory for future read-only mapping

Verify schemas and temporal semantics before ingestion. Candidate sources from prior work include:
- `composite_signals`
- `strategy_variant_signals`
- `trades`
- `pipeline_runs` (summary/pointer only)
- `indicator_snapshots`
- `whale_alerts`
- `asset_sentiment_snapshots`
- `asset_news_events`
- `whale_flow_transition_context`
- `council_signals`
- `council_lessons`
- `dynamic_watchlist_snapshots`
- Event Flow Transmission records and relevant source-specific context tables

The list is a starting point, not a guarantee that all tables exist in the same database or that fields are complete. Confirm primary keys, foreign keys, update behavior, RLS, timestamps and source ownership with read-only metadata.

## 6. P0 acceptance criteria before implementation

- [ ] Confirm IRL's own isolated Supabase/database project reference and writable credentials without exposing secrets.
- [ ] Define a source-to-IRL field map, primary-key strategy, timestamp semantics and bitemporal contract.
- [ ] Define the outcome state machine and evaluator versions, including TP/SL collisions, candle ordering, expiry, fees and slippage.
- [ ] Define cohort compatibility and rules against look-ahead/data leakage.
- [ ] Define idempotent ingestion and explicit exclusions/data-quality states.
- [ ] Set a storage budget and bounded payload policy; include TOAST and index size in measurements.
- [ ] Test ingestion and outcome calculations on a disposable/staging copy before any production-like import.
- [ ] Establish reproducibility tests and evidence-linked finding validation.
- [ ] Keep all execution integration out of scope.

## 7. Immediate next work

1. Finish the IRL repository structure and dependency audit.
2. Resolve the source schema/temporal semantics read-only.
3. Build a field-level dictionary and data contract before designing tables.
4. Create a small, bounded sample fixture with synthetic or sanitized records and tests; no bulk production copy.
5. Only after database identity and isolation are proven, propose an IRL-specific schema migration on a branch for review.


## 8. Read-only containment snapshot of the wrong repository (2026-10-20)

This snapshot was taken after closing wrong-repository PR #133. It is for incident containment, not a transfer confirmation.

- Canonical source database size: **504,573,075 bytes (481 MB)** at the query time; this is above the previously discussed 480 MB warning threshold. Re-measure before attributing growth to any single change.
- `research_evidence`: 3,019 rows; `research_cases`: 3,000 rows; `research_findings`: 0 rows; `research_archive_control`: 1 row.
- Research tables occupy approximately 1,992 kB + 1,512 kB + 40 kB + 32 kB respectively (table+index relation size reported by PostgreSQL).
- The control row currently reports both `allow_archive=false` and `allow_source_delete=false`.
- 551 V3 cases are unresolved. Do not call them failures or mature outcomes without verifying their entry timestamps and the 72-hour horizon.
- Evidence currently references 199 trades, 19 composite signals and 2,801 strategy-variant signals; 0 pipeline-run payloads were copied into `research_evidence`. These are source-linked summaries, not proof that the complete research corpus was transferred to IRL.
- The `research-data-retention` cron remains active at `17 3 * * *` and calls `cleanup_research_data(72,168,false)`. The function's current control row is fail-closed with archive and source deletion disabled; do not assume a cron job is harmless without checking the deployed function body and controls again.
- Existing readiness crons `research-lab-data-readiness` (every 15 minutes) and `research-whale-wave-readiness` (every 5 minutes) are separate pre-existing research collectors/alerts; do not disable them as part of archive cleanup without tracing their purpose.

**Removal decision:** do not drop the four research tables, revert migrations, or disable scheduled jobs blindly. They contain 3,019 evidence rows and 3,000 cases, and the database is close to/over the storage warning line. First export/verify the minimum required metadata, trace all function/policy/cron dependencies, identify the exact changes attributable to the mistaken work, and prepare a reversible rollback plan. The actual record-level transfer into IRL remains blocked until IRL's isolated database is positively identified. No source rows were deleted by the read-only checks.
