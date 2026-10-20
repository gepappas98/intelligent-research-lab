# Strategy & Implementation Findings — source-code review, 2026-10-20

## Provenance and scope
Read-only review of source repository `gepappas98/pixel-perfect-pixels` at commit `4e55ba120f37fe959d8dd4256ee6536cedfe5253` (2026-10-19 UTC). Findings below describe implementation, not proof of profitability. Related files are linked to that exact commit so future manual reviews can compare revisions.

## Finding F-20261020-01 — Early Entry requires a canonical regime transition
**Status:** implemented; effectiveness unresolved. **Confidence:** high for code behavior, low for edge.

The `early-entry-regime` function explicitly reads recent 1h breadth, whale-flow balance, prior regime observations and fresh canonical `market_regime_telemetry`; canonical telemetry must have `data_status='ok'` and be no older than 20 minutes. The documented intent is a bearish/sideways → bullish transition without a price-confirmation gate. Open paper entries are tagged `early-entry-regime`, `spot-long-only`, `research-unbounded`, and `purple-label`; metadata records strategy version, transition timing and gate diagnostics.

- Source: [early-entry-regime/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/early-entry-regime/index.ts)
- Orchestration: [trading-pipeline-orchestrator/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trading-pipeline-orchestrator/index.ts)
- Source-backed aggregate snapshot (2026-10-20): 6 resolved `early_entry_regime/buy` cases, mean net PnL −$8.5568, total −$51.3407, entry window 2026-10-16 23:00 to 2026-10-19 15:10 UTC. This is a tiny sample and cannot establish failure or success.
- Important operational clue: older runs had a reported null `market_regime_score` because the function expected `body.market_regime_score` while orchestration called it with an empty body. Current source includes a fallback using canonical telemetry and records component sample counts; verify deployed version and persisted diagnostics before assuming the defect is fully resolved.
- Next test: join each decision/entry to its eventual trade outcome and saved gate diagnostics; segment by regime transition age and telemetry freshness; compare a frozen out-of-sample window.

## Finding F-20261020-02 — Event → Flow Lab is an independent paper-only confirmation strategy
**Status:** implemented; effectiveness currently adverse in small sample. **Confidence:** high for code behavior, moderate for aggregate observation.

The `event-flow-paper-open` function requires fresh RSS consensus, whale-flow snapshots and Binance Spot price. Thresholds in the reviewed code: sentiment age ≤20 minutes, sentiment score ≥+0.15, confidence ≥0.45, flow age ≤20 minutes, flow score ≥+0.10 and dominant state `accumulation`, price age ≤20 minutes, plus one active position per symbol and a 15-minute cooldown. Position size is $1,000; TP +4%, SL −3%; fee rate configured at 0.1%. It stores source timestamps, counts, confidence and flow context in entry metadata, and tags entries research-only/paper-only.

- Source: [event-flow-paper-open/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/event-flow-paper-open/index.ts)
- UI labels it “PAPER OPEN strategy · research-only · live orders disabled”: [EventFlowTransmissionPanel.tsx](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/src/components/trading/EventFlowTransmissionPanel.tsx)
- Source-backed aggregate snapshot (2026-10-20): 16 resolved `event_flow_paper/buy` cases, mean net PnL −$6.4924, total −$103.8778, entry window 2026-10-14 17:05 to 2026-10-19 12:20 UTC. Small, potentially regime-clustered sample; no claim of stable expectancy.
- Next test: compare accepted entries with rejected `event_flow_paper_decisions`; quantify which gate adds incremental value; stratify by sentiment confidence, unique RSS items, flow score and regime. Freeze logic before the next non-overlapping window.

## Finding F-20261020-03 — Pipeline compacts redundant payloads
**Status:** implemented in reviewed commit. **Confidence:** high for code behavior.

