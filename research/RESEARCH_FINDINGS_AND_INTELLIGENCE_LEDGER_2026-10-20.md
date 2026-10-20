# Research Findings & Intelligence Ledger — 2026-10-20

## Purpose and scope

This is a **conclusions-only research artifact** for Intelligent Research Lab (IRL). It deliberately excludes database dumps, table inventories, raw event histories, and bulk JSON. It preserves what the research has taught us: tested hypotheses, strategy comparisons, implementation decisions, operational failures, and the evidence required to interpret each result. It is a living document, but updates are manual and intentional; no scheduled refresh is authorized.

## Evidence labels

- **Historical shadow benchmark**: retrospective/simulated outcome under the stated assumptions; not proof of realized live or paper-wallet profit.
- **Observed paper state**: application/dashboard snapshot; unrealized PnL is not realized profit.
- **Implemented**: code/feature work recorded as merged or deployed in project history; runtime effectiveness still requires measurement.
- **Hypothesis / pending validation**: a designed or implemented idea for which a clean outcome has not yet been demonstrated.
- **Data-integrity warning**: conflicting counters or inconsistent source paths make the apparent result unsafe to treat as ground truth.

## 1. Historical strategy benchmark — shadow simulation

Recorded benchmark snapshot dated 2026-10-11. Assumptions: take-profit +4%, stop-loss −3%, 72-hour expiry, $1,000 per signal, no position/day caps. These are retrospective benchmark results, not verified realized profits.

| Strategy / preset | Resolved samples | Win rate | Average PnL per sample | Aggregate PnL |
|---|---:|---:|---:|---:|
| BB + Aroon | 1,012 | 48% | +0.38% | +$3,870 |
| SMC Pro | 1,036 | 47% | +0.32% | +$3,360 |
| VWAP + RSI | 1,051 | not reliably recorded in this snapshot | not reliably recorded | +$3,050 |
| Conservative | 2,234 | 44% | not reliably recorded | +$1,790 |

Interpretation:
- BB + Aroon was the strongest of these reported historical shadow cohorts by aggregate PnL and average return in this snapshot.
- SMC Pro and VWAP + RSI also showed positive aggregate shadow results under the same stated assumptions.
- These figures must retain their cohort, window, and benchmark assumptions. Do not label them “live profits” or infer future profitability.
- A preset should not auto-switch merely because its headline total is positive. Existing decision guardrail: require at least 25 resolved samples and positive average PnL; continue to validate stability, costs, drawdown, and out-of-sample performance.

## 2. Real portfolio / accounting evidence — unresolved mismatch

A dashboard snapshot on 2026-10-11 reported 409 open paper positions, approximately $416.3K market value (another contemporaneous view showed roughly $409K entry exposure), and +$7,082.09 unrealized net PnL. At the same time:
- Portfolio Summary showed 0 closed trades and $0 realized PnL.
- Paper Wallet showed zero positions and zero PnL.

Classification: **observed paper state + data-integrity warning**, not realized-profit proof. The discrepancy between dashboard, wallet, and closed-trade accounting must be resolved before those numbers are used as strategy success evidence.

A later point-in-time audit recorded 234 trades, with 98 open paper trades and 30 closed trades in an earlier audit snapshot; these counts are from different times/views and must not be combined as if they were a single consistent snapshot.

## 3. Findings about strategy quality and benchmark cohorts

- Legacy, V2 and V3 must remain distinct cohorts. Never combine their sample counts or performance as though they share identical deduplication, entry logic, or evaluation rules.
- V2 deduplicated benchmark examples exposed substantially larger sample populations than legacy reporting. One recorded V2 snapshot: 2,568 resolved / 3,573 open overall; Accumulation 1,122 resolved, 311 wins / 811 losses, 28% win rate, average PnL −1.06%, aggregate PnL −$11,890. This is a warning that larger samples can reveal a losing cohort hidden by older or smaller samples.
- In that V2 snapshot, SMC / BB / VWAP group performance was reported around 17% win rate in the relevant cohort view. Do not generalize this number to every version or time window without the underlying cohort definition.
- Benchmark outputs can disagree with actual paper execution. Treat benchmark and executed-paper performance as separate evidence streams.

