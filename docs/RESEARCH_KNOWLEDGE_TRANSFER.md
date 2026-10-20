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


### Current retention preflight (read-only, 2026-10-20)

The deployed `get_research_archive_status(72,168)` returned `status=incomplete`: **29,788 eligible source records, 0 archived, 29,788 missing evidence** across nine retention-source tables. By table: asset news 362; flow snapshots 9,360; whale snapshots 1,397; price snapshots 9,360; whale transitions 537; event-flow transmissions 1; sentiment snapshots 7,698; whale-shock followups 536; whale transition context 537. The result reports both archive and source-delete controls disabled. This is why enabling retention or deleting archive tables now would be unsafe. The reported `last_archive_at` is not evidence that these retention-source records were archived; the current evidence rows are concentrated in trades/signals/variants instead.


### Superseding recheck (2026-10-20, later read-only query)

A later query returned 504,605,843 bytes (481 MB), 3,019 evidence rows, 3,000 cases, 0 findings, and 1 archive-control row. The latest archive preflight returned 29,790 eligible/missing source records (not 29,788): whale-shock followups now report 538 rows. Both archive and source-delete controls remain disabled.

The live policy inventory also showed permissive SELECT policies (`USING (true)`) for `anon` and `authenticated` on `research_evidence`, `research_cases`, and `research_findings`. This is a least-privilege review item. No policy was changed during this audit; policy changes should be reviewed separately from destructive rollback.


### Fresh superseding recheck — 2026-10-20 05:31 UTC

A later read-only SQL query supersedes the prior byte-size and retention counts above:

- Database size: **505,736,339 bytes (505.74 MB decimal / 482.31 MiB binary)**.
- Archive table counts remain: 3,019 evidence rows, 3,000 cases, 0 findings, 1 control row.
- Retention status remains `incomplete`: **30,084 eligible source records, 0 archived, 30,084 missing evidence**.
- Current missing counts: asset news 363; asset flow snapshots 9,450; whale flow snapshots 1,416; asset price snapshots 9,450; whale transitions 545; event-flow transmissions 1; asset sentiment snapshots 7,773; whale-shock followups 541; whale transition context 545.
- Archive relations together occupy 3,661,824 bytes (~3.49 MiB); removing them alone would not resolve the overall storage issue.
- A live read-only query verified the cleanup control row remains `allow_archive=false` and `allow_source_delete=false`; the deployed `cleanup_research_data(72,168,false)` body returns before source DELETE under those flags. The scheduled cleanup function was not invoked.
- Live RLS catalog still shows `USING (true)` SELECT policies for `anon` and `authenticated` on all three archive tables. No policy was changed.
- No production records have been exported to a secure artifact or copied to IRL. No rows were deleted; no schema, function, policy, cron, or trading behavior was changed by these checks.

The remaining next step is still destination identity verification and a verified secure export plan—not migration or deletion.

## 9. Research experiment registry seeds — historical configuration, not live gates

The following preserves specific prior experiments for later, isolated evaluation. These are **historical configurations/hypotheses**, not instructions to change source-app trading behavior and not claims of predictive edge.

### Early Entry transition experiment

- Research question: can a bear → neutral → accumulation transition be detected before the broader regime is already bullish?
- Candidate features: short-window technical breadth deltas; BTC regime; 5m/15m/1h/4h/1d alignment; OHLCV and taker-buy imbalance when historically available; Council signals/lessons; asset-specific sentiment snapshots; whale-flow transition context.
- Event Flow/news transmission is an optional corroborating booster, not a hard eligibility gate.
- Compare separately versioned paper variants. Preserve the requested purple UI label as presentation metadata only; do not use color as a cohort identity.
- Historical observation: an earlier strict run had zero entries while breadth was bearish (6 bullish / 0 neutral / 44 bearish) and a market_regime_score was NULL because a function read a body field while the orchestrator sent an empty object. Treat missing score and no-entry runs as diagnostic states, not evidence that the hypothesis failed.

### RSS/news-to-whale-flow experiment

