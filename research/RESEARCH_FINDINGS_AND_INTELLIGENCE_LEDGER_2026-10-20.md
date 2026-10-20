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