## 4. Implemented ideas and operational changes

These are implementation records, not automatic claims of profitability.

### Multi-timeframe and micro-trend signals
- TradingView signal processing was extended/planned for 5m and 15m snapshots alongside 1h/4h/1d, using Binance as primary and Bybit fallback.
- A Sideways-regime entry rule was specified: require strong bullish alignment across 5m/15m/1h and whale flow above +5%.
- Per-symbol caps and micro-trend gates were introduced in risk-reduction work associated with commits `2120e9f` and `f3f611d`; deployment and runtime efficacy should be verified against the exact current main branch and execution logs.

### Early Entry — predictive regime transition
- Early Entry feature work associated with PR #95 / commit `aec6e4e` was merged to main.
- Intended edge: identify a bear → neutral → accumulation transition before a market is already broadly bullish, rather than chasing a confirmed bullish regime.
- Intended evidence inputs include short-window technical breadth changes, BTC regime, council signals, sentiment snapshots and whale-flow transition context. Event Flow Lab is an optional booster, not a hard blocker.
- Earlier status showed zero opened entries while breadth was bearish (6 bullish / 0 neutral / 44 bearish). A market-regime score was null because the function read a body field that the orchestrator did not send. This is a confirmed integration defect observed at that time, not evidence the strategy has no edge. Verify the fix and instrument candidate → gate → accepted/rejected → opened counts before judging performance.
- Early Entry paper positions are intended to be visually marked purple so their cohort remains identifiable.

### Flow Lab Paper OPEN
- Research-only paper-entry concept: scan 30 assets; require fresh RSS sentiment ≥ +0.25, confidence ≥ 0.55, whale-flow accumulation ≥ +0.10, fresh Binance Spot price, and a 6-hour cooldown.
- It must remain isolated from existing signal strategy and live execution. Initial observation recorded zero positions opened; therefore the entry thesis is pending validation, not a demonstrated winner.
- Per-asset sentiment uses matched RSS items from sources such as Cointelegraph, The Defiant and DL News. Repeated independent hits may strengthen confidence, but duplicate stories/syndicated copies must not be counted as independent evidence. Reddit was rejected as a dependable per-asset sentiment source for this project because access and signal quality were poor.

### Whale-shock coverage
- Whale-shock detection was broadened to 60+ mid-cap assets with a $50k floor and dynamic 150+ alt/gem coverage with a $30k floor, excluding BTC/ETH/SOL from those expanded thresholds.
- This is a coverage change; success must be measured through alert precision, follow-through and net outcome, not alert count alone.

### Sentiment source
- Alternative.me Fear & Greed was added to the signal-combiner in shadow-only mode. Binance long/short ratio was considered as a potential additional source.
- Shadow-only is intentional: sentiment must demonstrate incremental predictive value before it can become a blocking production gate.

### Risk and execution constraints
- Research environment is Binance Spot, long-only paper mode; SELL signals are skipped under `LONG_ONLY`; live orders are disabled.
- A $20,000 reference equity is not a cash balance or a hard exposure cap. Default paper entry size is $1,000.
- Benchmark configuration has used TP +4%, SL −3%, 72h expiry. Flow Lab Paper OPEN has a 6h cooldown.
- Earlier caps included max 3 open positions and $240/day, while later research preferences and cap changes evolved. Record the exact version/config with every result; do not retroactively attribute one cap regime to another.
- Multiple same-symbol paper entries were at one point accepted for research, while later per-symbol cap work aimed to reduce repeated losses. Treat this as a versioned experiment, not a universal invariant.
- Watchdog is alert-only (warning around 1 minute, critical after 3 minutes); it does not automatically close live positions. Do not remove it or infer that it performs execution risk management.

## 5. Important failed assumptions / defects worth retaining