- Prior design preference was free, no-login/no-API RSS sources, including Cointelegraph, The Defiant and DL News, plus a larger feed set (~20 sources), matched against the dynamic asset watchlist.
- Historical Flow Lab Paper OPEN conditions were: fresh per-asset RSS sentiment ≥ +0.25; confidence ≥ 0.55; whale-flow accumulation score ≥ +0.10; fresh Binance Spot price; 6-hour per-symbol cooldown. One observed initial run opened zero positions. Reconfirm the source configuration and code before reproducing.
- Repeated relevant mentions may raise a corroboration score but are not independent proof of direction or causality. Preserve feed URL, publication/observation/ingestion timestamps, deduplication key and asset match.
- Reddit was rejected as the preferred per-asset sentiment source because the observed coverage/login constraints made it unsuitable for this workflow. Do not treat this preference as a universal statement about Reddit data quality.

### Micro-timeframe and whale-flow regime experiments

- Prior micro-timeframe work added 5m/15m snapshots with Binance as primary and Bybit fallback, alongside 1h/4h/1d. Preserve per-source freshness and fallback provenance.
- A proposed Sideways-regime entry hypothesis required strong bullish 5m/15m/1h alignment plus whale-flow score above +5%. This remains an experiment to test out-of-sample, not a universal rule.
- A prior whale-shock detector used approximate floors of $50,000 for a 60+ mid-cap set and $30,000 for a larger 150+ alt/gem set, excluding BTC/ETH/SOL from the latter. Store the actual symbol universe and threshold version per observation; do not apply these thresholds retroactively to data that did not record them.
- A known regime-scoring failure mode: approximately +$10,000 net flow on ~$80.942 million total flow was mapped to a positive score around +0.040 and 100% Sideways because a sign-based transform treated a tiny net imbalance as meaningful. This is a calibration/unit-scaling issue to test explicitly; a positive sign alone is not evidence of directional strength.

### Council-learning provenance

- The source app generates post-mortems for closed paper trades and fetches a bounded number of lessons per symbol. Lessons are outcome-derived and must be timestamped as later knowledge; never feed a trade's own post-mortem back into its entry-time feature set.
- Keep source trade ID, lesson generation time, source strategy/cohort, and whether the provenance lookup succeeded. Unresolved lesson links remain unresolved; do not automatically relink or delete them.

IRL should represent each experiment with immutable configuration/version, predeclared outcome horizon, eligibility/exclusion rules, point-in-time feature availability, and a chronological out-of-sample evaluation plan. Do not connect these experiment definitions to the source app's live scorer or automatic strategy switch.

## 10. Prioritized reproducibility backlog

These are research tasks to resolve with read-only source inspection and reproducible fixtures before drawing conclusions or changing the source application's behavior.

1. **MTF scorer parity:** compare the exact live scorer formula with the V2/V3 variant scorer formulas, including timeframe inputs, weights, missing-timeframe handling, normalization, threshold semantics and version tags. The earlier working hypothesis was that scorer/variant inconsistency could mislead demote-only auto-switch evaluation. Do not assume formulas are aligned because labels are similar; do not change trading behavior as part of IRL research.
2. **First PAXG BUY forensic trace:** identify the exact current source signal and linked trade/variant records, then trace source IDs, timestamps, pipeline run, scorer/config version, MTF snapshots, strategy preset and available whale/sentiment/context inputs. Older narrative analyses are not evidence for a new signal. If the current record cannot be uniquely identified, mark the investigation blocked rather than guessing.
3. **V3 maturity/display consistency:** investigate reports such as a V3 variant panel showing zero resolved observations. Reconcile source outcome labels, resolver timestamp, entry time, the defined 72-hour horizon, evaluator version and UI filters. Do not infer failure from zero resolved or label an old open record as a loss.
4. **Research archive temporal integrity:** preserve raw source timestamps and independently validate when data became available. Existing archive `created_at` → `observed_at/available_at` mapping is unverified and must not be used as a validated point-in-time backtest contract.
5. **Storage/capture safety:** keep archive and source-delete controls disabled while the eligible-source coverage is incomplete. The current retention function's early-return guard was verified read-only; no cleanup invocation or data deletion is part of this work.

Each task should end with source-linked evidence, a versioned reproduction recipe, explicit unknowns and a conclusion that separates verified facts from hypotheses.