The orchestrator stores summaries instead of duplicating full whale-alert arrays and composite-signal rows inside each `pipeline_runs` JSONB result. The canonical details remain in `whale_alerts` and `composite_signals`. This is a useful storage-control pattern: keep one canonical raw source and reference it, rather than repeatedly embedding large payloads. It does not mean all pipeline storage has been proven compact or that historical bloat has been removed.

- Source: [trading-pipeline-orchestrator/index.ts at 4e55ba1](https://github.com/gepappas98/pixel-perfect-pixels/blob/4e55ba120f37fe959d8dd4256ee6536cedfe5253/supabase/functions/trading-pipeline-orchestrator/index.ts)
- Next test: measure actual serialized `pipeline_runs` row-size growth across new runs; compare before/after without rewriting historical rows.

## Finding F-20261020-04 — The latest paper cohorts disagree; no global strategy verdict
**Status:** observed aggregate evidence; replication pending. **Confidence:** moderate for the recorded snapshot, low for generalization.

The point-in-time source query recorded:
- `cmc_paper/buy`: 114 resolved, mean net +$2.0424, total +$232.8319 (2026-10-16 12:40 to 2026-10-19 20:20 UTC). Promising only as a hypothesis; confirm costs, cohort definition and replication on a non-overlapping window.
- `standard/buy`: 28 resolved, mean net −$21.0035, total −$588.0989 (2026-10-15 17:40 to 2026-10-19 08:40 UTC). Adverse observation; inspect regime, symbol concentration, entry context and exits before changing gates.
- These are USD net-PnL aggregates for source cohort `Unknown` / scorer `paper-trade`, not V2/V3 benchmark results and not evidence of live profitability. Source row IDs/run IDs were not retained in the aggregate extract, so provenance is incomplete and should be improved on the next manual query.

## Finding F-20261020-05 — V2 benchmark results are materially adverse in the inspected slice
**Status:** exploratory aggregate; exact full benchmark window/selection needs confirmation. **Confidence:** moderate for counts captured, low for broad generalization.

The source-backed slice recorded negative summed PnL percentage points across the listed V2 groups: Accumulation 80 resolved win/loss cases (25 wins, 55 losses; −65.0 pp); AI-driven 82 wins/losses plus 47 expired (−150.4458 pp); Balanced 56 wins/losses plus 25 expired (−126.6414 pp); Chart-trader 206 wins/losses plus 38 expired (−329.9108 pp); Conservative 227 wins/losses plus 62 expired (−327.6715 pp); SMC-reversal 317 wins/losses plus 58 expired (−493.1013 pp); Volatility-timing 321 wins/losses plus 57 expired (−491.3329 pp); VWAP-momentum 322 wins/losses plus 58 expired (−494.1013 pp); Whale-focused 230 wins/losses plus 64 expired (−329.9122 pp). Expired rows must remain explicit: some carry negative recorded PnL and must not be silently discarded or reclassified as wins. The slice is narrow and clustered around 2026-10-15; it is not a V3 verdict.

- Next test: rerun using a frozen cohort/window contract, verify expiry accounting and outcome labels, report net-of-cost expectancy and unresolved fraction separately by variant.

## Research priorities, ordered
1. Reconcile every resolved paper result to a stable trade ID, entry source, entry/exit timestamps, fees and net PnL; retain unresolved counts.
2. Inspect negative Standard and Event Flow results by regime/symbol/gate/exit before modifying strategy logic.
3. Link Early Entry `NO_ENTRY` / `PAPER_OPEN` decisions to later outcomes and persisted diagnostics.
4. Freeze and test CMC Paper on a non-overlapping window before calling its positive aggregate repeatable.
5. Recompute V2 benchmark slices with explicit expiry treatment; keep them separate from V3 and actual paper trades.

## Limitations
This is a code-history review plus already captured aggregate evidence, not a fresh full-database export or exhaustive replay. It does not alter source rows or production strategy behavior. A future user-requested manual refresh should preserve exact source IDs, run IDs, query/window metadata and cohort filters alongside every aggregate.