1. **A positive market-wide whale net is not sufficient to call a regime bullish.** A recorded example had about +$10k net against $80.942M volume and still produced a tiny +0.040 score and 100% Sideways. Tiny net-flow ratios should not be interpreted as strong directional conviction.
2. **Orchestrator payload mismatch:** market-regime score was null when a function expected a body field that the orchestrator sent as an empty object. Validate payload contracts end-to-end.
3. **UI/accounting inconsistency:** open positions and unrealized PnL differed from Paper Wallet and closed-trade accounting. Never use dashboard unrealized PnL as realized edge.
4. **Legacy/V2 repeated work:** legacy and V2 performance functions were observed being called repeatedly after the research moved to V3. They are historical reference paths, not authoritative V3 evaluation. Remove or disable only after checking current callers and preserving historical results.
5. **Database volume:** storage was reported at about 526 MB on 2026-10-20, after earlier growth observations around 40.61 MB/day. The research intelligence should retain compact conclusions and provenance, not duplicate raw event data. This reinforces conclusions-only transfer.
6. **No look-ahead / data snooping:** freeze evaluation windows and cohort definitions; separate discovery from confirmation; do not tune gates on the same sample used to claim success.

## 6. Research design principles to preserve

- Keep an append-only conclusions ledger with a stable conclusion ID and links to source run/record IDs where available.
- Every conclusion should include: hypothesis, exact strategy/config version, sample window, sample size, outcome definition, net PnL/expectancy, fees/slippage assumptions, drawdown, counterevidence, confidence level, next falsification test, and provenance.
- Separate evidence classes: historical simulation, shadow signals, paper trades opened, paper trades closed, realized paper PnL, and live results. Do not conflate them.
- Track sequential experiment/sample numbers (101, 102, 103, …) with cumulative sample growth and success-rate evolution per strategy/condition.
- Retain small derived metrics and explainable findings; do not copy full JSON payloads into pipeline logs or intelligence records.
- Keep source database untouched. Do not schedule automatic refreshes; the user decides when to refresh manually.
- Any future data transfer should be this conclusions-and-evidence package, not a full database export or table dump.

## 7. Current evidence gaps / next tests

1. Reconcile realized-vs-unrealized accounting and Paper Wallet discrepancy.
2. Re-run BB + Aroon, SMC Pro and VWAP + RSI under one explicitly versioned, cost-aware evaluation window; report drawdown and expectancy as well as total PnL.
3. Validate V3 separately from Legacy/V2 and ensure the correct function is called by current UI/benchmark consumers.
4. For Early Entry, capture all gate decisions and verify the null regime-score defect is fixed; measure false positives and post-entry excursion before calling it successful.
5. For Flow Lab, measure each gate's pass rate, opened entries, resolved outcomes, fees and counterfactuals; current zero-open observation is not a win.
6. For whale-shock and RSS sentiment, measure precision and incremental predictive lift against a baseline, deduplicating syndicated news.
7. Preserve adverse findings, null results and implementation defects as first-class research outcomes.

## Provenance note

This document consolidates findings previously recorded in project conversations and research summaries through 2026-10-20. Some older benchmark values are available here without their original full run IDs, exact time-window boundaries, or per-trade evidence; those fields are explicitly not invented. They should be backfilled only when matching evidence is retrieved. This file is a structured research knowledge transfer, not a verified complete export of every historical conclusion.


## Update — source-reported archive state and evidence coverage (2026-10-20)
The source repository's latest `PROJECT_STATE.md` reports archive capture and source deletion both disabled, 22,150 eligible source rows still unarchived with missing evidence, 3,000 materialized research cases / 3,019 bounded evidence records, and 551 V3 cases still open with no maturity timestamp. Database size is reported at 464 MB after reindexing; PR #132 and ephemeral PostgreSQL migration tests are complete, while user-controlled Lovable sync/publish and runtime RPC-status verification remain pending. Treat these as source-documented production status, not a fresh independent query from this work session. Archive is paused; no source deletion is reported.