## 11. MTF scorer parity — verified source history (2026-10-20)

Read-only inspection of source commit 07a1dabea37a437214271e126113ef35f0de4bca (https://github.com/gepappas98/pixel-perfect-pixels/commit/07a1dabea37a437214271e126113ef35f0de4bca) confirms the explicit scoring-generation boundary:

- **Before V3:** the variant scorer used only the primary 4h direction for its technical contribution (+technical weight for bullish, −technical weight for bearish); 1h and 1d were not part of that variant score. Preserve these historical observations as V2; do not recalculate or rewrite them.
- **V3/current live base scorer:** the production ruleBasedRecommendation() and calculateVariant() both call the shared calculateWeightedMtfScore() helper for the same 4h/1h/1d inputs with weights 1.0 / 0.65 / 0.65.
- The helper calculates signed directional weight divided by the total weight of available frames. Missing frames are excluded from the denominator; an available neutral frame contributes zero directional weight but remains in the denominator and therefore dilutes the directional score.
- The source commit changed the variant fingerprint prefix from v2| to v3| and added separate V3 performance aggregation. This is the correct cohort boundary for the corrected scorer.
- Six Deno regression tests cover aligned bullish/bearish frames, conflicting frames, missing-frame exclusion, neutral-frame dilution and no available frames.
- calculateConfiguredShadow() still contains the older multiplicative 1.3/0.7 formula, but current call-site inspection shows it is used as a diagnostic shadow comparator. It is not the ruleBasedRecommendation() production base score and should not be confused with the shared V3 scorer.

**Conclusion:** current live base scoring and V3 variant scoring are aligned on the directional MTF formula and weights. Historical V2 is intentionally incompatible because its variant technical component used only 4h. The old diagnostic shadow formula is a separate comparator. This code-level result does not certify live deployment/version parity or historical outcomes; verify deployed Edge Function versions and record-level fingerprints before drawing performance conclusions. No code or data was changed during this analysis.

## 12. Live deployment and V3 cohort snapshot — 2026-10-20 05:35 UTC

Read-only inspection of the canonical Supabase Edge Function registry confirmed:

- `signal-combiner`: ACTIVE, version 41, updated 2026-10-19 16:54:22 UTC. Its deployed source imports the shared MTF helper and writes the `v3|...` variant fingerprint.
- `strategy-auto-switch`: ACTIVE, version 11, updated 2026-10-19 16:54:29 UTC. Its deployed source reads `get_variant_performance_v3(7)`, with a source-table fallback filtered to the V3 fingerprint.
- `variant-resolver`: ACTIVE, version 8, updated 2026-10-15 05:08:42 UTC. It has a resolver start cutoff of 2026-10-06 09:57 UTC and a 72-hour expiry trigger. The resolver is outcome evaluation, not the MTF scoring implementation.

A read-only SQL snapshot of `strategy_variant_signals` as of 2026-10-20 05:35 UTC found, across the V3 fingerprint cohort:
- 1,345 rows total, all BUY variants; 1,306 still open and 39 terminal with non-null resolver timestamps/PnL.
- Those 39 resolved rows comprise 31 wins and 8 losses; no expired rows in this snapshot.
- By preset: accumulation 12 resolved (10 wins, 2 losses), whale-focused 15 (9 wins, 6 losses), and each of ai-driven, balanced, conservative, smc-reversal and vwap-momentum has 2 wins; chart-trader has 0 resolved. All other preset samples are still very small.
- The deployed auto-switch code requires at least 25 resolved rows and positive average PnL for a preset to qualify as a fully supported candidate. No V3 preset currently reaches 25 resolved rows. The 39 total observations across different presets must not be treated as 39 independent samples for one preset or as validated strategy edge.

The database RPC `get_variant_performance_v3(7)` and a raw source-table aggregation returned identical per-preset results in this read-only comparison. Thus, as of this timestamp, the canonical database does not have zero resolved V3 rows; a UI still showing zero would require checking its refresh time, selected cohort, deployed frontend build and effective database target rather than assuming the RPC or historical records are empty.

These are early, in-sample operational observations, not an endorsement of any strategy. No strategy switch was triggered by this audit; no Edge Function, strategy setting, row or deployment was changed.