## Update — refresh scope, migration ordering, and strategy eligibility audit
Three additional source-level risks were added to the implementation findings: the knowledge refresh's 72-hour parameter does not bound trade evidence/case scans; the later archive-gate migration replaces the earlier V3-only refresh function with a broader variant scope; and auto-switch branches can consider alternatives with only 8 resolved samples despite the panel's 25-sample “best” threshold. These are source findings, not proof of production runtime behavior. The RPC was not invoked, migrations were not applied, and no strategy switch or production change was made.


## Update — knowledge-case PnL semantics and test coverage
Further review found that case materialization uses `coalesce(net_pnl,pnl)`, which can treat legacy default-zero net PnL as authoritative even where the risk engine has a fallback to nonzero legacy PnL. Trade cases also store lifecycle `status` in `outcome`, unlike variant cases' economic outcome labels. The archive integration fixture seeds only V3 variant fingerprints, so it cannot catch the later migration's broadened V2/Legacy/Unknown scope. Added read-only tests and ephemeral fixture requirements; no repair or production changes.


## Update — experimental exit-policy and maturity-contract parity
Early Entry B/C source code uses a +6% take-profit and −3% stop, with exit-time max-hold/stale policy read from the shared runtime settings rather than pinned in the entry record. Treat it as its own policy cohort, not directly equivalent to V3's +4%/−3%/72h benchmark. Added a read-only invariant check for terminal V3 outcomes without `resolved_at`, which the RPC counts but the knowledge-case maturity mapping excludes. No entry/exit settings or live strategy were changed.


## Live production verification — 2026-10-20 ~15:30 UTC (read-only aggregate queries)
Canonical Supabase project `yckewtpfttvwiptmmrfq` is active. Archive controls remain disabled (`allow_archive=false`, `allow_source_delete=false`); archive status reports 41,465 eligible sources, 0 archived and 41,465 missing evidence. This supersedes the older 22,150-source snapshot.

V3 source/case reconciliation: 2,115 source V3 rows (2,042 open, 73 terminal) versus 551 V3 cases, all open; 1,564 source rows have no case, 54 terminal rows have stale open cases, and 19 terminal rows have no case. Paper trades: 258 source rows (220 closed, 38 open), with 59 missing cases (36 closed, 23 open) and 20 cases with status/PnL/resolution mismatches. The legacy zero-net-PnL pattern was not observed among the 220 closed trades checked (0 affected).

The live refresh function definition is V3-only despite the migration ledger listing the later archive-gate migration whose checked-in SQL has broader variant scope. Recent pipeline result JSON omits `research_knowledge_sync`, and the latest evidence capture was 2026-10-19 22:35:15 UTC despite continuing 10-minute pipeline runs. The exact refresh invocation history remains unobservable; no refresh RPC was called, no migrations were applied, no source rows were modified, and both archive/delete controls remain false.


## Live execution audit — latest 50 completed pipeline runs (2026-10-20 ~07:20–15:30 UTC)
Recorded summary: 135 eligible BUY signals, 46 audited eligible, 89 uncovered; coverage 34.07%, and 4 runs had eligible BUYs but zero audited eligible signals. The 249 recorded audit events included 114 confidence-below-minimum quality gates, 75 per-symbol-cap skips, 27 duplicate-signal skips, 19 accepted BUYs, 7 micro-data-not-ready events (6 stale 5m/15m, 1 missing 5m/15m), 4 micro-pressure cautions, and 3 sideways-gate rejections at whale flow −5.51% versus the required >+5%. No recorded ERROR events appeared in this sample. These counts cover only recorded events and must not be treated as exhaustive because 89 eligible signals were uncovered.

Archive-status timestamp caveat: the live `last_archive_at` field is the maximum capture timestamp across all `research_evidence`, not only retention-source archives. It was non-null while live archive count was zero and both archive/delete gates were false; do not use that timestamp as proof of archival.


## Live storage guard / footprint verification — 2026-10-20 ~15:31 UTC
Database size is 529,591,443 bytes (505.06 MiB), 49,591,443 bytes above the configured 480,000,000-byte guard threshold. The private guard state says it triggered on 2026-10-11 and lists six jobs as paused, including the trading orchestrator; the live cron table shows those six jobs active again. The guard function returns `already_paused` when its trigger timestamp is set and does not reconcile current job states. `market-candle-collector` and `early-entry-variants` are also active and are not in the guard's configured list. This is documented only; no cron, guard state, retention or source data was changed.

Largest measured table-plus-index sizes: strategy_shadow_diagnostics 95.98 MiB; composite_signals 78.63 MiB; strategy_variant_signals 41.99 MiB; pipeline_runs 36.30 MiB; whale_alerts 35.09 MiB; market_candles 30.34 MiB; accumulation_shadow_observations 25.51 MiB. Research evidence and cases together are much smaller (1.95 MiB and 1.48 MiB respectively), so the immediate storage investigation should focus on existing telemetry/history value and retention policy rather than blaming the knowledge archive tables.

Storage watchdog note: the one-minute `storage-capacity-watchdog` cron is inactive. Hourly snapshots crossed the 480,000,000-byte threshold between 2026-10-19 21:13 and 22:13 UTC; size rose from 462,163,091 bytes at 16:13 to 526,970,003 at 2026-10-20 15:13 (+64,806,912 bytes over 23h), and a direct query at 15:31 returned 529,591,443 bytes. The guard's 2026-10-11 trigger remains latched. No schedule/state changes made.


## Live repeated-BUY and exact table-count snapshot — 2026-10-20 ~15:31 UTC
The repeated-BUY ledger has 2,729 rows; 2,694 (98.72%) have null net PnL, 27 are negative, 8 positive, and the 35 non-null values sum to −$355.78. This is not a mature performance verdict. Exact row counts: strategy_shadow_diagnostics 114,933; composite_signals 16,810; strategy_variant_signals 67,867; pipeline_runs 882; whale_alerts 60,251; market_candles 92,377; accumulation_shadow_observations 57,317. These tables dominate measured storage; several pg_stat_user_tables.n_live_tup estimates were substantially inaccurate, so future row counts should use exact aggregates.

Retention/storage alignment: the proposed archive's nine source tables are not the largest measured storage consumers. The dominant footprints are strategy_shadow_diagnostics, composite_signals, strategy_variant_signals, pipeline_runs, whale_alerts, market_candles, and accumulation_shadow_observations. Enabling the current archive alone would not directly address those tables; no archive/delete action is approved or performed.


## Early-entry candle lineage audit — 2026-10-20 ~18:40 UTC
Read-only schema/aggregate inspection confirmed that `early_entry_variant_decisions.metrics` exposes 5m taker-buy metrics, `candle_symbols`, 1h breadth, whale-flow and regime/transition context. The decision rows do not expose a normalized candle source ID or explicit candle open/close/capture timestamps. A direct time-window join against `market_candles` did not establish valid per-decision candle lineage; therefore closed-candle eligibility/look-ahead status remains **unverified**. This is an observability gap, not proof of look-ahead. Next test: inspect the exact scorer/collector code path and the meaning of `candle_symbols`; require explicit source timestamps/closed-candle eligibility if provenance cannot otherwise be established. No production code, schema, cron, strategy, archive or source data was changed.


## Confirmed early-entry candle-integrity risk — 2026-10-20 ~15:46 UTC
Read-only source-code audit of `pixel-perfect-pixels` main confirmed that `market-candle-collector` stores all three returned Binance klines without excluding the in-progress candle. Both `early-entry-variants` and `early-entry-regime` query 5m candles with a lower `close_time` bound but no upper bound (`close_time <= evaluation time`), and select the latest by descending `close_time`. The variant evaluator uses selected taker-buy quote volume in its 5m imbalance and B/C gates/candidate ranking; the baseline evaluator uses it in score/diagnostics and prioritization. Live aggregate evidence: among candles captured in the preceding 30 minutes, 55 5m and 56 15m rows had `close_time > captured_at`, proving in-progress candles were persisted. There were zero rows with `close_time > now()` at query time because that interval had elapsed; that does not negate the capture-time evidence. Historical decision-to-candle lineage remains incomplete, so impact count is not yet quantified. Finding F-72; regression test 73 added. No production code, data, schema, cron, strategy, or deployment changed.


### Production candle-integrity fix — 2026-10-20
- **Confirmed and fixed prospectively:** collector v3 filters unfinished Binance candles before upsert; early-entry variants v8 and baseline regime v13 independently reject rows unless `close_time < evaluationAt` and `captured_at <= evaluationAt`, with in-memory guards.
- **Verification:** deployed definitions re-read and predicates confirmed; 13/13 code-level assertions passed; CI run [39453060338](https://github.com/gepappas98/pixel-perfect-pixels/actions/runs/39453060338) succeeded with all three functions type-checked and 6/6 Deno regression tests passing. Post-deploy runtime check: the 16:00 UTC collector/variants cron runs succeeded; first run refreshed 110 rows per timeframe. A cumulative audit after deployment found 218 5m and 112 15m rows captured post-deploy, with zero captured before close and zero still unclosed at audit time. Existing cron schedules remain unchanged.
- **Historical caveat:** decisions/trades do not retain an immutable candle identity and full timestamps, so exact contaminated counts are unknown. Potentially exposed pre-fix population at the 15:56 UTC cut-off: 2,528 variant decisions without candle timestamps (A_CURRENT 833 NO_ENTRY + 19 PAPER_OPEN; B 838 NO_ENTRY; C 838 NO_ENTRY) and 19 baseline paper entries (12 closed, 7 open at cut-off). These counts do not prove those decisions consumed unfinished candles; exact contamination remains unknown. No historical rows/outcomes were modified.
- **Evidence:** `pixel-perfect-pixels` commits `e0d76fa`, `c60d0dd`, `a7fe433`, `0617f1e`, `1e71f9c`, `09e7667`; detailed record F-20261020-73 in the strategy findings file.


Baseline runtime verification update — 2026-10-20 16:32 UTC: the 16:00 orchestrator run stopped at `whale-watch` HTTP 500 before `early-entry-regime`. Successful 16:20 and 16:30 cycles subsequently invoked the baseline function with HTTP 200, `status=observed`, zero opened entries, and no entry errors. At 16:30 the evaluation time was 16:30:22.034Z, latest candle close 16:29:59.999Z and capture 16:30:11.256Z; both time bounds passed. `breadth_improving=false` and `whale_turning_positive=false` explain the no-entry result under unchanged gates. The earlier pending direct-runtime-telemetry item is resolved; no manual invocation was used.


## Early-entry variant scheduler race and offset — 2026-10-20 16:30 UTC
Read-only timing reconciliation found that collector job 19 and variant job 21 both fired on the ten-minute boundary. The 16:20 variant evaluation at 16:20:01.277 UTC used the last 5m candle closed at 16:09:59.999 UTC and captured at 16:10:09.994 UTC, while the collector finished capturing the 16:19:59.999 UTC candle at 16:20:11.182 UTC. The temporal guard was working (no look-ahead), but variants were one collection interval behind. The baseline `early-entry-regime` ran later in the orchestrator and used the 16:19:59.999 UTC candle captured before its 16:20:38.978 UTC evaluation.

Production-only schedule correction: job 21 `early-entry-variants` changed from `*/10 * * * *` to `1-59/10 * * * *`; collector job 19 remains `*/10 * * * *`. This changes no strategy gates or trade parameters. Schedule read-back succeeded at 16:30:01 UTC; first post-change execution at 16:31 UTC still requires confirmation. At that read, post-deploy candle rows were 322 5m and 164 15m, with zero captured before close. See F-20261020-74 in the strategy findings file. No historical rows or outcomes changed.


### Scheduler-offset runtime verification — 2026-10-20 16:31 UTC
The first offset variant run succeeded (job 21 at 16:31:00.396Z). All A/B/C decisions used `evaluation_at=16:31:00.661Z`, candle close `16:29:59.999Z`, and capture `16:30:11.256Z`: close lag 1.01 minutes and capture age 0.82 minutes, versus ~10.02 and ~9.85 minutes on the previous aligned run. All three were `NO_ENTRY`; no trade gate was changed. Job 21 active schedule is `1-59/10 * * * *`; collector job 19 remains `*/10 * * * *`. Post-deploy integrity totals now 426 5m / 217 15m rows with zero captured before close. This is one successful post-offset cycle; continue passive monitoring.


Follow-up live audit — 2026-10-20 16:32 UTC: the 16:31 variant cycle succeeded and reduced the newest selected candle's close lag to 1.01 minutes / capture age to 0.82 minutes. The 16:30 baseline cycle also passed both timestamp bounds and had no gate-qualified entry. Post-deploy candle integrity aggregate: 643 rows across 5m/15m; zero captured before close and zero still unclosed at query time. No post-deploy early-entry paper trades found. First offset cycle passed; keep monitoring without changing gates.


Decision lineage reconciliation — 2026-10-20 16:32 UTC: all 12 post-deploy variant decisions (4 each for A/B/C) contained evaluation/close/capture timestamps and passed both temporal inequalities; all were NO_ENTRY. No post-deploy early-entry paper trade was found. Candle collector audit: 426 5m and 217 15m rows since deploy, zero captured before close. For the 19 pre-deploy baseline paper trades, 19/19 had gate diagnostics but 0/19 had candle evaluation/close/capture timestamps or source references. This confirms why exact historical contamination cannot be counted; do not retroactively relabel trades.


Gate interpretation from the first offset cycle: 53 candle symbols; whale turn true, but aggregate 5m taker-buy imbalance `-0.1512` and 1h bullish breadth delta `0`. B/C therefore correctly remained NO_ENTRY under their existing positive-taker-buy and breadth/adaptive requirements. This is one observation of gate behavior, not an edge or profitability claim.


## 2026-10-20 — Normalized Early Entry candle lineage deployed
Production table `public.early_entry_candle_lineage` applied with RLS, no anon/authenticated grants, service_role-only writes, timestamp validity check, and indexes. It stores per-evaluation candle identity (symbol/timeframe/open/close/captured/source), not raw OHLCV. Both evaluators deployed: `early-entry-variants v9`, `early-entry-regime v14`. Decision metadata now carries a UUID `candle_evaluation_id` and observable `candle_lineage_write_status`; inserts are best-effort to preserve strategy gates. Regression test source added. Await normal scheduled runs to verify lineage rows and timestamps. No historical backfill/reclassification.


First lineage runtime check (16:41 UTC): variants v10 persisted 52 normalized candle rows for 52 symbols under evaluation ID `d00c0701-88f0-4a00-b9eb-d4f757b71b00`; A/B/C decision metadata matched that ID and all rows passed the DB timestamp checks. The baseline invocation at 16:40 occurred during rollout and used the previous function revision, so its lineage write failed due to missing `evaluation_at`; the call itself returned HTTP 200 and opened zero trades. Version v15 includes the fix; wait for its next scheduled invocation to verify. No manual execution.


Storage efficiency follow-up at 16:44 UTC: removed unused direct decision/trade FK columns and a redundant standalone evaluation index; evaluation ID remains in strategy decision/trade metadata and the unique index still supports evaluation-ID prefix lookups. Existing 52 lineage rows preserved. Table+index footprint decreased from 120 kB to 96 kB. Migration: `20261020171000_early_entry_lineage_storage_trim.sql`. No strategy change.


Access hardening: explicit RLS policy now grants table policy access only to `service_role`; anon/authenticated still have no SELECT privilege. Supabase security advisor returned no finding for this table. Migration `20261020171500_early_entry_lineage_service_role_policy.sql`. The symbol/time index is intentionally retained for future audits despite being currently unused on the new table.


Defensive timestamp hardening at 16:48 UTC: historical latest-per-symbol rows include some `captured_at < close_time` records, but the active 15-minute input window had zero such rows for both timeframes at audit time. Both evaluators now reject pre-close-captured records in memory as a third temporal condition; current valid rows and strategy gates are unchanged. Deployed versions variants v11 / baseline v16. No historical rewrite.
